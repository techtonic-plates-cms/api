import { GraphQLError } from 'graphql';
import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import {
  abacPoliciesTable,
  abacPolicyRulesTable,
  userPoliciesTable,
  usersTable,
  attributePathEnum,
  operatorEnum,
  valueTypeEnum,
  permissionActionEnum,
} from '../../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import {
  PolicyType,
  PermissionEffectEnum,
  BaseResourceEnum,
  PermissionActionEnum,
  LogicalOperatorEnum,
  GRAPHQL_TO_DB_ATTRIBUTE_PATH,
  GRAPHQL_TO_DB_OPERATOR,
  GRAPHQL_TO_DB_VALUE_TYPE,
  GRAPHQL_TO_DB_PERMISSION_ACTION,
} from './policy.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// Type helpers for enum values
type AttributePath = typeof attributePathEnum.enumValues[number];
type Operator = typeof operatorEnum.enumValues[number];
type ValueType = typeof valueTypeEnum.enumValues[number];
type PermissionAction = typeof permissionActionEnum.enumValues[number];

// ============================================================================
// Enum mapping helpers - use the generated maps
// ============================================================================

const mapResourceType = (graphqlValue: string): 'users' | 'collections' | 'entries' | 'assets' | 'fields' => {
  return graphqlValue.toLowerCase() as 'users' | 'collections' | 'entries' | 'assets' | 'fields';
};

const mapActionType = (graphqlValue: string): PermissionAction => {
  const dbValue = GRAPHQL_TO_DB_PERMISSION_ACTION.get(graphqlValue);
  if (!dbValue) {
    throw new GraphQLError(`Invalid permission action: ${graphqlValue}`, {
      extensions: { code: 'INVALID_ENUM' },
    });
  }
  return dbValue;
};

const mapAttributePath = (graphqlValue: string): AttributePath => {
  const dbValue = GRAPHQL_TO_DB_ATTRIBUTE_PATH.get(graphqlValue);
  if (!dbValue) {
    throw new GraphQLError(`Invalid attribute path: ${graphqlValue}`, {
      extensions: { code: 'INVALID_ENUM' },
    });
  }
  return dbValue;
};

const mapOperator = (graphqlValue: string): Operator => {
  const dbValue = GRAPHQL_TO_DB_OPERATOR.get(graphqlValue);
  if (!dbValue) {
    throw new GraphQLError(`Invalid operator: ${graphqlValue}`, {
      extensions: { code: 'INVALID_ENUM' },
    });
  }
  return dbValue;
};

const mapValueType = (graphqlValue: string): ValueType => {
  const dbValue = GRAPHQL_TO_DB_VALUE_TYPE.get(graphqlValue);
  if (!dbValue) {
    throw new GraphQLError(`Invalid value type: ${graphqlValue}`, {
      extensions: { code: 'INVALID_ENUM' },
    });
  }
  return dbValue;
};

// ============================================================================
// Input Types
// ============================================================================

const CreatePolicyRuleInput = builder.inputType('CreatePolicyRuleInput', {
  fields: (t) => ({
    attributePath: t.string({ required: true }),
    operator: t.string({ required: true }),
    expectedValue: t.string({ required: true }),
    valueType: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    order: t.int({ required: false }),
  }),
});

const CreatePolicyInput = builder.inputType('CreatePolicyInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    effect: t.field({ type: PermissionEffectEnum, required: true }),
    resourceType: t.field({ type: BaseResourceEnum, required: true }),
    actionType: t.field({ type: PermissionActionEnum, required: true }),
    priority: t.int({ required: false }),
    isActive: t.boolean({ required: false }),
    ruleConnector: t.field({ type: LogicalOperatorEnum, required: false }),
    rules: t.field({ type: [CreatePolicyRuleInput], required: false }),
  }),
});

const UpdatePolicyRuleInput = builder.inputType('UpdatePolicyRuleInput', {
  fields: (t) => ({
    id: t.id({ required: false }), // If provided, update; otherwise create new
    attributePath: t.string({ required: true }),
    operator: t.string({ required: true }),
    expectedValue: t.string({ required: true }),
    valueType: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    order: t.int({ required: false }),
  }),
});

