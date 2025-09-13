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
  abacEvaluator: NonNullable<AppContext['abacEvaluator']>;
} {
  return !!(context.session && context.abacEvaluator && context.session.user.status === 'ACTIVE');
}

/**
 * Get current user from context
 * Returns user data if authenticated, null otherwise
 */
export function getCurrentUser(context: AppContext) {
  return isAuthenticated(context) ? context.session.user : null;
}

/**
 * Check if user has permission (non-throwing, async)
 * Returns Promise<boolean>
 */
export async function hasPermission(
  context: AppContext,
  resourceType: string,
  actionType: string,
  resourceData?: Record<string, any>
): Promise<boolean> {
  if (!isAuthenticated(context)) {
    return false;
  }
  
  return context.abacEvaluator.hasPermission(resourceType, actionType, resourceData);
}

export function requireAuth(context: AppContext): asserts context is AppContext & { 
  session: NonNullable<AppContext['session']>;
  abacEvaluator: NonNullable<AppContext['abacEvaluator']>;
} {
  if (!context.session || !context.abacEvaluator) {
    throw new GraphQLAuthError('Authentication required', 'UNAUTHENTICATED');
  }
  
  if (context.session.user.status !== 'ACTIVE') {
    throw new GraphQLAuthError('Account is not active', 'UNAUTHENTICATED');
  }
}
