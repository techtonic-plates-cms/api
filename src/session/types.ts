export interface UserPermission {
  id: string;
  resource: string;
  action: string;
  scopeType: 'GLOBAL' | 'RESOURCE_SPECIFIC' | 'FIELD_SPECIFIC';
  fieldScope?: string[];
  granted: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: UserPermission[];
}

export interface SessionUser {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  roles: UserRole[];
  directPermissions: UserPermission[];
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