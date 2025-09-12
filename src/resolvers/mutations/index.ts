import type { MutationResolvers } from '$graphql/resolvers-types';
import { collectionMutations } from './collection';
import { entryMutations } from './entry';

export const mutationResolvers: MutationResolvers = {
  ...collectionMutations,
  ...entryMutations
};