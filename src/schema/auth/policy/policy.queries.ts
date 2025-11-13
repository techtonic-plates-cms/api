import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { abacPoliciesTable } from '../../../db/schema.ts';
import { eq, like, and, sql } from 'drizzle-orm';
import { PolicyType } from './policy.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Policy Queries
// ============================================================================

builder.queryField('policy', (t) =>
  t.field({
    type: PolicyType,
    nullable: true,
    description: 'Get a policy by ID or name',
    args: {
      id: t.arg.string({ required: false }),
      name: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      if (!args.id && !args.name) {
        throw new Error('Must provide either id or name');
      }

      // Check permission to read policies (part of user management)
      await context.requirePermission('users', 'read');

      let query = db.select().from(abacPoliciesTable);

      if (args.id) {
        query = query.where(eq(abacPoliciesTable.id, args.id)) as typeof query;
      } else if (args.name) {
        query = query.where(eq(abacPoliciesTable.name, args.name)) as typeof query;
      }

      const policies = await query.limit(1);

      if (policies.length === 0) return null;

      const policy = policies[0];

      return {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effect: policy.effect,
        priority: policy.priority,
        isActive: policy.isActive,
        resourceType: policy.resourceType,
        actionType: policy.actionType,
        ruleConnector: policy.ruleConnector,
        createdBy: policy.createdBy,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        lastEvaluatedAt: policy.lastEvaluatedAt,
      };
    },
  })
);

builder.queryField('policies', (t) =>
  t.field({
    type: [PolicyType],
    description: 'List policies with optional filters',
    args: {
      search: t.arg.string({ required: false }),
      resourceType: t.arg.string({ required: false }),
      actionType: t.arg.string({ required: false }),
      effect: t.arg.string({ required: false }),
      isActive: t.arg.boolean({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Check permission to read policies
      await context.requirePermission('users', 'read');

      let queryBuilder = db.select().from(abacPoliciesTable);

      // Apply filters
      const conditions = [];

      if (args.search) {
        conditions.push(like(abacPoliciesTable.name, `%${args.search}%`));
      }

      if (args.resourceType) {
        conditions.push(eq(abacPoliciesTable.resourceType, args.resourceType as 'users' | 'collections' | 'entries' | 'assets' | 'fields'));
      }

      // Note: actionType is a pgEnum, so we cast to the enum type
      // TypeScript cannot infer all possible enum values at compile time, so we use a type assertion

      // Note: actionType is a pgEnum, so we cast to the enum type
      // TypeScript cannot infer all possible enum values at compile time, so we use a type assertion
      if (args.actionType) {
        conditions.push(sql`${abacPoliciesTable.actionType} = ${args.actionType}`);
      }

      if (args.effect) {
        conditions.push(eq(abacPoliciesTable.effect, args.effect as 'ALLOW' | 'DENY'));
      }

      if (args.isActive !== undefined && args.isActive !== null) {
        conditions.push(eq(abacPoliciesTable.isActive, args.isActive));
      }

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)!) as typeof queryBuilder;
      }

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const policies = await queryBuilder;

      return policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effect: policy.effect,
        priority: policy.priority,
        isActive: policy.isActive,
        resourceType: policy.resourceType,
        actionType: policy.actionType,
        ruleConnector: policy.ruleConnector,
        createdBy: policy.createdBy,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        lastEvaluatedAt: policy.lastEvaluatedAt,
      }));
    },
  })
);
