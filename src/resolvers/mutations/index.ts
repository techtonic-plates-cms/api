import type { MutationResolvers } from '$graphql/resolvers-types';
import { contentMutationResolver } from './content';
import { accountMutationResolver } from './self';
import { adminMutationResolver } from './admin';

export const mutationResolvers: MutationResolvers = {
  ...contentMutationResolver,
  ...accountMutationResolver,
  ...adminMutationResolver
};