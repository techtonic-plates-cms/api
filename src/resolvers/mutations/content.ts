import type { MutationResolvers, ContentMutationsResolvers } from '$graphql/resolvers-types';

// Content mutation field resolver
export const contentMutationResolver: Pick<MutationResolvers, 'content'> = {
  content: () => ({})
};

// Content mutations type resolvers
export const contentMutationsResolvers: ContentMutationsResolvers = {
  createCollection: async (_parent, { input }, context) => {
    // Import the existing logic from collection.ts
    const { collectionMutations } = await import('./collection');
    return collectionMutations.createCollection!(_parent, { input }, context, {} as any);
  },

  createEntry: async (_parent, { input }, context) => {
    // Import the existing logic from entry.ts
    const { entryMutations } = await import('./entry');
    return entryMutations.createEntry!(_parent, { input }, context, {} as any);
  }
};