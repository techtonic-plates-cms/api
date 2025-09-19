import { collectionQueries } from './collection.js';
import { userQueryResolvers } from './user.js';

export const queryResolvers = {
  ...collectionQueries,
  ...userQueryResolvers
};