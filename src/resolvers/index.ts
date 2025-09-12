import GraphQLJSON from 'graphql-type-json';
import { queryResolvers } from './queries/index.js';
import { mutationResolvers } from './mutations/index.js';
import { typeResolvers } from './types/index.js';

export const resolvers = {
  JSON: GraphQLJSON,
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...typeResolvers
};