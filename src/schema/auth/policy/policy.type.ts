import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import {
  abacPolicyRulesTable,
  usersTable,
  rolePoliciesTable,
  rolesTable,
  userPoliciesTable,
  attributePathEnum,
  operatorEnum,
  valueTypeEnum,
  permissionActionEnum,
} from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

// Type helpers
type AttributePath = typeof attributePathEnum.enumValues[number];
type Operator = typeof operatorEnum.enumValues[number];
type ValueType = typeof valueTypeEnum.enumValues[number];
type PermissionAction = typeof permissionActionEnum.enumValues[number];

// ============================================================================
// Enum Mapping - Generate GraphQL enums from database enums algorithmically
// ============================================================================

/**
 * Convert dot.notation.camelCase to UPPER_SNAKE_CASE
 */
const toGraphQLAttributePath = (dbValue: string): string => {
  return dbValue
    .replace(/\./g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
};

/**
 * Convert lower_snake_case to UPPER_SNAKE_CASE
 */
const toGraphQLEnum = (value: string): string => {
  return value.toUpperCase();
};

// Generate mapping tables from database enums to GraphQL enums
export const ATTRIBUTE_PATH_MAP = new Map<AttributePath, string>(
  attributePathEnum.enumValues.map((dbValue) => [
    dbValue,
    toGraphQLAttributePath(dbValue)
  ])
);

export const OPERATOR_MAP = new Map<Operator, string>(
  operatorEnum.enumValues.map((dbValue) => [
    dbValue,
    toGraphQLEnum(dbValue)
  ])
);

export const VALUE_TYPE_MAP = new Map<ValueType, string>(
  valueTypeEnum.enumValues.map((dbValue) => [
    dbValue,
    toGraphQLEnum(dbValue)
  ])
);

export const PERMISSION_ACTION_MAP = new Map<PermissionAction, string>(
  permissionActionEnum.enumValues.map((dbValue) => [
    dbValue,
    toGraphQLEnum(dbValue)
  ])
);

// Reverse maps for converting GraphQL to DB
export const GRAPHQL_TO_DB_ATTRIBUTE_PATH = new Map<string, AttributePath>(
  Array.from(ATTRIBUTE_PATH_MAP.entries()).map(([db, gql]) => [gql, db])
);

export const GRAPHQL_TO_DB_OPERATOR = new Map<string, Operator>(
  Array.from(OPERATOR_MAP.entries()).map(([db, gql]) => [gql, db])
);

export const GRAPHQL_TO_DB_VALUE_TYPE = new Map<string, ValueType>(
  Array.from(VALUE_TYPE_MAP.entries()).map(([db, gql]) => [gql, db])
);

export const GRAPHQL_TO_DB_PERMISSION_ACTION = new Map<string, PermissionAction>(
  Array.from(PERMISSION_ACTION_MAP.entries()).map(([db, gql]) => [gql, db])
);

// ============================================================================
// ABAC Enums - Generated algorithmically from database enums
// ============================================================================

export const PermissionEffectEnum = builder.enumType('PermissionEffect', {
  values: ['ALLOW', 'DENY'] as const,
});

export const BaseResourceEnum = builder.enumType('BaseResource', {
  values: ['USERS', 'COLLECTIONS', 'ENTRIES', 'ASSETS', 'FIELDS'] as const,
});

export const LogicalOperatorEnum = builder.enumType('LogicalOperator', {
  values: ['AND', 'OR'] as const,
});

// Generate GraphQL enum values from database enums using the mapping
export const PermissionActionEnum = builder.enumType('PermissionAction', {
  values: Array.from(PERMISSION_ACTION_MAP.values()) as [string, ...string[]],
});

export const AttributePathEnum = builder.enumType('AttributePath', {
  values: Array.from(ATTRIBUTE_PATH_MAP.values()) as [string, ...string[]],
});

export const OperatorEnum = builder.enumType('Operator', {
  values: Array.from(OPERATOR_MAP.values()) as [string, ...string[]],
});

export const ValueTypeEnum = builder.enumType('ValueType', {
  values: Array.from(VALUE_TYPE_MAP.values()) as [string, ...string[]],
});

// ============================================================================
// Policy Type
// ============================================================================

export const PolicyType = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  effect: string;
  priority: number;
  isActive: boolean;
  resourceType: string;
  actionType: string;
  ruleConnector: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastEvaluatedAt?: Date | null;
}>('Policy');

