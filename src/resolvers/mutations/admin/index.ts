import type {
  MutationResolvers,
  AdminMutations,

  AdminMutationsResolvers,
  UserManagementMutationsResolvers,
  RoleManagementMutationsResolvers,
  PolicyManagementMutationsResolvers
} from '$graphql/resolvers-types';

// Admin mutation field resolver
export const adminMutationResolver: Pick<MutationResolvers, 'admin'> = {
  admin: (): AdminMutations => ({
    users: {} as never,
    roles: {} as never,
    policies: {} as never
  })
};

// Admin mutations type resolvers
export const adminMutationsResolvers: AdminMutationsResolvers = {
  users: () => ({}) as never,
  roles: () => ({}) as never,
  policies: () => ({}) as never
};

// User management mutations type resolvers
export const userManagementMutationsResolvers: UserManagementMutationsResolvers = {
  create: async (_parent, { input }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.createUser!(_parent, { input }, context);
  },

  update: async (_parent, { id, input }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.updateUser!(_parent, { id, input }, context);
  },

  delete: async (_parent, { id }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.deleteUser!(_parent, { id }, context);
  },

  changeStatus: async (_parent, { id, status }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.changeUserStatus!(_parent, { id, status }, context);
  },

  assignRole: async (_parent, { userId, roleId, expiresAt }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.assignRole!(_parent, { userId, roleId, expiresAt }, context);
  },

  removeRole: async (_parent, { userId, roleId }, context) => {
    const { userMutations } = await import('./user');
    return userMutations.removeRole!(_parent, { userId, roleId }, context);
  }
};

// Role management mutations type resolvers
export const roleManagementMutationsResolvers: RoleManagementMutationsResolvers = {
  create: async (_parent, { input }, context) => {
    const { roleMutations } = await import('./role');
    return roleMutations.createRole!(_parent, { input }, context);
  },

  update: async (_parent, { id, input }, context) => {
    const { roleMutations } = await import('./role');
    return roleMutations.updateRole!(_parent, { id, input }, context);
  },

  delete: async (_parent, { id }, context) => {
    const { roleMutations } = await import('./role');
    return roleMutations.deleteRole!(_parent, { id }, context);
  },

  assignPolicy: async (_parent, { policyId, roleId, reason, expiresAt }, context) => {
    const { roleMutations } = await import('./role');
    return roleMutations.assignPolicyToRole!(_parent, { policyId, roleId, reason, expiresAt }, context);
  },

  removePolicy: async (_parent, { policyId, roleId }, context) => {
    const { roleMutations } = await import('./role');
    return roleMutations.removePolicyFromRole!(_parent, { policyId, roleId }, context);
  }
};

// Policy management mutations type resolvers
export const policyManagementMutationsResolvers: PolicyManagementMutationsResolvers = {
  create: async (_parent, { input }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.createPolicy!(_parent, { input }, context);
  },

  update: async (_parent, { id, input }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.updatePolicy!(_parent, { id, input }, context);
  },

  delete: async (_parent, { id }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.deletePolicy!(_parent, { id }, context);
  },

  assignToUser: async (_parent, { policyId, userId, reason, expiresAt }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.assignPolicyToUser!(_parent, { policyId, userId, reason, expiresAt }, context);
  },

  removeFromUser: async (_parent, { policyId, userId }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.removePolicyFromUser!(_parent, { policyId, userId }, context);
  },

  addRule: async (_parent, { policyId, rule }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.addPolicyRule!(_parent, { policyId, rule }, context);
  },

  removeRule: async (_parent, { policyId, ruleId }, context) => {
    const { policyMutations } = await import('./policy');
    return policyMutations.removePolicyRule!(_parent, { policyId, ruleId }, context);
  }
};