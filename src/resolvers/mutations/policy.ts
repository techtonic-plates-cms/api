import type { AppContext } from '#/index';
import type { MutationResolvers, PolicyEffect, ResourceType, ActionType, RuleOperator, ValueType, LogicalOperator, UserStatus } from '$graphql/resolvers-types';
import {
  requirePermission,
} from "#/session/permissions"
import { db } from '$db/index';
import {
  abacPoliciesTable,
  abacPolicyRulesTable,
  userPoliciesTable
} from '$db/schema';
import { eq, and } from 'drizzle-orm';

export const policyMutations: Pick<MutationResolvers, 'createPolicy' | 'updatePolicy' | 'deletePolicy' | 'assignPolicyToUser' | 'removePolicyFromUser' | 'addPolicyRule' | 'removePolicyRule'> = {
  async createPolicy(_parent, { input }, context) {
    // Check permissions - only admins can create policies
    await requirePermission(context, 'users', 'manage_schema');

    // Validate input
    if (!input.name.trim() || input.name.length < 3) {
      throw new Error('Policy name must be at least 3 characters long');
    }

    if (!input.rules || input.rules.length === 0) {
      throw new Error('Policy must have at least one rule');
    }

    // Check if policy name already exists
    const existingPolicy = await db
      .select()
      .from(abacPoliciesTable)
      .where(eq(abacPoliciesTable.name, input.name.trim()))
      .limit(1);

    if (existingPolicy.length > 0) {
      throw new Error('Policy name already exists');
    }

    try {
      // Create policy
      const [newPolicy] = await db
        .insert(abacPoliciesTable)
        .values({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          effect: input.effect.toUpperCase() as 'ALLOW' | 'DENY',
          priority: input.priority || 100,
          resourceType: input.resourceType,
          actionType: input.actionType,
          ruleConnector: input.ruleConnector || 'AND',
          createdBy: context.session!.user.id,
        })
        .returning();

      if (!newPolicy) {
        throw new Error('Failed to create policy');
      }

      // Create policy rules
      const ruleInserts = input.rules.map((rule, index) => ({
        policyId: newPolicy.id,
        attributePath: rule.attributePath as any,
        operator: rule.operator.toLowerCase() as any,
        expectedValue: rule.expectedValue,
        valueType: rule.valueType.toLowerCase() as any,
        description: rule.description || null,
        order: rule.order || index,
      }));

      const newRules = await db
        .insert(abacPolicyRulesTable)
        .values(ruleInserts)
        .returning();

      return {
        id: newPolicy.id,
        name: newPolicy.name,
        description: newPolicy.description,
        effect: newPolicy.effect as PolicyEffect,
        priority: newPolicy.priority,
        isActive: newPolicy.isActive,
        resourceType: newPolicy.resourceType as ResourceType,
        actionType: newPolicy.actionType as ActionType,
        ruleConnector: newPolicy.ruleConnector as LogicalOperator,
        rules: newRules.map(rule => ({
          id: rule.id,
          attributePath: rule.attributePath,
          operator: rule.operator.toUpperCase() as RuleOperator,
          expectedValue: rule.expectedValue,
          valueType: rule.valueType.toUpperCase() as ValueType,
          description: rule.description,
          isActive: rule.isActive,
          order: rule.order,
          createdAt: rule.createdAt.toISOString()
        })),
        createdBy: {
          id: context.session!.user.id,
          name: context.session!.user.name,
          status: context.session!.user.status as UserStatus,
          creationTime: new Date().toISOString(),
          lastLoginTime: new Date().toISOString(),
          lastEditTime: new Date().toISOString(),
          roles: [],
          policies: []
        },
        createdAt: newPolicy.createdAt.toISOString(),
        updatedAt: newPolicy.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error creating policy:', error);
      throw new Error('Failed to create policy');
    }
  },

  async updatePolicy(_parent, { id, input }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Get existing policy
    const [existingPolicy] = await db
      .select()
      .from(abacPoliciesTable)
      .where(eq(abacPoliciesTable.id, id))
      .limit(1);

    if (!existingPolicy) {
      throw new Error('Policy not found');
    }

    try {
      // Prepare update data
      const updateData: Partial<typeof abacPoliciesTable.$inferInsert> = {
        updatedAt: new Date()
      };

      if (input.name) {
        if (input.name.length < 3) {
          throw new Error('Policy name must be at least 3 characters long');
        }

        // Check if new name already exists (excluding current policy)
        const existingWithName = await db
          .select()
          .from(abacPoliciesTable)
          .where(and(
            eq(abacPoliciesTable.name, input.name),
            eq(abacPoliciesTable.id, id)
          ))
          .limit(1);

        if (existingWithName.length > 0) {
          throw new Error('Policy name already exists');
        }

        updateData.name = input.name.trim();
      }

      if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
      }

      if (input.effect) {
        updateData.effect = input.effect.toUpperCase() as 'ALLOW' | 'DENY';
      }

      if (input.priority != null) {
        updateData.priority = input.priority;
      }

      if (input.isActive != null) {
        updateData.isActive = input.isActive;
      }

      if (input.ruleConnector) {
        updateData.ruleConnector = input.ruleConnector;
      }

      // Update policy
      const [updatedPolicy] = await db
        .update(abacPoliciesTable)
        .set(updateData)
        .where(eq(abacPoliciesTable.id, id))
        .returning();

      if (!updatedPolicy) {
        throw new Error('Failed to update policy');
      }

      // Get current rules for response
      const rules = await db
        .select()
        .from(abacPolicyRulesTable)
        .where(eq(abacPolicyRulesTable.policyId, id));

      return {
        id: updatedPolicy.id,
        name: updatedPolicy.name,
        description: updatedPolicy.description,
        effect: updatedPolicy.effect as PolicyEffect,
        priority: updatedPolicy.priority,
        isActive: updatedPolicy.isActive,
        resourceType: updatedPolicy.resourceType as ResourceType,
        actionType: updatedPolicy.actionType as ActionType,
        ruleConnector: updatedPolicy.ruleConnector as LogicalOperator,
        rules: rules.map(rule => ({
          id: rule.id,
          attributePath: rule.attributePath,
          operator: rule.operator.toUpperCase() as RuleOperator,
          expectedValue: rule.expectedValue,
          valueType: rule.valueType.toUpperCase() as ValueType,
          description: rule.description,
          isActive: rule.isActive,
          order: rule.order,
          createdAt: rule.createdAt.toISOString()
        })),
        createdBy: {
          id: context.session!.user.id,
          name: context.session!.user.name,
          status: context.session!.user.status as UserStatus,
          creationTime: new Date().toISOString(),
          lastLoginTime: new Date().toISOString(),
          lastEditTime: new Date().toISOString(),
          roles: [],
          policies: []
        },
        createdAt: updatedPolicy.createdAt.toISOString(),
        updatedAt: updatedPolicy.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error updating policy:', error);
      throw new Error('Failed to update policy');
    }
  },

  async deletePolicy(_parent, { id }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Check if policy exists
    const [existingPolicy] = await db
      .select()
      .from(abacPoliciesTable)
      .where(eq(abacPoliciesTable.id, id))
      .limit(1);

    if (!existingPolicy) {
      throw new Error('Policy not found');
    }

    try {
      // Delete policy (cascade will handle rules and assignments)
      await db.delete(abacPoliciesTable).where(eq(abacPoliciesTable.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw new Error('Failed to delete policy');
    }
  },

  async assignPolicyToUser(_parent, { policyId, userId, reason, expiresAt }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'update', { id: userId });

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(userPoliciesTable)
      .where(and(
        eq(userPoliciesTable.userId, userId),
        eq(userPoliciesTable.policyId, policyId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      throw new Error('Policy already assigned to user');
    }

    try {
      // Create policy assignment
      await db
        .insert(userPoliciesTable)
        .values({
          userId,
          policyId,
          assignedBy: context.session!.user.id,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        });

      return {
        success: true,
        message: 'Policy assigned to user successfully'
      };
    } catch (error) {
      console.error('Error assigning policy to user:', error);
      throw new Error('Failed to assign policy to user');
    }
  },

  async removePolicyFromUser(_parent, { policyId, userId }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'update', { id: userId });

    try {
      // Remove policy assignment
      await db
        .delete(userPoliciesTable)
        .where(and(
          eq(userPoliciesTable.userId, userId),
          eq(userPoliciesTable.policyId, policyId)
        ));

      return true;
    } catch (error) {
      console.error('Error removing policy from user:', error);
      throw new Error('Failed to remove policy from user');
    }
  },

  async addPolicyRule(_parent, { policyId, rule }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Verify policy exists
    const [existingPolicy] = await db
      .select()
      .from(abacPoliciesTable)
      .where(eq(abacPoliciesTable.id, policyId))
      .limit(1);

    if (!existingPolicy) {
      throw new Error('Policy not found');
    }

    try {
      // Create rule
      const [newRule] = await db
        .insert(abacPolicyRulesTable)
        .values({
          policyId,
          attributePath: rule.attributePath as any,
          operator: rule.operator.toLowerCase() as any,
          expectedValue: rule.expectedValue,
          valueType: rule.valueType.toLowerCase() as any,
          description: rule.description || null,
          order: rule.order || 0,
        })
        .returning();

      if (!newRule) {
        throw new Error('Failed to create policy rule');
      }

      // Update policy timestamp
      await db
        .update(abacPoliciesTable)
        .set({ updatedAt: new Date() })
        .where(eq(abacPoliciesTable.id, policyId));

      return {
        id: newRule.id,
        attributePath: newRule.attributePath,
        operator: newRule.operator.toUpperCase() as RuleOperator,
        expectedValue: newRule.expectedValue,
        valueType: newRule.valueType.toUpperCase() as ValueType,
        description: newRule.description,
        isActive: newRule.isActive,
        order: newRule.order,
        createdAt: newRule.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error adding policy rule:', error);
      throw new Error('Failed to add policy rule');
    }
  },

  async removePolicyRule(_parent, { policyId, ruleId }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Verify rule belongs to policy
    const [existingRule] = await db
      .select()
      .from(abacPolicyRulesTable)
      .where(and(
        eq(abacPolicyRulesTable.id, ruleId),
        eq(abacPolicyRulesTable.policyId, policyId)
      ))
      .limit(1);

    if (!existingRule) {
      throw new Error('Policy rule not found');
    }

    try {
      // Delete rule
      await db
        .delete(abacPolicyRulesTable)
        .where(eq(abacPolicyRulesTable.id, ruleId));

      // Update policy timestamp
      await db
        .update(abacPoliciesTable)
        .set({ updatedAt: new Date() })
        .where(eq(abacPoliciesTable.id, policyId));

      return true;
    } catch (error) {
      console.error('Error removing policy rule:', error);
      throw new Error('Failed to remove policy rule');
    }
  }
};