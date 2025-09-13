import type { AppContext } from '#/index';
import type { GraphQLResolveInfo } from 'graphql';
import { requireAuth, isAuthenticated } from '#/middleware';

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
      abacEvaluator: NonNullable<AppContext['abacEvaluator']>;
    }, 
    info: GraphQLResolveInfo
  ) => TReturn
) {
  return (parent: TParent, args: TArgs, context: AppContext, info: GraphQLResolveInfo): TReturn => {
    requireAuth(context);
    return resolver(parent, args, context as AppContext & { 
      session: NonNullable<AppContext['session']>;
      abacEvaluator: NonNullable<AppContext['abacEvaluator']>;
    }, info);
  };
}

/**
 * Utility to filter results based on ABAC permissions
 * Useful for field-level security in resolvers
 * Note: This returns a Promise since ABAC evaluation is async
 */
export async function filterByPermission<T extends Record<string, any>>(
  context: AppContext,
  items: T[],
  resourceType: string,
  actionType: string,
  getResourceData?: (item: T) => Record<string, any>
): Promise<T[]> {
  if (!isAuthenticated(context)) {
    return [];
  }
  
  const filteredItems: T[] = [];
  
  for (const item of items) {
    const resourceData = getResourceData ? getResourceData(item) : { id: item.id };
    const hasPermission = await context.abacEvaluator!.hasPermission(resourceType, actionType, resourceData);
    
    if (hasPermission) {
      filteredItems.push(item);
    }
  }
  
  return filteredItems;
}