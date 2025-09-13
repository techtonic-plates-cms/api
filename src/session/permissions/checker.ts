// ABAC Permission checking functions - replaces the old PermissionChecker class

import type { AppContext } from '../../index';
import { GraphQLAuthError } from './graphql/errors';
import { requireAuth } from '../auth';



/**
 * Require specific permission (ABAC)
 * Throws GraphQLError if permission is not granted
 */
export async function requirePermission(
  context: AppContext,
  resourceType: string,
  actionType: string,
  resourceData?: Record<string, any>
): Promise<void> {
  requireAuth(context);
  
  const hasAccess = await context.abacEvaluator!.hasPermission(resourceType, actionType, resourceData);
  if (!hasAccess) {
    // Get detailed evaluation for better error message
    const evaluation = await context.abacEvaluator!.evaluate(resourceType, actionType, resourceData);
    throw new GraphQLAuthError(
      `Insufficient permissions. ${evaluation.reason}`,
      'FORBIDDEN'
    );
  }
}

/**
 * Require any of the specified actions on a resource
 * Throws GraphQL Error if none of the actions are permitted
 */
export async function requireAnyPermission(
  context: AppContext,
  resourceType: string,
  actions: string[],
  resourceData?: Record<string, any>
): Promise<void> {
  requireAuth(context);
  
  // Check each action until one is allowed
  for (const action of actions) {
    const hasAccess = await context.abacEvaluator!.hasPermission(resourceType, action, resourceData);
    if (hasAccess) {
      return; // Found a permitted action
    }
  }
  
  // None of the actions are permitted
  throw new GraphQLAuthError(
    `Insufficient permissions. Required one of: ${actions.join(', ')} on ${resourceType}`,
    'FORBIDDEN'
  );
}

/**
 * Require field-level permission
 * Throws GraphQLError if field access is not granted
 */
export async function requireFieldPermission(
  context: AppContext,
  fieldId: string,
  actionType: string,
  entryData?: Record<string, any>
): Promise<void> {
  requireAuth(context);
  
  const hasAccess = await context.abacEvaluator!.hasFieldPermission(fieldId, actionType, entryData);
  if (!hasAccess) {
    throw new GraphQLAuthError(
      `Insufficient permissions. Cannot ${actionType} field ${fieldId}`,
      'FORBIDDEN'
    );
  }
}
