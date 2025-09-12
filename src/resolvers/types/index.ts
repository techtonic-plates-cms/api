import { collectionTypeResolvers } from './collection.js';
import { entryTypeResolvers } from './entry.js';

export const typeResolvers = {
  ...collectionTypeResolvers,
  ...entryTypeResolvers
};