import { GraphQLError } from 'graphql';
import { db } from './db/index.ts';
import {
  abacPoliciesTable,
  rolePoliciesTable,
  userRolesTable,
  userPoliciesTable,
  abacPolicyRulesTable,
} from './db/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

export type ResourceType = 'users' | 'collections' | 'entries' | 'assets' | 'fields';
export type ActionType = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'publish' | 'unpublish' | 'schedule'
  | 'archive' | 'restore' | 'draft'
  | 'ban' | 'unban' | 'activate' | 'deactivate'
  | 'upload' | 'download' | 'transform'
  | 'configure_fields' | 'manage_schema';

export interface PermissionContext {
  userId: string;
  resource: {
    type: ResourceType;
    id?: string;
    ownerId?: string;
    [key: string]: unknown;
  };
  action: ActionType;
}

/**
 * Get all policy IDs applicable to a user (from roles and direct assignments)
 */
async function getUserPolicyIds(userId: string): Promise<string[]> {
  // Get user's roles
  const userRoles = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));

  const roleIds = userRoles.map(ur => ur.roleId);

  // Get policies from roles
  const rolePolicies = roleIds.length > 0
    ? await db
        .select({ policyId: rolePoliciesTable.policyId })
        .from(rolePoliciesTable)
        .where(inArray(rolePoliciesTable.roleId, roleIds))
    : [];

  // Get direct user policies
  const directPolicies = await db
    .select({ policyId: userPoliciesTable.policyId })
    .from(userPoliciesTable)
    .where(eq(userPoliciesTable.userId, userId));

  // Combine and deduplicate
  const allPolicyIds = [
    ...rolePolicies.map(rp => rp.policyId),
    ...directPolicies.map(dp => dp.policyId),
  ];

  return [...new Set(allPolicyIds)];
}

/**
 * Evaluate ABAC policies for a given permission context
 */
export async function checkPermission(context: PermissionContext): Promise<boolean> {
  const { userId, resource, action } = context;

  // Get all policy IDs for this user
  const policyIds = await getUserPolicyIds(userId);

  if (policyIds.length === 0) {
    // No policies = no permissions
    return false;
  }

  // Get matching policies for this resource and action
  const policies = await db
    .select()
    .from(abacPoliciesTable)
    .where(
      and(
        inArray(abacPoliciesTable.id, policyIds),
        eq(abacPoliciesTable.resourceType, resource.type),
        eq(abacPoliciesTable.actionType, action),
        eq(abacPoliciesTable.isActive, true)
      )
    )
    .orderBy(abacPoliciesTable.priority);

  // Process policies in priority order (higher priority first)
  // DENY policies should be evaluated before ALLOW
  const denies = policies.filter(p => p.effect === 'DENY');
  const allows = policies.filter(p => p.effect === 'ALLOW');

  // Check DENY policies first
  for (const policy of denies) {
    const matches = await evaluatePolicyRules(policy.id, context);
    if (matches) {
      // Explicit DENY - reject immediately
      return false;
    }
  }

  // Check ALLOW policies
  for (const policy of allows) {
    const matches = await evaluatePolicyRules(policy.id, context);
    if (matches) {
      // Found an ALLOW that matches
      return true;
    }
  }

  // No matching ALLOW policies = deny
  return false;
}

/**
 * Evaluate the rules for a specific policy
 */
async function evaluatePolicyRules(
  policyId: string,
  context: PermissionContext
): Promise<boolean> {
  const rules = await db
    .select()
    .from(abacPolicyRulesTable)
    .where(
      and(
        eq(abacPolicyRulesTable.policyId, policyId),
        eq(abacPolicyRulesTable.isActive, true)
      )
    )
    .orderBy(abacPolicyRulesTable.order);

  if (rules.length === 0) {
    // No rules = policy matches by default
    return true;
  }

  // Get the policy to check rule connector (AND/OR)
  const [policy] = await db
    .select()
    .from(abacPoliciesTable)
    .where(eq(abacPoliciesTable.id, policyId));

  if (!policy) {
    return false;
  }

  const ruleConnector = policy.ruleConnector;

  // Evaluate each rule
  const ruleResults = rules.map(rule => evaluateRule(rule, context));

  // Combine results based on connector
  if (ruleConnector === 'AND') {
    return ruleResults.every(result => result);
  } else {
    // OR
    return ruleResults.some(result => result);
  }
}

/**
 * Evaluate a single rule against the context
 */
function evaluateRule(
  rule: typeof abacPolicyRulesTable.$inferSelect,
  context: PermissionContext
): boolean {
  const { attributePath, operator, expectedValue } = rule;

  // Get the actual value from context based on attribute path
  const actualValue = getAttributeValue(attributePath, context);

  // Parse expected value based on type
  const parsedExpectedValue = parseValue(expectedValue, rule.valueType);

  // Perform comparison based on operator
  return compareValues(actualValue, operator, parsedExpectedValue);
}

/**
 * Extract attribute value from context based on path
 */
function getAttributeValue(path: string, context: PermissionContext): unknown {
  // Parse paths like "subject.id", "resource.collection.id", etc.
  const parts = path.split('.');

  switch (parts[0]) {
    case 'subject':
      if (parts[1] === 'id') return context.userId;
      break;
    
    case 'resource':
      if (parts.length === 2) {
        // resource.id, resource.ownerId, etc.
        return context.resource[parts[1]];
      }
      // Nested resource attributes like resource.collection.id
      return context.resource[parts.slice(1).join('.')];
    
    case 'action':
      if (parts[1] === 'type') return context.action;
      break;
  }

  return undefined;
}

/**
 * Parse expected value based on its type
 */
function parseValue(value: string, type: string): unknown {
  try {
    switch (type) {
      case 'string':
        return value;
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'uuid':
        return value;
      case 'datetime':
        return new Date(value);
      case 'array':
        return JSON.parse(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}

/**
 * Compare actual value with expected value using operator
 */
function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    
    case 'ne':
      return actual !== expected;
    
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    
    case 'gte':
      return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    
    case 'lte':
      return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;
    
    case 'starts_with':
      return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
    
    case 'ends_with':
      return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
    
    case 'is_null':
      return actual === null || actual === undefined;
    
    case 'is_not_null':
      return actual !== null && actual !== undefined;
    
    case 'regex':
      if (typeof actual === 'string' && typeof expected === 'string') {
        try {
          const regex = new RegExp(expected);
          return regex.test(actual);
        } catch {
          return false;
        }
      }
      return false;
    
    default:
      return false;
  }
}

/**
 * Helper to require specific permission (throws if not allowed)
 */
export async function requirePermission(context: PermissionContext): Promise<void> {
  const allowed = await checkPermission(context);
  
  if (!allowed) {
    throw new GraphQLError(
      `Permission denied: ${context.action} on ${context.resource.type}`,
      {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 },
          resource: context.resource.type,
          action: context.action,
        },
      }
    );
  }
}

/**
 * Batch check multiple permissions (useful for filtering lists)
 */
export function checkPermissions(
  contexts: PermissionContext[]
): Promise<boolean[]> {
  return Promise.all(contexts.map(ctx => checkPermission(ctx)));
}
