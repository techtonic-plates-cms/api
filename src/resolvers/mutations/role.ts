import type { AppContext } from '#/index';
import type { MutationResolvers } from '$graphql/resolvers-types';
import {
  requirePermission,
} from "#/session/permissions"
import { db } from '$db/index';
import {
  rolesTable,
  rolePoliciesTable,
  userRolesTable
} from '$db/schema';
import { eq, and } from 'drizzle-orm';

export const roleMutations: Pick<MutationResolvers, 'createRole' | 'updateRole' | 'deleteRole' | 'assignPolicyToRole' | 'removePolicyFromRole'> = {
  async createRole(_parent, { input }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Validate input
    if (!input.name.trim() || input.name.length < 2) {
      throw new Error('Role name must be at least 2 characters long');
    }

    // Check if role name already exists
    const existingRole = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, input.name.trim()))
      .limit(1);

    if (existingRole.length > 0) {
      throw new Error('Role name already exists');
    }

    try {
      // Create role
      const [newRole] = await db
        .insert(rolesTable)
        .values({
          name: input.name.trim(),
          description: input.description?.trim() || null,
        })
        .returning();

      if (!newRole) {
        throw new Error('Failed to create role');
      }

      return {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        creationTime: newRole.creationTime.toISOString(),
        lastEditTime: newRole.lastEditTime.toISOString(),
        policies: []
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  },

  async updateRole(_parent, { id, input }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Get existing role
    const [existingRole] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);

    if (!existingRole) {
      throw new Error('Role not found');
    }

    try {
      // Prepare update data
      const updateData: Partial<typeof rolesTable.$inferInsert> = {
        lastEditTime: new Date()
      };

      if (input.name) {
        if (input.name.length < 2) {
          throw new Error('Role name must be at least 2 characters long');
        }

        // Check if new name already exists (excluding current role)
        const existingWithName = await db
          .select()
          .from(rolesTable)
          .where(and(
            eq(rolesTable.name, input.name),
            eq(rolesTable.id, id)
          ))
          .limit(1);

        if (existingWithName.length > 0) {
          throw new Error('Role name already exists');
        }

        updateData.name = input.name.trim();
      }

      if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
      }

      // Update role
      const [updatedRole] = await db
        .update(rolesTable)
        .set(updateData)
        .where(eq(rolesTable.id, id))
        .returning();

      if (!updatedRole) {
        throw new Error('Failed to update role');
      }

      return {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        creationTime: updatedRole.creationTime.toISOString(),
        lastEditTime: updatedRole.lastEditTime.toISOString(),
        policies: []
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error('Failed to update role');
    }
  },

  async deleteRole(_parent, { id }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Check if role exists
    const [existingRole] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);

    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Check if role is assigned to any users
    const assignedUsers = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.roleId, id))
      .limit(1);

    if (assignedUsers.length > 0) {
      throw new Error('Cannot delete role that is assigned to users. Remove all assignments first.');
    }

    try {
      // Delete role (cascade will handle policy assignments)
      await db.delete(rolesTable).where(eq(rolesTable.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw new Error('Failed to delete role');
    }
  },

  async assignPolicyToRole(_parent, { policyId, roleId, reason, expiresAt }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(rolePoliciesTable)
      .where(and(
        eq(rolePoliciesTable.roleId, roleId),
        eq(rolePoliciesTable.policyId, policyId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      throw new Error('Policy already assigned to role');
    }

    try {
      // Create policy assignment
      await db
        .insert(rolePoliciesTable)
        .values({
          roleId,
          policyId,
          assignedBy: context.session!.user.id,
          reason: reason || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        });

      return {
        success: true,
        message: 'Policy assigned to role successfully'
      };
    } catch (error) {
      console.error('Error assigning policy to role:', error);
      throw new Error('Failed to assign policy to role');
    }
  },

  async removePolicyFromRole(_parent, { policyId, roleId }, context) {
    // Check permissions
    await requirePermission(context, 'users', 'manage_schema');

    try {
      // Remove policy assignment
      await db
        .delete(rolePoliciesTable)
        .where(and(
          eq(rolePoliciesTable.roleId, roleId),
          eq(rolePoliciesTable.policyId, policyId)
        ));

      return true;
    } catch (error) {
      console.error('Error removing policy from role:', error);
      throw new Error('Failed to remove policy from role');
    }
  }
};