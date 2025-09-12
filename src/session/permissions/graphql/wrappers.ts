import type { AppContext } from '../../index';
import type { GraphQLResolveInfo } from 'graphql';
import { requireAuth, isAuthenticated } from './auth';

/**
 * Higher-order function to wrap resolvers with authentication
 * Usage: const protectedResolver = withAuth(originalResolver);
 */
export function withAuth<
  TParent = any,
  TArgs = any,
  TReturn = any
>(
  resolver: (
    parent: TParent, 
    args: TArgs, 
    context: AppContext & { 
      session: NonNullable<AppContext['session']>;
      permissions: NonNullable<AppContext['permissions']>;
    }, 
    info: GraphQLResolveInfo
  ) => TReturn
) {
  return (parent: TParent, args: TArgs, context: AppContext, info: GraphQLResolveInfo): TReturn => {
    requireAuth(context);
    return resolver(parent, args, context as AppContext & { 
      session: NonNullable<AppContext['session']>;
      permissions: NonNullable<AppContext['permissions']>;
    }, info);
  };
}

/**
 * Utility to filter results based on permissions
 * Useful for field-level security in resolvers
 */
export function filterByPermission<T extends Record<string, any>>(
  context: AppContext,
  items: T[],
  resource: string,
  action: string,
  getFieldScope?: (item: T) => string[]
): T[] {
  if (!isAuthenticated(context)) {
    return [];
  }
  
  return items.filter(item => {
    const fieldScope = getFieldScope ? getFieldScope(item) : undefined;
    return context.permissions.hasPermission(resource, action, fieldScope);
  });
}