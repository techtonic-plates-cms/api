import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { userRolesTable, usersTable, rolePoliciesTable, abacPoliciesTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

// ============================================================================
// Role Type
// ============================================================================

export const RoleType = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  creationTime?: Date;
  lastEditTime?: Date;
}>('Role');

RoleType.implement({
  fields: (t) => ({
    id: t.exposeString('id', {nullable: false}),
    name: t.exposeString('name', {nullable: false}),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    creationTime: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.creationTime?.toISOString() ?? null,
    }),
    lastEditTime: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.lastEditTime?.toISOString() ?? null,
    }),
    users: t.field({
      type: [UserRefType],
      description: 'Users assigned to this role',
      resolve: async (parent) => {
        const roleUsers = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            status: usersTable.status,
            assignedAt: userRolesTable.assignedAt,
            expiresAt: userRolesTable.expiresAt,
          })
          .from(userRolesTable)
          .innerJoin(usersTable, eq(userRolesTable.userId, usersTable.id))
          .where(eq(userRolesTable.roleId, parent.id));
        
        return roleUsers.map((user) => ({
          id: user.id,
          name: user.name,
          status: user.status,
          assignedAt: user.assignedAt,
          expiresAt: user.expiresAt,
        }));
      },
    }),
    policies: t.field({
      type: [PolicyRefType],
      description: 'Policies assigned to this role',
      resolve: async (parent) => {
        const rolePolicies = await db
          .select({
            id: abacPoliciesTable.id,
            name: abacPoliciesTable.name,
            description: abacPoliciesTable.description,
            effect: abacPoliciesTable.effect,
            resourceType: abacPoliciesTable.resourceType,
            actionType: abacPoliciesTable.actionType,
            assignedAt: rolePoliciesTable.assignedAt,
            expiresAt: rolePoliciesTable.expiresAt,
          })
          .from(rolePoliciesTable)
          .innerJoin(abacPoliciesTable, eq(rolePoliciesTable.policyId, abacPoliciesTable.id))
          .where(eq(rolePoliciesTable.roleId, parent.id));
        
        return rolePolicies.map((policy) => ({
          id: policy.id,
          name: policy.name,
          description: policy.description,
          effect: policy.effect,
          resourceType: policy.resourceType,
          actionType: policy.actionType,
          assignedAt: policy.assignedAt,
          expiresAt: policy.expiresAt,
        }));
      },
    }),
  }),
});

// ============================================================================
// User Reference Type (for role.users field)
// ============================================================================

export const UserRefType = builder.objectRef<{
  id: string;
  name: string;
  status: string;
  assignedAt?: Date;
  expiresAt?: Date | null;
}>('UserRef');

UserRefType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    status: t.exposeString('status'),
    assignedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.assignedAt?.toISOString() ?? null,
    }),
    expiresAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.expiresAt?.toISOString() ?? null,
    }),
  }),
});

// ============================================================================
// Policy Reference Type (for role.policies field)
// ============================================================================

export const PolicyRefType = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  effect: string;
  resourceType: string;
  actionType: string;
  assignedAt?: Date;
  expiresAt?: Date | null;
}>('PolicyRef');

PolicyRefType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    effect: t.exposeString('effect'),
    resourceType: t.exposeString('resourceType'),
    actionType: t.exposeString('actionType'),
    assignedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.assignedAt?.toISOString() ?? null,
    }),
    expiresAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.expiresAt?.toISOString() ?? null,
    }),
  }),
});
