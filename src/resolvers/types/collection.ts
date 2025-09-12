import type { EntryFilter } from '../../.graphql/resolvers-types.js';
import type { AppContext } from '../../index.js';
import type { GraphQLResolveInfo } from 'graphql';
import { 
  isAuthenticated,
  hasPermission
} from '../../middleware/index.js';
import { extractFieldFiltersFromSelectionSet } from '../utils/graphql-parsing.js';
import { getEntriesWithFieldFilters } from '../utils/entry-queries.js';

export const collectionTypeResolvers = {
  Collection: {
    entries: async (parent: any, { filter }: { filter?: EntryFilter }, context: AppContext, info: GraphQLResolveInfo) => {
      // Example: Filter entries based on permissions
      let entriesFilter = filter;
      
      if (!isAuthenticated(context)) {
        // Non-authenticated users can only see published entries
        entriesFilter = { ...filter, status: 'PUBLISHED' };
      } else if (!hasPermission(context, 'entries', 'read')) {
        // Authenticated users without read permission can only see published entries
        entriesFilter = { ...filter, status: 'PUBLISHED' };
      }
      // Users with read permission can see all entries based on their original filter
      
      // Extract field filters from the GraphQL query
      const fieldFilters = extractFieldFiltersFromSelectionSet(info);
      
      // Use database-level filtering for much better performance
      const entries = await getEntriesWithFieldFilters(parent.id, entriesFilter, fieldFilters);

      return entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      }));
    }
  }
};