import type { AppContext } from '#/index';
import type { QueryResolvers, PolicyEffect, ResourceType, ActionType, LogicalOperator, UserStatus } from '$graphql/resolvers-types';
import {
  requirePermission,
} from '#/session/permissions';
import { requireAuth } from '#/session/auth';
import { db } from '$db/index';
import {
  usersTable,
  rolesTable,
  userRolesTable,
  abacPoliciesTable,
  userPoliciesTable,
  rolePoliciesTable
} from '$db/schema';
import { eq, and } from 'drizzle-orm';

export const userQueryResolvers = {
  me: async (_parent: any, _args: any, context: AppContext) => {
    requireAuth(context);

    const user = context.session.user;

    // Get user roles with policies populated
    const userRoles = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        description: rolesTable.description,
        creationTime: rolesTable.creationTime,
        lastEditTime: rolesTable.lastEditTime
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(rolesTable.id, userRolesTable.roleId))
      .where(eq(userRolesTable.userId, user.id));

    // Get role policies for each role
    const roleIds = userRoles.map(role => role.id);
    const rolePolicies = roleIds.length > 0 ? await db
      .select({
        roleId: rolePoliciesTable.roleId,
        id: abacPoliciesTable.id,
        name: abacPoliciesTable.name,
        description: abacPoliciesTable.description,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        isActive: abacPoliciesTable.isActive,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        createdAt: abacPoliciesTable.createdAt,
        updatedAt: abacPoliciesTable.updatedAt
      })
      .from(rolePoliciesTable)
      .innerJoin(abacPoliciesTable, eq(abacPoliciesTable.id, rolePoliciesTable.policyId))
      .where(and(
        eq(abacPoliciesTable.isActive, true)
      )) : [];

    // Get user direct policies
    const userPolicies = await db
      .select({
        id: abacPoliciesTable.id,
        name: abacPoliciesTable.name,
        description: abacPoliciesTable.description,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        isActive: abacPoliciesTable.isActive,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        createdAt: abacPoliciesTable.createdAt,
        updatedAt: abacPoliciesTable.updatedAt
      })
      .from(userPoliciesTable)
      .innerJoin(abacPoliciesTable, eq(abacPoliciesTable.id, userPoliciesTable.policyId))
      .where(eq(userPoliciesTable.userId, user.id));

    return {
      id: user.id,
      name: user.name,
      status: user.status,
      creationTime: new Date().toISOString(), // TODO: Get from database
      lastLoginTime: new Date().toISOString(), // TODO: Get from database
      lastEditTime: new Date().toISOString(), // TODO: Get from database
      roles: userRoles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        creationTime: role.creationTime.toISOString(),
        lastEditTime: role.lastEditTime.toISOString(),
        policies: rolePolicies
          .filter(policy => policy.roleId === role.id)
          .map(policy => ({
            id: policy.id,
            name: policy.name,
            description: policy.description,
            effect: policy.effect as PolicyEffect,
            priority: policy.priority,
            isActive: policy.isActive,
            resourceType: policy.resourceType as ResourceType,
            actionType: policy.actionType as ActionType,
            ruleConnector: policy.ruleConnector as LogicalOperator,
            rules: [],
            createdBy: {
              id: user.id,
              name: user.name,
              status: user.status as UserStatus,
              creationTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString(),
              lastEditTime: new Date().toISOString(),
              roles: [],
              policies: []
            },
            createdAt: policy.createdAt.toISOString(),
            updatedAt: policy.updatedAt.toISOString()
          }))
      })),
      policies: userPolicies.map(policy => ({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effect: policy.effect as PolicyEffect,
        priority: policy.priority,
        isActive: policy.isActive,
        resourceType: policy.resourceType as ResourceType,
        actionType: policy.actionType as ActionType,
        ruleConnector: policy.ruleConnector as LogicalOperator,
        rules: [],
        createdBy: {
          id: user.id,
          name: user.name,
          status: user.status as UserStatus,
          creationTime: new Date().toISOString(),
          lastLoginTime: new Date().toISOString(),
          lastEditTime: new Date().toISOString(),
          roles: [],
          policies: []
        },
        createdAt: policy.createdAt.toISOString(),
        updatedAt: policy.updatedAt.toISOString()
      }))
    };
  },

  user: async (_parent: any, { id }: { id: string }, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'read', { id });

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!user) {
      return null;
    }

    // Get user roles
    const userRoles = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        description: rolesTable.description,
        creationTime: rolesTable.creationTime,
        lastEditTime: rolesTable.lastEditTime
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(rolesTable.id, userRolesTable.roleId))
      .where(eq(userRolesTable.userId, id));

    // Get user policies (direct assignments)
    const userPolicies = await db
      .select({
        id: abacPoliciesTable.id,
        name: abacPoliciesTable.name,
        description: abacPoliciesTable.description,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        isActive: abacPoliciesTable.isActive,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        createdAt: abacPoliciesTable.createdAt,
        updatedAt: abacPoliciesTable.updatedAt
      })
      .from(userPoliciesTable)
      .innerJoin(abacPoliciesTable, eq(abacPoliciesTable.id, userPoliciesTable.policyId))
      .where(eq(userPoliciesTable.userId, id));

    return {
      id: user.id,
      name: user.name,
      status: user.status,
      creationTime: user.creationTime.toISOString(),
      lastLoginTime: user.lastLoginTime.toISOString(),
      lastEditTime: user.lastEditTime.toISOString(),
      roles: userRoles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        creationTime: role.creationTime.toISOString(),
        lastEditTime: role.lastEditTime.toISOString(),
        policies: []
      })),
      policies: userPolicies.map(policy => ({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effect: policy.effect as PolicyEffect,
        priority: policy.priority,
        isActive: policy.isActive,
        resourceType: policy.resourceType as ResourceType,
        actionType: policy.actionType as ActionType,
        ruleConnector: policy.ruleConnector as LogicalOperator,
        rules: [],
        createdBy: {
          id: user.id,
          name: user.name,
          status: user.status as UserStatus,
          creationTime: user.creationTime.toISOString(),
          lastLoginTime: user.lastLoginTime.toISOString(),
          lastEditTime: user.lastEditTime.toISOString(),
          roles: [],
          policies: []
        },
        createdAt: policy.createdAt.toISOString(),
        updatedAt: policy.updatedAt.toISOString()
      }))
    };
  },

  users: async (_parent: any, _args: any, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'read');

    const users = await db.select().from(usersTable);

    return users.map(user => ({
      id: user.id,
      name: user.name,
      status: user.status as UserStatus,
      creationTime: user.creationTime.toISOString(),
      lastLoginTime: user.lastLoginTime.toISOString(),
      lastEditTime: user.lastEditTime.toISOString(),
      roles: [],
      policies: []
    }));
  },

  role: async (_parent: any, { id }: { id: string }, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'manage_schema');

    const [role] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);

    if (!role) {
      return null;
    }

    // Get role policies
    const rolePolicies = await db
      .select({
        id: abacPoliciesTable.id,
        name: abacPoliciesTable.name,
        description: abacPoliciesTable.description,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        isActive: abacPoliciesTable.isActive,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        createdAt: abacPoliciesTable.createdAt,
        updatedAt: abacPoliciesTable.updatedAt
      })
      .from(rolePoliciesTable)
      .innerJoin(abacPoliciesTable, eq(abacPoliciesTable.id, rolePoliciesTable.policyId))
      .where(eq(rolePoliciesTable.roleId, id));

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      creationTime: role.creationTime.toISOString(),
      lastEditTime: role.lastEditTime.toISOString(),
      policies: rolePolicies.map(policy => ({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        effect: policy.effect as PolicyEffect,
        priority: policy.priority,
        isActive: policy.isActive,
        resourceType: policy.resourceType as ResourceType,
        actionType: policy.actionType as ActionType,
        ruleConnector: policy.ruleConnector as LogicalOperator,
        rules: [],
        createdBy: {
          id: '',
          name: '',
          status: 'ACTIVE' as UserStatus,
          creationTime: new Date().toISOString(),
          lastLoginTime: new Date().toISOString(),
          lastEditTime: new Date().toISOString(),
          roles: [],
          policies: []
        },
        createdAt: policy.createdAt.toISOString(),
        updatedAt: policy.updatedAt.toISOString()
      }))
    };
  },

  roles: async (_parent: any, _args: any, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'manage_schema');

    const roles = await db.select().from(rolesTable);

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      creationTime: role.creationTime.toISOString(),
      lastEditTime: role.lastEditTime.toISOString(),
      policies: []
    }));
  },

  policy: async (_parent: any, { id }: { id: string }, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'manage_schema');

    const [policy] = await db
      .select()
      .from(abacPoliciesTable)
      .where(eq(abacPoliciesTable.id, id))
      .limit(1);

    if (!policy) {
      return null;
    }

    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      effect: policy.effect as PolicyEffect,
      priority: policy.priority,
      isActive: policy.isActive,
      resourceType: policy.resourceType as ResourceType,
      actionType: policy.actionType as ActionType,
      ruleConnector: policy.ruleConnector as LogicalOperator,
      rules: [],
      createdBy: {
        id: '',
        name: '',
        status: 'ACTIVE' as UserStatus,
        creationTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        lastEditTime: new Date().toISOString(),
        roles: [],
        policies: []
      },
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString()
    };
  },

  policies: async (_parent: any, _args: any, context: AppContext) => {
    requireAuth(context);
    await requirePermission(context, 'users', 'manage_schema');

    const policies = await db.select().from(abacPoliciesTable);

    return policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      effect: policy.effect as PolicyEffect,
      priority: policy.priority,
      isActive: policy.isActive,
      resourceType: policy.resourceType as ResourceType,
      actionType: policy.actionType as ActionType,
      ruleConnector: policy.ruleConnector as LogicalOperator,
      rules: [],
      createdBy: {
        id: '',
        name: '',
        status: 'ACTIVE' as UserStatus,
        creationTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        lastEditTime: new Date().toISOString(),
        roles: [],
        policies: []
      },
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString()
    }));
  }
};