const UpdatePolicyInput = builder.inputType('UpdatePolicyInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    effect: t.field({ type: PermissionEffectEnum, required: false }),
    priority: t.int({ required: false }),
    isActive: t.boolean({ required: false }),
    ruleConnector: t.field({ type: LogicalOperatorEnum, required: false }),
    rules: t.field({ type: [UpdatePolicyRuleInput], required: false }),
    deleteRuleIds: t.idList({ required: false }),
  }),
});

const AssignPolicyToUserInput = builder.inputType('AssignPolicyToUserInput', {
  fields: (t) => ({
    userId: t.id({ required: true }),
    policyId: t.id({ required: true }),
    expiresAt: t.string({ required: false }), // ISO date string
    reason: t.string({ required: false }),
  }),
});

// ============================================================================
// Policy Mutations Type
// ============================================================================

export const PolicyMutations = builder.objectRef<Record<PropertyKey, never>>('PolicyMutations');

PolicyMutations.implement({
  fields: (t) => ({
    create: t.field({
      type: PolicyType,
      description: 'Create a new ABAC policy',
      args: {
        input: t.arg({ type: CreatePolicyInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        const user = requireAuth(context);
        
        // Check permission to create policies (requires user management permissions)
        await context.requirePermission('users', 'create');
        
        // Create policy
        const [newPolicy] = await db.insert(abacPoliciesTable).values({
          name: args.input.name,
          description: args.input.description ?? null,
          effect: args.input.effect,
          resourceType: mapResourceType(args.input.resourceType),
          actionType: mapActionType(args.input.actionType),
          priority: args.input.priority ?? 100,
          isActive: args.input.isActive ?? true,
          ruleConnector: args.input.ruleConnector ?? 'AND',
          createdBy: user.id,
        }).returning();

        // Create rules if provided
        if (args.input.rules && args.input.rules.length > 0) {
          await db.insert(abacPolicyRulesTable).values(
            args.input.rules.map((rule, index) => ({
              policyId: newPolicy.id,
              attributePath: mapAttributePath(rule.attributePath),
              operator: mapOperator(rule.operator),
              expectedValue: rule.expectedValue,
              valueType: mapValueType(rule.valueType),
              description: rule.description ?? null,
              isActive: rule.isActive ?? true,
              order: rule.order ?? index,
            }))
          );
        }
        
        return {
          id: newPolicy.id,
          name: newPolicy.name,
          description: newPolicy.description,
          effect: newPolicy.effect,
          priority: newPolicy.priority,
          isActive: newPolicy.isActive,
          resourceType: newPolicy.resourceType,
          actionType: newPolicy.actionType,
          ruleConnector: newPolicy.ruleConnector,
          createdBy: newPolicy.createdBy,
          createdAt: newPolicy.createdAt,
          updatedAt: newPolicy.updatedAt,
          lastEvaluatedAt: newPolicy.lastEvaluatedAt,
        };
      },
    }),
    
    update: t.field({
      type: PolicyType,
      description: 'Update an existing ABAC policy',
      args: {
        input: t.arg({ type: UpdatePolicyInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update policies
        await context.requirePermission('users', 'update');
        
        // Build update values
        const updateValues: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        
        if (args.input.name !== undefined) updateValues.name = args.input.name;
        if (args.input.description !== undefined) updateValues.description = args.input.description;
        if (args.input.effect !== undefined) updateValues.effect = args.input.effect;
        if (args.input.priority !== undefined) updateValues.priority = args.input.priority;
        if (args.input.isActive !== undefined) updateValues.isActive = args.input.isActive;
        if (args.input.ruleConnector !== undefined) updateValues.ruleConnector = args.input.ruleConnector;
        
        // Update policy
        const [updatedPolicy] = await db
          .update(abacPoliciesTable)
          .set(updateValues)
          .where(eq(abacPoliciesTable.id, args.input.id))
          .returning();
        
        if (!updatedPolicy) {
          throw new GraphQLError('Policy not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Delete rules if requested
        if (args.input.deleteRuleIds && args.input.deleteRuleIds.length > 0) {
          for (const ruleId of args.input.deleteRuleIds) {
            await db
              .delete(abacPolicyRulesTable)
              .where(
                and(
                  eq(abacPolicyRulesTable.id, ruleId),
                  eq(abacPolicyRulesTable.policyId, args.input.id)
                )
              );
          }
        }

        // Update or create rules if provided
        if (args.input.rules && args.input.rules.length > 0) {
          for (const rule of args.input.rules) {
            const ruleData = {
              attributePath: mapAttributePath(rule.attributePath),
              operator: mapOperator(rule.operator),
              expectedValue: rule.expectedValue,
              valueType: mapValueType(rule.valueType),
              description: rule.description ?? null,
              isActive: rule.isActive ?? true,
              order: rule.order ?? 0,
            };

            if (rule.id) {
              // Update existing rule
              await db
                .update(abacPolicyRulesTable)
                .set(ruleData)
                .where(
                  and(
                    eq(abacPolicyRulesTable.id, rule.id),
                    eq(abacPolicyRulesTable.policyId, args.input.id)
                  )
                );
            } else {
              // Create new rule
              await db.insert(abacPolicyRulesTable).values({
                ...ruleData,
                policyId: updatedPolicy.id,
              });
            }
          }
        }
        
        return {
          id: updatedPolicy.id,
          name: updatedPolicy.name,
          description: updatedPolicy.description,
          effect: updatedPolicy.effect,
          priority: updatedPolicy.priority,
          isActive: updatedPolicy.isActive,
          resourceType: updatedPolicy.resourceType,
          actionType: updatedPolicy.actionType,
          ruleConnector: updatedPolicy.ruleConnector,
          createdBy: updatedPolicy.createdBy,
          createdAt: updatedPolicy.createdAt,
          updatedAt: updatedPolicy.updatedAt,
          lastEvaluatedAt: updatedPolicy.lastEvaluatedAt,
        };
      },
    }),
    
    delete: t.field({
      type: 'Boolean',
      description: 'Delete a policy',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to delete policies
        await context.requirePermission('users', 'delete');
        
        // Delete policy (cascade will handle rules and assignments)
        await db.delete(abacPoliciesTable).where(eq(abacPoliciesTable.id, args.id));
        
        return true;
      },
    }),
    
    assignToUser: t.field({
      type: 'Boolean',
      description: 'Directly assign a policy to a user',
      args: {
        input: t.arg({ type: AssignPolicyToUserInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        const user = requireAuth(context);
        
        // Check permission to update users
        await context.requirePermission('users', 'update');
        
        // Verify user and policy exist
        const [targetUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, args.input.userId))
          .limit(1);
        
        if (!targetUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const [policy] = await db
          .select()
          .from(abacPoliciesTable)
          .where(eq(abacPoliciesTable.id, args.input.policyId))
          .limit(1);
        
        if (!policy) {
          throw new GraphQLError('Policy not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if assignment already exists
        const existing = await db
          .select()
          .from(userPoliciesTable)
          .where(
            and(
              eq(userPoliciesTable.userId, args.input.userId),
              eq(userPoliciesTable.policyId, args.input.policyId)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          throw new GraphQLError('Policy already assigned to user', {
            extensions: { code: 'CONFLICT' },
          });
        }
        
        // Assign policy
        await db.insert(userPoliciesTable).values({
          userId: args.input.userId,
          policyId: args.input.policyId,
          assignedBy: user.id,
          expiresAt: args.input.expiresAt ? new Date(args.input.expiresAt) : null,
          reason: args.input.reason ?? null,
        });
        
        return true;
      },
    }),
    
    unassignFromUser: t.field({
      type: 'Boolean',
      description: 'Remove a direct policy assignment from a user',
      args: {
        userId: t.arg.id({ required: true }),
        policyId: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update users
        await context.requirePermission('users', 'update');
        
        // Remove policy assignment
        await db
          .delete(userPoliciesTable)
          .where(
            and(
              eq(userPoliciesTable.userId, args.userId),
              eq(userPoliciesTable.policyId, args.policyId)
            )
          );
        
        return true;
      },
    }),
  }),
});

// ============================================================================
// Wire up PolicyMutations to root Mutation type
// ============================================================================

builder.mutationField('policies', (t) =>
  t.field({
    type: PolicyMutations,
    resolve: () => ({}),
  })
);
