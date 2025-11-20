import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { rolesTable } from '../../../db/schema.ts';
import { eq, like } from 'drizzle-orm';
import { RoleType } from './role.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Role Queries
// ============================================================================

builder.queryField('role', (t) =>
  t.field({
    type: RoleType,
    nullable: true,
    description: 'Get a role by ID or name',
    args: {
      id: t.arg.id({ required: false }),
      name: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      if (!args.id && !args.name) {
        throw new Error('Must provide either id or name');
      }

      // Check permission to read roles
      await context.requirePermission('users', 'read'); // Roles are part of user management

      let query = db.select().from(rolesTable);

      if (args.id) {
        query = query.where(eq(rolesTable.id, args.id)) as typeof query;
      } else if (args.name) {
        query = query.where(eq(rolesTable.name, args.name)) as typeof query;
      }

      const roles = await query.limit(1);

      if (roles.length === 0) return null;

      const role = roles[0];

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        creationTime: role.creationTime,
        lastEditTime: role.lastEditTime,
      };
    },
  })
);

builder.queryField('roles', (t) =>
  t.field({
    type: [RoleType],
    description: 'List all roles with optional search',
    args: {
      search: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Check permission to read roles
      await context.requirePermission('users', 'read');

      let queryBuilder = db.select().from(rolesTable);

      // Apply filters
      if (args.search) {
        queryBuilder = queryBuilder.where(
          like(rolesTable.name, `%${args.search}%`)
        ) as typeof queryBuilder;
      }

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const roles = await queryBuilder;

      return roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        creationTime: role.creationTime,
        lastEditTime: role.lastEditTime,
      }));
    },
  })
);
