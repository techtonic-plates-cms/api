import { queryResolvers } from './queries/index.js';
import { mutationResolvers } from './mutations/index.js';
import { typeResolvers } from './types/index.js';

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...typeResolvers
};