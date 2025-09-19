import type { AppContext } from '#/index';
import type {
  MutationResolvers,
  UserStatus,
  ResolversParentTypes,
  UserManagementMutationsCreateArgs,
  UserManagementMutationsUpdateArgs,
  UserManagementMutationsDeleteArgs,
  UserManagementMutationsChangeStatusArgs,
  UserManagementMutationsAssignRoleArgs,
  UserManagementMutationsRemoveRoleArgs
} from '$graphql/resolvers-types';
import {
  requireAuth,
} from '#/session/';
import {
  requirePermission,
} from "#/session/permissions"
import { db } from '$db/index';
import {
  usersTable,
  rolesTable,
  userRolesTable,
  abacAuditTable
} from '$db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const userMutations = {
  async createUser(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { input }: UserManagementMutationsCreateArgs,
    context: AppContext
  ) {
    // Require authentication and permission to create users
    requireAuth(context);
    await requirePermission(context, 'users', 'create');

    // Validate input
    if (!input.name.trim() || input.name.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, input.name.trim()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(input.password, saltRounds);

      // Create user
      const [newUser] = await db
        .insert(usersTable)
        .values({
          name: input.name.trim(),
          passwordHash,
          status: input.status || 'ACTIVE',
        })
        .returning();

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          status: newUser.status as UserStatus,
          creationTime: newUser.creationTime.toISOString(),
          lastLoginTime: newUser.lastLoginTime.toISOString(),
          lastEditTime: newUser.lastEditTime.toISOString(),
          roles: [],
          policies: []
        },
        message: `User "${newUser.name}" created successfully`
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  async updateUser(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { id, input }: UserManagementMutationsUpdateArgs,
    context: AppContext
  ) {
    // Check permissions - users can update themselves, admins can update anyone
    const currentUserId = context.session?.user.id;

    if (currentUserId === id) {
      requireAuth(context);
    } else {
      await requirePermission(context, 'users', 'update', { id });
    }

    // Get existing user
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    try {
      // Prepare update data
      const updateData: Partial<typeof usersTable.$inferInsert> = {
        lastEditTime: new Date()
      };

      if (input.name) {
        if (input.name.length < 3) {
          throw new Error('Username must be at least 3 characters long');
        }

        // Check if new username already exists (excluding current user)
        const existingWithName = await db
          .select()
          .from(usersTable)
          .where(and(
            eq(usersTable.name, input.name),
            eq(usersTable.id, id)
          ))
          .limit(1);

        if (existingWithName.length > 0) {
          throw new Error('Username already exists');
        }

        updateData.name = input.name.trim();
      }

      if (input.password) {
        if (input.password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }

        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(input.password, saltRounds);
      }

      if (input.status) {
        // Only admins can change status, and prevent self-deactivation
        if (currentUserId === id && input.status !== 'ACTIVE') {
          throw new Error('Cannot change your own status to inactive or banned');
        }

        const action = input.status === 'BANNED' ? 'ban' :
                      input.status === 'ACTIVE' ? 'activate' : 'deactivate';

        await requirePermission(context, 'users', action, { id });
        updateData.status = input.status;
      }

      // Update user
      const [updatedUser] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        status: updatedUser.status as UserStatus,
        creationTime: updatedUser.creationTime.toISOString(),
        lastLoginTime: updatedUser.lastLoginTime.toISOString(),
        lastEditTime: updatedUser.lastEditTime.toISOString(),
        roles: [],
        policies: []
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  async deleteUser(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { id }: UserManagementMutationsDeleteArgs,
    context: AppContext
  ) {
    // Only admins can delete users
    await requirePermission(context, 'users', 'delete');

    // Prevent self-deletion
    if (context.session!.user.id === id) {
      throw new Error('Cannot delete your own account');
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    try {
      // Delete user (cascade will handle related records)
      await db.delete(usersTable).where(eq(usersTable.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },

  async changeUserStatus(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { id, status }: UserManagementMutationsChangeStatusArgs,
    context: AppContext
  ) {
    // Check permissions for status changes
    const action = status === 'BANNED' ? 'ban' :
                  status === 'ACTIVE' ? 'activate' : 'deactivate';

    await requirePermission(context, 'users', action);

    // Prevent changing own status to banned/inactive
    if (context.session!.user.id === id && status !== 'ACTIVE') {
      throw new Error('Cannot change your own status to inactive or banned');
    }

    try {
      // Update status
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          status,
          lastEditTime: new Date()
        })
        .where(eq(usersTable.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        status: updatedUser.status as UserStatus,
        creationTime: updatedUser.creationTime.toISOString(),
        lastLoginTime: updatedUser.lastLoginTime.toISOString(),
        lastEditTime: updatedUser.lastEditTime.toISOString(),
        roles: [],
        policies: []
      };
    } catch (error) {
      console.error('Error changing user status:', error);
      throw new Error('Failed to change user status');
    }
  },

  async assignRole(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { userId, roleId, expiresAt }: UserManagementMutationsAssignRoleArgs,
    context: AppContext
  ) {
    // Check permissions
    await requirePermission(context, 'users', 'update');

    // Verify user and role exist
    const [user, role] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
      db.select().from(rolesTable).where(eq(rolesTable.id, roleId)).limit(1)
    ]);

    if (!user[0]) {
      throw new Error('User not found');
    }

    if (!role[0]) {
      throw new Error('Role not found');
    }

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(userRolesTable)
      .where(and(
        eq(userRolesTable.userId, userId),
        eq(userRolesTable.roleId, roleId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      throw new Error('Role already assigned to user');
    }

    try {
      // Create role assignment
      await db
        .insert(userRolesTable)
        .values({
          userId,
          roleId,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        });

      return {
        user: {
          id: user[0].id,
          name: user[0].name,
          status: user[0].status as UserStatus,
          creationTime: user[0].creationTime.toISOString(),
          lastLoginTime: user[0].lastLoginTime.toISOString(),
          lastEditTime: user[0].lastEditTime.toISOString(),
          roles: [],
          policies: []
        },
        role: {
          id: role[0].id,
          name: role[0].name,
          description: role[0].description,
          creationTime: role[0].creationTime.toISOString(),
          lastEditTime: role[0].lastEditTime.toISOString(),
          policies: []
        },
        message: `Role "${role[0].name}" assigned to user "${user[0].name}"`
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw new Error('Failed to assign role');
    }
  },

  async removeRole(
    _parent: ResolversParentTypes['UserManagementMutations'],
    { userId, roleId }: UserManagementMutationsRemoveRoleArgs,
    context: AppContext
  ) {
    // Check permissions
    await requirePermission(context, 'users', 'update');

    try {
      // Remove role assignment
      await db
        .delete(userRolesTable)
        .where(and(
          eq(userRolesTable.userId, userId),
          eq(userRolesTable.roleId, roleId)
        ));

      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      throw new Error('Failed to remove role');
    }
  }
};