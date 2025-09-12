import { randomUUID } from 'crypto';
import { getRedisClient } from '../services/redis';
import { db } from '../db/index';
import { 
  usersTable, 
  userRolesTable, 
  rolesTable, 
  rolePermissionsTable,
  permissionsTable,
  userPermissionsTable 
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { SessionData, SessionUser, UserRole, UserPermission, SessionConfig } from './types';

const DEFAULT_CONFIG: SessionConfig = {
  sessionTtl: 24 * 60 * 60, // 24 hours in seconds
  extendOnAccess: true,
  maxExtensions: 10
};

export class SessionManager {
  private config: SessionConfig;
  private sessionKeyPrefix = 'session:';

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async createSession(userId: string): Promise<string> {
    const redis = await getRedisClient();

    
    // Load user data with permissions and roles
    const userData = await this.loadUserData(userId);
    if (!userData) {
      throw new Error('User not found');
    }

    const now = Date.now();
    const sessionData: SessionData = {
      user: userData,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + (this.config.sessionTtl * 1000)
    };

    const sessionKey = this.getSessionKey(userData.id);
    await redis.setEx(
      sessionKey,
      this.config.sessionTtl,
      JSON.stringify(sessionData)
    );

    return userData.id;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const redis = await getRedisClient();
    const sessionKey = this.getSessionKey(sessionId);
    
    const sessionDataStr = await redis.get(sessionKey);
    if (!sessionDataStr) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    
    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      await this.destroySession(sessionId);
      return null;
    }

    // Extend session if configured to do so
    if (this.config.extendOnAccess) {
      await this.extendSession(sessionId);
    }

    return sessionData;
  }

  async extendSession(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    const sessionKey = this.getSessionKey(sessionId);
    
    const sessionDataStr = await redis.get(sessionKey);
    if (!sessionDataStr) {
      return;
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    const now = Date.now();
    
    sessionData.lastAccessedAt = now;
    sessionData.expiresAt = now + (this.config.sessionTtl * 1000);

    await redis.setEx(
      sessionKey,
      this.config.sessionTtl,
      JSON.stringify(sessionData)
    );
  }

  async refreshSessionData(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) {
      return;
    }

    // Reload user data with fresh permissions and roles
    const userData = await this.loadUserData(sessionData.user.id);
    if (!userData) {
      await this.destroySession(sessionId);
      return;
    }

    sessionData.user = userData;
    sessionData.lastAccessedAt = Date.now();

    const redis = await getRedisClient();
    const sessionKey = this.getSessionKey(sessionId);
    await redis.setEx(
      sessionKey,
      this.config.sessionTtl,
      JSON.stringify(sessionData)
    );
  }

  async destroySession(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    const sessionKey = this.getSessionKey(sessionId);
    await redis.del(sessionKey);
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    const redis = await getRedisClient();
    const pattern = `${this.sessionKeyPrefix}*`;
    
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const sessionDataStr = await redis.get(key);
      if (sessionDataStr) {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        if (sessionData.user.id === userId) {
          await redis.del(key);
        }
      }
    }
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const redis = await getRedisClient();
    const pattern = `${this.sessionKeyPrefix}*`;
    const sessionIds: string[] = [];
    
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const sessionDataStr = await redis.get(key);
      if (sessionDataStr) {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        if (sessionData.user.id === userId) {
          const sessionId = key.replace(this.sessionKeyPrefix, '');
          sessionIds.push(sessionId);
        }
      }
    }
    
    return sessionIds;
  }

  private async loadUserData(userId: string): Promise<SessionUser | null> {
    // Get user basic info
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Get user roles with permissions
    const userRoleData = await db
      .select({
        roleId: userRolesTable.roleId,
        roleName: rolesTable.name,
        roleDescription: rolesTable.description,
        permissionId: permissionsTable.id,
        resource: permissionsTable.resource,
        action: permissionsTable.action,
        scopeType: permissionsTable.scopeType,
        fieldScope: permissionsTable.fieldScope,
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.roleId))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(and(
        eq(userRolesTable.userId, userId),
        // Only include active assignments (not expired)
        // You might want to add expiry checks here
      ));

    // Group permissions by role
    const rolesMap = new Map<string, UserRole>();
    for (const row of userRoleData) {
      if (!rolesMap.has(row.roleId)) {
        rolesMap.set(row.roleId, {
          id: row.roleId,
          name: row.roleName,
          description: row.roleDescription || undefined,
          permissions: []
        });
      }
      
      const role = rolesMap.get(row.roleId)!;
      role.permissions.push({
        id: row.permissionId,
        resource: row.resource,
        action: row.action,
        scopeType: row.scopeType,
        fieldScope: row.fieldScope || undefined,
        granted: true
      });
    }

    // Get direct user permissions
    const directPermissionData = await db
      .select({
        permissionId: permissionsTable.id,
        resource: permissionsTable.resource,
        action: permissionsTable.action,
        scopeType: permissionsTable.scopeType,
        fieldScope: permissionsTable.fieldScope,
        granted: userPermissionsTable.granted,
      })
      .from(userPermissionsTable)
      .innerJoin(permissionsTable, eq(userPermissionsTable.permissionId, permissionsTable.id))
      .where(and(
        eq(userPermissionsTable.userId, userId),
        // Only include active assignments (not expired)
        // You might want to add expiry checks here
      ));

    const directPermissions: UserPermission[] = directPermissionData.map(row => ({
      id: row.permissionId,
      resource: row.resource,
      action: row.action,
      scopeType: row.scopeType,
      fieldScope: row.fieldScope || undefined,
      granted: row.granted
    }));

    return {
      id: user.id,
      name: user.name,
      status: user.status,
      roles: Array.from(rolesMap.values()),
      directPermissions
    };
  }

  private getSessionKey(sessionId: string): string {
    return `${this.sessionKeyPrefix}${sessionId}`;
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager();