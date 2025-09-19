import type { AppContext } from '#/index';
import type { MutationResolvers, UserStatus, AccountMutationsResolvers } from '$graphql/resolvers-types';
import { requireAuth } from '#/session/auth';
import { db } from '$db/index';
import { usersTable } from '$db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sessionManager } from '#/session/manager';

// Account mutation field resolver - returns the AccountMutations object
export const accountMutationResolver: Pick<MutationResolvers, 'account'> = {
  account: () => ({}) as never
};

// Account mutations type resolvers - the actual mutation methods
export const accountMutationsResolvers: AccountMutationsResolvers = {
  async updateProfile(_parent, { input }, context) {
    requireAuth(context);

    const userId = context.session.user.id;

    // Validate input
    if (!input.name.trim() || input.name.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    // Check if new username already exists (excluding current user)
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(and(
        eq(usersTable.name, input.name.trim()),
        // Make sure it's not the current user
      ))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0]?.id !== userId) {
      throw new Error('Username already exists');
    }

    try {
      // Update user
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          name: input.name.trim(),
          lastEditTime: new Date()
        })
        .where(eq(usersTable.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to update profile');
      }

      // Refresh session data to reflect the changes
      await sessionManager.refreshSessionData(userId);

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
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  async changePassword(_parent, { input }, context) {
    requireAuth(context);

    const userId = context.session.user.id;

    // Validate input
    if (!input.currentPassword) {
      throw new Error('Current password is required');
    }

    if (!input.newPassword || input.newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (input.currentPassword === input.newPassword) {
      throw new Error('New password must be different from current password');
    }

    try {
      // Get current user with password hash
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(input.newPassword, saltRounds);

      // Update password
      await db
        .update(usersTable)
        .set({
          passwordHash: newPasswordHash,
          lastEditTime: new Date()
        })
        .where(eq(usersTable.id, userId));

      // For security, destroy all existing sessions except current one
      // This forces re-authentication on other devices
      const allUserSessions = await sessionManager.getUserSessions(userId);
      for (const sessionId of allUserSessions) {
        if (sessionId !== userId) { // Don't destroy current session
          await sessionManager.destroySession(sessionId);
        }
      }

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      if (error instanceof Error && error.message === 'Current password is incorrect') {
        throw error;
      }
      throw new Error('Failed to change password');
    }
  },

  async deactivate(_parent, { confirmUsername }, context) {
    requireAuth(context);

    const userId = context.session.user.id;
    const currentUsername = context.session.user.name;

    // Validate confirmation
    if (confirmUsername !== currentUsername) {
      throw new Error('Username confirmation does not match');
    }

    try {
      // Deactivate user account
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          status: 'INACTIVE',
          lastEditTime: new Date()
        })
        .where(eq(usersTable.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to deactivate account');
      }

      // Destroy all user sessions
      await sessionManager.destroyAllUserSessions(userId);

      return true;
    } catch (error) {
      console.error('Error deactivating account:', error);
      throw new Error('Failed to deactivate account');
    }
  }
};