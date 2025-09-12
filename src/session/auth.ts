import type { AppContext } from '../index';
import { GraphQLAuthError } from './permissions';

/**
 * Session Authentication Utilities
 * Use these helpers for authentication checks in your application
 */

/**
 * Ensure user is authenticated (non-throwing version)
 * Returns boolean
 */
export function isAuthenticated(context: AppContext): context is AppContext & { 
  session: NonNullable<AppContext['session']>;
  permissions: NonNullable<AppContext['permissions']>;
} {
  return !!(context.session && context.permissions && context.session.user.status === 'ACTIVE');
}

/**
 * Get current user from context
 * Returns user data if authenticated, null otherwise
 */
export function getCurrentUser(context: AppContext) {
  return isAuthenticated(context) ? context.session.user : null;
}

/**
 * Check if user has permission (non-throwing)
 * Returns boolean
 */
export function hasPermission(
  context: AppContext,
  resource: string,
  action: string,
  fieldScope?: string[]
): boolean {
  if (!isAuthenticated(context)) {
    return false;
  }
  
  return context.permissions.hasPermission(resource, action, fieldScope);
}

export function requireAuth(context: AppContext): asserts context is AppContext & { 
  session: NonNullable<AppContext['session']>;
  permissions: NonNullable<AppContext['permissions']>;
} {
  if (!context.session || !context.permissions) {
    throw new GraphQLAuthError('Authentication required', 'UNAUTHENTICATED');
  }
  
  if (context.session.user.status !== 'ACTIVE') {
    throw new GraphQLAuthError('Account is not active', 'UNAUTHENTICATED');
  }
}
