// ABAC Policy types for session
export interface SessionPolicy {
  id: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  resourceType: string;
  actionType: string;
  ruleConnector: 'AND' | 'OR';
  rules: SessionPolicyRule[];
  source: 'ROLE' | 'DIRECT'; // How user got this policy
  roleId?: string; // If from role, which role
}

export interface SessionPolicyRule {
  id: string;
  attributePath: string;
  operator: string;
  expectedValue: string; // JSON string
  valueType: string;
  description?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  roles: UserRole[];
  policies: SessionPolicy[]; // All applicable policies (from roles + direct)
}

export interface SessionData {
  user: SessionUser;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
}

export interface SessionConfig {
  sessionTtl: number; // in seconds
  extendOnAccess: boolean;
  maxExtensions: number;
}