PolicyType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    effect: t.exposeString('effect'),
    priority: t.exposeInt('priority'),
    isActive: t.exposeBoolean('isActive'),
    resourceType: t.string({
      resolve: (parent) => parent.resourceType.toUpperCase(),
    }),
    actionType: t.string({
      resolve: (parent) => PERMISSION_ACTION_MAP.get(parent.actionType as PermissionAction) ?? parent.actionType,
    }),
    ruleConnector: t.exposeString('ruleConnector'),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    createdAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.createdAt?.toISOString() ?? null,
    }),
    updatedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.updatedAt?.toISOString() ?? null,
    }),
    lastEvaluatedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.lastEvaluatedAt?.toISOString() ?? null,
    }),
    rules: t.field({
      type: [PolicyRuleType],
      description: 'Rules that make up this policy',
      resolve: async (parent) => {
        const rules = await db
          .select()
          .from(abacPolicyRulesTable)
          .where(eq(abacPolicyRulesTable.policyId, parent.id))
          .orderBy(abacPolicyRulesTable.order);
        
        return rules.map((rule) => ({
          id: rule.id,
          policyId: rule.policyId,
          attributePath: ATTRIBUTE_PATH_MAP.get(rule.attributePath as AttributePath) ?? rule.attributePath,
          operator: OPERATOR_MAP.get(rule.operator as Operator) ?? rule.operator,
          expectedValue: rule.expectedValue,
          valueType: VALUE_TYPE_MAP.get(rule.valueType as ValueType) ?? rule.valueType,
          description: rule.description,
          isActive: rule.isActive,
          order: rule.order,
          createdAt: rule.createdAt,
        }));
      },
    }),
    assignedToRoles: t.field({
      type: [RoleAssignmentType],
      description: 'Roles this policy is assigned to',
      resolve: async (parent) => {
        const assignments = await db
          .select({
            roleId: rolesTable.id,
            roleName: rolesTable.name,
            assignedAt: rolePoliciesTable.assignedAt,
            expiresAt: rolePoliciesTable.expiresAt,
            reason: rolePoliciesTable.reason,
          })
          .from(rolePoliciesTable)
          .innerJoin(rolesTable, eq(rolePoliciesTable.roleId, rolesTable.id))
          .where(eq(rolePoliciesTable.policyId, parent.id));
        
        return assignments.map((a) => ({
          id: a.roleId,
          name: a.roleName,
          assignedAt: a.assignedAt,
          expiresAt: a.expiresAt,
          reason: a.reason,
        }));
      },
    }),
    assignedToUsers: t.field({
      type: [UserAssignmentType],
      description: 'Users this policy is directly assigned to',
      resolve: async (parent) => {
        const assignments = await db
          .select({
            userId: usersTable.id,
            userName: usersTable.name,
            assignedAt: userPoliciesTable.assignedAt,
            expiresAt: userPoliciesTable.expiresAt,
            reason: userPoliciesTable.reason,
          })
          .from(userPoliciesTable)
          .innerJoin(usersTable, eq(userPoliciesTable.userId, usersTable.id))
          .where(eq(userPoliciesTable.policyId, parent.id));
        
        return assignments.map((a) => ({
          id: a.userId,
          name: a.userName,
          assignedAt: a.assignedAt,
          expiresAt: a.expiresAt,
          reason: a.reason,
        }));
      },
    }),
  }),
});

// ============================================================================
// Policy Rule Type
// ============================================================================

export const PolicyRuleType = builder.objectRef<{
  id: string;
  policyId: string;
  attributePath: string;
  operator: string;
  expectedValue: string;
  valueType: string;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt?: Date;
}>('PolicyRule');

PolicyRuleType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    policyId: t.exposeString('policyId'),
    attributePath: t.exposeString('attributePath'),
    operator: t.exposeString('operator'),
    expectedValue: t.exposeString('expectedValue'),
    valueType: t.exposeString('valueType'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    isActive: t.exposeBoolean('isActive'),
    order: t.exposeInt('order'),
    createdAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.createdAt?.toISOString() ?? null,
    }),
  }),
});

// ============================================================================
// Assignment Types
// ============================================================================

export const RoleAssignmentType = builder.objectRef<{
  id: string;
  name: string;
  assignedAt?: Date;
  expiresAt?: Date | null;
  reason?: string | null;
}>('RoleAssignment');

RoleAssignmentType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    assignedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.assignedAt?.toISOString() ?? null,
    }),
    expiresAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.expiresAt?.toISOString() ?? null,
    }),
    reason: t.string({ nullable: true, resolve: (parent) => parent.reason }),
  }),
});

export const UserAssignmentType = builder.objectRef<{
  id: string;
  name: string;
  assignedAt?: Date;
  expiresAt?: Date | null;
  reason?: string | null;
}>('UserAssignment');

UserAssignmentType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    assignedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.assignedAt?.toISOString() ?? null,
    }),
    expiresAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.expiresAt?.toISOString() ?? null,
    }),
    reason: t.string({ nullable: true, resolve: (parent) => parent.reason }),
  }),
});
