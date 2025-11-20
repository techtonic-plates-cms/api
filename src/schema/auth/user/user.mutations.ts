import { GraphQLError } from 'graphql';
import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { usersTable, userRolesTable, rolesTable } from '../../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { User, UserStatusEnum } from './user.type.ts';
import { requireAuth } from '../../../graphql-context.ts';
import { hashPassword, verifyPassword } from '../../../auth.ts';
import { deleteAllUserSessions } from '../../../session.ts';

// ============================================================================
// Input Types
// ============================================================================

const CreateUserInput = builder.inputType('CreateUserInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    password: t.string({ required: true }),
    status: t.field({ type: UserStatusEnum, required: false }),
    roleIds: t.idList({ required: false }),
  }),
});

const UpdateUserInput = builder.inputType('UpdateUserInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    name: t.string({ required: false }),
    status: t.field({ type: UserStatusEnum, required: false }),
  }),
});

const ChangePasswordInput = builder.inputType('ChangePasswordInput', {
  fields: (t) => ({
    userId: t.id({ required: false }), // If not provided, changes own password
    currentPassword: t.string({ required: false }), // Required when changing own password
    newPassword: t.string({ required: true }),
  }),
});

const AssignRoleInput = builder.inputType('AssignRoleInput', {
  fields: (t) => ({
    userId: t.id({ required: true }),
    roleId: t.id({ required: true }),
    expiresAt: t.string({ required: false }), // ISO date string
  }),
});

// ============================================================================
// User Mutations Type
// ============================================================================

export const UserMutations = builder.objectRef<Record<PropertyKey, never>>('UserMutations');

