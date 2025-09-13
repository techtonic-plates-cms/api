import { randomUUID } from 'crypto';
import { getRedisClient } from '../services/redis';
import { db } from '../db/index';
import { 
  usersTable, 
  userRolesTable, 
  rolesTable, 
  rolePoliciesTable,
  abacPoliciesTable,
  abacPolicyRulesTable,
  userPoliciesTable 
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { SessionData, SessionUser, UserRole, SessionPolicy, SessionPolicyRule, SessionConfig } from './types';

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

    // Get user roles (simplified - no permissions here)
    const userRoleData = await db
      .select({
        roleId: userRolesTable.roleId,
        roleName: rolesTable.name,
        roleDescription: rolesTable.description,
      })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(and(
        eq(userRolesTable.userId, userId),
        // TODO: Add expiry checks for role assignments
      ));

    const roles: UserRole[] = userRoleData.map(row => ({
      id: row.roleId,
      name: row.roleName,
      description: row.roleDescription || undefined,
    }));

    // Get policies from roles
    const rolePolicyData = await db
      .select({
        policyId: abacPoliciesTable.id,
        policyName: abacPoliciesTable.name,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        isActive: abacPoliciesTable.isActive,
        roleId: rolePoliciesTable.roleId,
        // Rule data
        ruleId: abacPolicyRulesTable.id,
        attributePath: abacPolicyRulesTable.attributePath,
        operator: abacPolicyRulesTable.operator,
        expectedValue: abacPolicyRulesTable.expectedValue,
        valueType: abacPolicyRulesTable.valueType,
        ruleDescription: abacPolicyRulesTable.description,
        ruleOrder: abacPolicyRulesTable.order,
        ruleActive: abacPolicyRulesTable.isActive,
      })
      .from(userRolesTable)
      .innerJoin(rolePoliciesTable, eq(userRolesTable.roleId, rolePoliciesTable.roleId))
      .innerJoin(abacPoliciesTable, eq(rolePoliciesTable.policyId, abacPoliciesTable.id))
      .leftJoin(abacPolicyRulesTable, eq(abacPoliciesTable.id, abacPolicyRulesTable.policyId))
      .where(and(
        eq(userRolesTable.userId, userId),
        eq(abacPoliciesTable.isActive, true),
        // TODO: Add expiry checks
      ));

    // Get direct user policies
    const directPolicyData = await db
      .select({
        policyId: abacPoliciesTable.id,
        policyName: abacPoliciesTable.name,
        effect: abacPoliciesTable.effect,
        priority: abacPoliciesTable.priority,
        resourceType: abacPoliciesTable.resourceType,
        actionType: abacPoliciesTable.actionType,
        ruleConnector: abacPoliciesTable.ruleConnector,
        isActive: abacPoliciesTable.isActive,
        roleId: sql`NULL`.as('roleId'),
        // Rule data
        ruleId: abacPolicyRulesTable.id,
        attributePath: abacPolicyRulesTable.attributePath,
        operator: abacPolicyRulesTable.operator,
        expectedValue: abacPolicyRulesTable.expectedValue,
        valueType: abacPolicyRulesTable.valueType,
        ruleDescription: abacPolicyRulesTable.description,
        ruleOrder: abacPolicyRulesTable.order,
        ruleActive: abacPolicyRulesTable.isActive,
      })
      .from(userPoliciesTable)
      .innerJoin(abacPoliciesTable, eq(userPoliciesTable.policyId, abacPoliciesTable.id))
      .leftJoin(abacPolicyRulesTable, eq(abacPoliciesTable.id, abacPolicyRulesTable.policyId))
      .where(and(
        eq(userPoliciesTable.userId, userId),
        eq(abacPoliciesTable.isActive, true),
        // TODO: Add expiry checks
      ));

    // Combine role and direct policies
    const allPolicyData = [...rolePolicyData, ...directPolicyData];

    // Group policies and their rules
    const policiesMap = new Map<string, SessionPolicy>();
    
    for (const row of allPolicyData) {
      if (!policiesMap.has(String(row.policyId))) {
        policiesMap.set(String(row.policyId), {
          id: String(row.policyId),
          name: String(row.policyName),
          effect: row.effect as 'ALLOW' | 'DENY',
          priority: Number(row.priority),
          resourceType: String(row.resourceType),
          actionType: String(row.actionType),
          ruleConnector: row.ruleConnector as 'AND' | 'OR',
          rules: [],
          source: row.roleId ? 'ROLE' : 'DIRECT',
          roleId: row.roleId ? String(row.roleId) : undefined
        });
      }

      const policy = policiesMap.get(String(row.policyId))!;
      
      // Add rule if it exists and is active
      if (row.ruleId && row.ruleActive) {
        policy.rules.push({
          id: String(row.ruleId),
          attributePath: String(row.attributePath),
          operator: String(row.operator),
          expectedValue: String(row.expectedValue),
          valueType: String(row.valueType),
          description: row.ruleDescription ? String(row.ruleDescription) : undefined
        });
      }
    }

    // Sort rules within each policy by order
    for (const policy of policiesMap.values()) {
      policy.rules.sort((a, b) => {
        // Find the order from the original data
        const aOrder = Number(allPolicyData.find(row => row.ruleId === a.id)?.ruleOrder) || 0;
        const bOrder = Number(allPolicyData.find(row => row.ruleId === b.id)?.ruleOrder) || 0;
        return aOrder - bOrder;
      });
    }

    const policies = Array.from(policiesMap.values());

    return {
      id: user.id,
      name: user.name,
      status: user.status,
      roles,
      policies
    };
  }

  private getSessionKey(sessionId: string): string {
    return `${this.sessionKeyPrefix}${sessionId}`;
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager();