import type { MutationResolvers } from '../../.graphql/resolvers-types.js';
import { collectionMutations } from './collection.js';

export const mutationResolvers: MutationResolvers = {
  ...collectionMutations
};