UserMutations.implement({
  fields: (t) => ({
    create: t.field({
      type: User,
      description: 'Create a new user',
      args: {
        input: t.arg({ type: CreateUserInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to create users
        await context.requirePermission('users', 'create');
        
        // Hash password
        const passwordHash = await hashPassword(args.input.password);
        
        // Create user
        const [newUser] = await db.insert(usersTable).values({
          name: args.input.name,
          passwordHash,
          status: args.input.status ?? 'ACTIVE',
        }).returning();

        // Assign roles if provided
        if (args.input.roleIds && args.input.roleIds.length > 0) {
          // Check permission to assign roles
          await context.requirePermission('users', 'update');
          
          // Assign roles
          await db.insert(userRolesTable).values(
            args.input.roleIds.map((roleId) => ({
              userId: newUser.id,
              roleId,
            }))
          );
        }
        
        return {
          id: newUser.id,
          name: newUser.name,
          status: newUser.status,
          creationTime: newUser.creationTime,
          lastLoginTime: newUser.lastLoginTime,
          lastEditTime: newUser.lastEditTime,
        };
      },
    }),
    
    update: t.field({
      type: User,
      description: 'Update a user',
      args: {
        input: t.arg({ type: UpdateUserInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update users
        await context.requirePermission('users', 'update');
        
        // Build update values
        const updateValues: Record<string, unknown> = {
          lastEditTime: new Date(),
        };
        
        if (args.input.name !== undefined) updateValues.name = args.input.name;
        if (args.input.status !== undefined) updateValues.status = args.input.status;
        
        // Update user
        const [updatedUser] = await db
          .update(usersTable)
          .set(updateValues)
          .where(eq(usersTable.id, args.input.id))
          .returning();
        
        if (!updatedUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // If user was banned or deactivated, invalidate all their sessions
        if (args.input.status && args.input.status !== 'ACTIVE') {
          await deleteAllUserSessions(updatedUser.id);
        }
        
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          status: updatedUser.status,
          creationTime: updatedUser.creationTime,
          lastLoginTime: updatedUser.lastLoginTime,
          lastEditTime: updatedUser.lastEditTime,
        };
      },
    }),
    
    delete: t.field({
      type: 'Boolean',
      description: 'Delete a user',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to delete users
        await context.requirePermission('users', 'delete');
        
        // Prevent self-deletion
        if (context.user?.id === args.id) {
          throw new GraphQLError('Cannot delete your own user account', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Invalidate all user sessions before deletion
        await deleteAllUserSessions(args.id);
        
        // Delete user (cascade will handle related records)
        await db.delete(usersTable).where(eq(usersTable.id, args.id));
        
        return true;
      },
    }),
    
    changePassword: t.field({
      type: 'Boolean',
      description: 'Change user password',
      args: {
        input: t.arg({ type: ChangePasswordInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        const currentUser = requireAuth(context);
        
        const targetUserId = args.input.userId ?? currentUser.id;
        const isChangingOwnPassword = targetUserId === currentUser.id;
        
        // If changing another user's password, require permission
        if (!isChangingOwnPassword) {
          await context.requirePermission('users', 'update');
        }
        
        // Get user
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, targetUserId))
          .limit(1);
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // If changing own password, verify current password
        if (isChangingOwnPassword) {
          if (!args.input.currentPassword) {
            throw new GraphQLError('Current password is required when changing your own password', {
              extensions: { code: 'BAD_REQUEST' },
            });
          }
          
          const isValidPassword = await verifyPassword(args.input.currentPassword, user.passwordHash);
          if (!isValidPassword) {
            throw new GraphQLError('Current password is incorrect', {
              extensions: { code: 'UNAUTHENTICATED' },
            });
          }
        }
        
        // Hash new password
        const newPasswordHash = await hashPassword(args.input.newPassword);
        
        // Update password
        await db
          .update(usersTable)
          .set({
            passwordHash: newPasswordHash,
            lastEditTime: new Date(),
          })
          .where(eq(usersTable.id, targetUserId));
        
        // Invalidate all sessions for this user (force re-login)
        await deleteAllUserSessions(targetUserId);
        
        return true;
      },
    }),
    
    assignRole: t.field({
      type: 'Boolean',
      description: 'Assign a role to a user',
      args: {
        input: t.arg({ type: AssignRoleInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update users
        await context.requirePermission('users', 'update');
        
        // Verify user and role exist
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, args.input.userId))
          .limit(1);
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const [role] = await db
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.id, args.input.roleId))
          .limit(1);
        
        if (!role) {
          throw new GraphQLError('Role not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if assignment already exists
        const existing = await db
          .select()
          .from(userRolesTable)
          .where(
            and(
              eq(userRolesTable.userId, args.input.userId),
              eq(userRolesTable.roleId, args.input.roleId)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          throw new GraphQLError('Role already assigned to user', {
            extensions: { code: 'CONFLICT' },
          });
        }
        
        // Assign role
        await db.insert(userRolesTable).values({
          userId: args.input.userId,
          roleId: args.input.roleId,
          expiresAt: args.input.expiresAt ? new Date(args.input.expiresAt) : null,
        });
        
        return true;
      },
    }),
    
    unassignRole: t.field({
      type: 'Boolean',
      description: 'Remove a role from a user',
      args: {
        userId: t.arg.id({ required: true }),
        roleId: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update users
        await context.requirePermission('users', 'update');
        
        // Remove role assignment
        await db
          .delete(userRolesTable)
          .where(
            and(
              eq(userRolesTable.userId, args.userId),
              eq(userRolesTable.roleId, args.roleId)
            )
          );
        
        return true;
      },
    }),
    
    activate: t.field({
      type: User,
      description: 'Activate a user account',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to activate users
        await context.requirePermission('users', 'activate');
        
        const [user] = await db
          .update(usersTable)
          .set({
            status: 'ACTIVE',
            lastEditTime: new Date(),
          })
          .where(eq(usersTable.id, args.id))
          .returning();
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        return {
          id: user.id,
          name: user.name,
          status: user.status,
          creationTime: user.creationTime,
          lastLoginTime: user.lastLoginTime,
          lastEditTime: user.lastEditTime,
        };
      },
    }),
    
    deactivate: t.field({
      type: User,
      description: 'Deactivate a user account',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to deactivate users
        await context.requirePermission('users', 'deactivate');
        
        // Prevent self-deactivation
        if (context.user?.id === args.id) {
          throw new GraphQLError('Cannot deactivate your own account', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        const [user] = await db
          .update(usersTable)
          .set({
            status: 'INACTIVE',
            lastEditTime: new Date(),
          })
          .where(eq(usersTable.id, args.id))
          .returning();
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Invalidate all sessions
        await deleteAllUserSessions(user.id);
        
        return {
          id: user.id,
          name: user.name,
          status: user.status,
          creationTime: user.creationTime,
          lastLoginTime: user.lastLoginTime,
          lastEditTime: user.lastEditTime,
        };
      },
    }),
    
    ban: t.field({
      type: User,
      description: 'Ban a user account',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to ban users
        await context.requirePermission('users', 'ban');
        
        // Prevent self-ban
        if (context.user?.id === args.id) {
          throw new GraphQLError('Cannot ban your own account', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        const [user] = await db
          .update(usersTable)
          .set({
            status: 'BANNED',
            lastEditTime: new Date(),
          })
          .where(eq(usersTable.id, args.id))
          .returning();
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Invalidate all sessions
        await deleteAllUserSessions(user.id);
        
        return {
          id: user.id,
          name: user.name,
          status: user.status,
          creationTime: user.creationTime,
          lastLoginTime: user.lastLoginTime,
          lastEditTime: user.lastEditTime,
        };
      },
    }),
    
    unban: t.field({
      type: User,
      description: 'Unban a user account (sets to ACTIVE)',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to unban users
        await context.requirePermission('users', 'unban');
        
        const [user] = await db
          .update(usersTable)
          .set({
            status: 'ACTIVE',
            lastEditTime: new Date(),
          })
          .where(eq(usersTable.id, args.id))
          .returning();
        
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        return {
          id: user.id,
          name: user.name,
          status: user.status,
          creationTime: user.creationTime,
          lastLoginTime: user.lastLoginTime,
          lastEditTime: user.lastEditTime,
        };
      },
    }),
  }),
});

// ============================================================================
// Wire up UserMutations to root Mutation type
// ============================================================================

builder.mutationField('users', (t) =>
  t.field({
    type: UserMutations,
    resolve: () => ({}),
  })
);
