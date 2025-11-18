import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { rolesTable, userRolesTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

// ============================================================================
// User Type (Enhanced - replaces auth.type.ts User)
// ============================================================================

export const User = builder.objectRef<{
  id: string;
  name: string;
  sessionId?: string;
  status?: string;
  creationTime?: Date;
  lastLoginTime?: Date;
  lastEditTime?: Date;
}>('User');

User.implement({
  fields: (t) => ({
    id: t.exposeString('id', {nullable: false}),
    name: t.exposeString('name', {nullable: false}),
    sessionId: t.exposeString('sessionId', { nullable: true }),
    status: t.string({ 
      nullable: true, 
      resolve: (parent) => parent.status ?? null,
    }),
    creationTime: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.creationTime?.toISOString() ?? null,
    }),
    lastLoginTime: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.lastLoginTime?.toISOString() ?? null,
    }),
    lastEditTime: t.field({
      type: 'String',
      nullable: true,
      resolve: (parent) => parent.lastEditTime?.toISOString() ?? null,
    }),
    roles: t.field({
      type: [RoleRefType],
      resolve: async (parent) => {
        const userRoles = await db
          .select({
            id: rolesTable.id,
            name: rolesTable.name,
            description: rolesTable.description,
            assignedAt: userRolesTable.assignedAt,
            expiresAt: userRolesTable.expiresAt,
          })
          .from(userRolesTable)
          .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
          .where(eq(userRolesTable.userId, parent.id));
        
        return userRoles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          assignedAt: role.assignedAt,
          expiresAt: role.expiresAt,
        }));
      },
    }),
  }),
});

// ============================================================================
// Role Reference Type (for user.roles field)
// ============================================================================

export const RoleRefType = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  assignedAt?: Date;
  expiresAt?: Date | null;
}>('RoleRef');

RoleRefType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
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
// User Status Enum
// ============================================================================

export const UserStatusEnum = builder.enumType('UserStatus', {
  values: ['ACTIVE', 'INACTIVE', 'BANNED'] as const,
});
