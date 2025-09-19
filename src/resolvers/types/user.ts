import type { UserResolvers, RoleResolvers, PolicyResolvers, PolicyEffect, ResourceType, ActionType, LogicalOperator, UserStatus, RuleOperator, ValueType } from '$graphql/resolvers-types';
import { db } from '$db/index';
import {
  rolesTable,
  userRolesTable,
  abacPoliciesTable,
  userPoliciesTable,
  rolePoliciesTable,
  abacPolicyRulesTable
} from '$db/schema';
import { eq } from 'drizzle-orm';

export const userTypeResolvers: UserResolvers = {
  async roles(parent) {
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
      .where(eq(userRolesTable.userId, parent.id));

    return userRoles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      creationTime: role.creationTime.toISOString(),
      lastEditTime: role.lastEditTime.toISOString(),
      policies: []
    }));
  },

  async policies(parent) {
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
      .where(eq(userPoliciesTable.userId, parent.id));

    return userPolicies.map(policy => ({
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
        id: parent.id,
        name: parent.name,
        status: parent.status as UserStatus,
        creationTime: parent.creationTime,
        lastLoginTime: parent.lastLoginTime,
        lastEditTime: parent.lastEditTime,
        roles: [],
        policies: []
      },
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString()
    }));
  }
};

export const roleTypeResolvers: RoleResolvers = {
  async policies(parent) {
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
      .where(eq(rolePoliciesTable.roleId, parent.id));

    return rolePolicies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      effect: policy.effect as any,
      priority: policy.priority,
      isActive: policy.isActive,
      resourceType: policy.resourceType as any,
      actionType: policy.actionType as any,
      ruleConnector: policy.ruleConnector as any,
      rules: [],
      createdBy: {
        id: '',
        name: '',
        status: 'ACTIVE' as any,
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

export const policyTypeResolvers: PolicyResolvers = {
  async rules(parent) {
    const policyRules = await db
      .select()
      .from(abacPolicyRulesTable)
      .where(eq(abacPolicyRulesTable.policyId, parent.id));

    return policyRules.map(rule => ({
      id: rule.id,
      attributePath: rule.attributePath,
      operator: rule.operator as any,
      expectedValue: rule.expectedValue,
      valueType: rule.valueType as any,
      description: rule.description,
      isActive: rule.isActive,
      order: rule.order,
      createdAt: rule.createdAt.toISOString()
    }));
  },

  async createdBy(parent) {
    return {
      id: '',
      name: '',
      status: 'ACTIVE' as any,
      creationTime: new Date().toISOString(),
      lastLoginTime: new Date().toISOString(),
      lastEditTime: new Date().toISOString(),
      roles: [],
      policies: []
    };
  }
};