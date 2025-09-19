import { collectionTypeResolvers } from './collection.js';
import { entryTypeResolvers } from './entry.js';
import { userTypeResolvers, roleTypeResolvers, policyTypeResolvers } from './user.js';
import { accountMutationsResolvers } from '../mutations/self.js';
import { contentMutationsResolvers } from '../mutations/content/index.js';
import {
  adminMutationsResolvers,
  userManagementMutationsResolvers,
  roleManagementMutationsResolvers,
  policyManagementMutationsResolvers
} from '../mutations/admin/index.js';

export const typeResolvers = {
  ...collectionTypeResolvers,
  ...entryTypeResolvers,
  User: userTypeResolvers,
  Role: roleTypeResolvers,
  Policy: policyTypeResolvers,
  AccountMutations: accountMutationsResolvers,
  ContentMutations: contentMutationsResolvers,
  AdminMutations: adminMutationsResolvers,
  UserManagementMutations: userManagementMutationsResolvers,
  RoleManagementMutations: roleManagementMutationsResolvers,
  PolicyManagementMutations: policyManagementMutationsResolvers,
};