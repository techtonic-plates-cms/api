import type { SessionUser, UserPermission } from '../types';
import type { AppContext } from '../../index';
import { GraphQLAuthError } from './graphql/errors';
import { requireAuth } from '../auth';

export class PermissionChecker {
  private user: SessionUser;

  constructor(user: SessionUser) {
    this.user = user;
  }

  hasPermission(
    resource: string, 
    action: string, 
    fieldScope?: string[]
  ): boolean {
    // Check if user is active
    if (this.user.status !== 'ACTIVE') {
      return false;
    }

    // Get all permissions (from roles and direct permissions)
    const allPermissions = this.getAllUserPermissions();
    
    // Check for matching permissions
    const relevantPermissions = allPermissions.filter(p => 
      p.resource === resource && p.action === action
    );

    if (relevantPermissions.length === 0) {
      return false;
    }

    // Check for explicit denials first (direct permissions can override role permissions)
    const directDenials = this.user.directPermissions.filter(p =>
      p.resource === resource && 
      p.action === action && 
      !p.granted
    );

    if (directDenials.length > 0) {
      // If there's a field-specific denial that matches, deny access
      if (fieldScope) {
        const fieldSpecificDenials = directDenials.filter(p => 
          p.scopeType === 'FIELD_SPECIFIC' && 
          p.fieldScope && 
          fieldScope.some(field => p.fieldScope!.includes(field))
        );
        if (fieldSpecificDenials.length > 0) {
          return false;
        }
      }
      
      // If there's a global or resource-specific denial, deny access
      const globalOrResourceDenials = directDenials.filter(p =>
        p.scopeType === 'GLOBAL' || p.scopeType === 'RESOURCE_SPECIFIC'
      );
      if (globalOrResourceDenials.length > 0) {
        return false;
      }
    }

    // Check for grants
    const grants = relevantPermissions.filter(p => p.granted);
    
    if (grants.length === 0) {
      return false;
    }

    // If no field scope is specified, check for any grant
    if (!fieldScope || fieldScope.length === 0) {
      return grants.length > 0;
    }

    // Check field-specific permissions
    const fieldSpecificGrants = grants.filter(p => 
      p.scopeType === 'FIELD_SPECIFIC' && 
      p.fieldScope && 
      fieldScope.some(field => p.fieldScope!.includes(field))
    );

    const globalGrants = grants.filter(p => p.scopeType === 'GLOBAL');
    const resourceGrants = grants.filter(p => p.scopeType === 'RESOURCE_SPECIFIC');

    // Grant access if there's a global grant, resource-specific grant, or field-specific grant
    return globalGrants.length > 0 || 
           resourceGrants.length > 0 || 
           fieldSpecificGrants.length > 0;
  }

  hasAnyPermission(
    resource: string, 
    actions: string[], 
    fieldScope?: string[]
  ): boolean {
    return actions.some(action => this.hasPermission(resource, action, fieldScope));
  }

  hasAllPermissions(
    resource: string, 
    actions: string[], 
    fieldScope?: string[]
  ): boolean {
    return actions.every(action => this.hasPermission(resource, action, fieldScope));
  }

  getPermissionsForResource(resource: string): UserPermission[] {
    const allPermissions = this.getAllUserPermissions();
    return allPermissions.filter(p => p.resource === resource);
  }

  getAllUserPermissions(): UserPermission[] {
    const permissions: UserPermission[] = [];
    
    // Add permissions from roles
    for (const role of this.user.roles) {
      permissions.push(...role.permissions);
    }
    
    // Add direct permissions
    permissions.push(...this.user.directPermissions);
    
    return permissions;
  }

  canCreate(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'create', fieldScope);
  }

  canRead(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'read', fieldScope);
  }

  canUpdate(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'update', fieldScope);
  }

  canDelete(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'delete', fieldScope);
  }

  canPublish(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'publish', fieldScope);
  }

  canUnpublish(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'unpublish', fieldScope);
  }

  canArchive(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'archive', fieldScope);
  }

  canRestore(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'restore', fieldScope);
  }

  canBan(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'ban', fieldScope);
  }

  canUnban(resource: string, fieldScope?: string[]): boolean {
    return this.hasPermission(resource, 'unban', fieldScope);
  }
}



/**
 * Require specific permission
 * Throws GraphQLError if permission is not granted
 */
export function requirePermission(
  context: AppContext,
  resource: string,
  action: string,
  fieldScope?: string[]
): void {
  requireAuth(context);
  
  if (!context.permissions!.hasPermission(resource, action, fieldScope)) {
    throw new GraphQLAuthError(
      `Insufficient permissions. Required: ${action} on ${resource}${fieldScope ? ` (fields: ${fieldScope.join(', ')})` : ''}`,
      'FORBIDDEN'
    );
  }
}

/**
 * Require any of the specified permissions
 * Throws GraphQL Error if none of the permissions are granted
 */
export function requireAnyPermission(
  context: AppContext,
  resource: string,
  actions: string[],
  fieldScope?: string[]
): void {
  requireAuth(context);
  
  if (!context.permissions!.hasAnyPermission(resource, actions, fieldScope)) {
    throw new GraphQLAuthError(
      `Insufficient permissions. Required one of: ${actions.join(', ')} on ${resource}${fieldScope ? ` (fields: ${fieldScope.join(', ')})` : ''}`,
      'FORBIDDEN'
    );
  }
}
