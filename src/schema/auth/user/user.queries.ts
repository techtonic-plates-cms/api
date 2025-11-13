import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { usersTable } from '../../../db/schema.ts';
import { eq, like } from 'drizzle-orm';
import { User } from './user.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// User Queries
// ============================================================================

builder.queryField('user', (t) =>
  t.field({
    type: User,
    nullable: true,
    description: 'Get a user by ID or name',
    args: {
      id: t.arg.string({ required: false }),
      name: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      if (!args.id && !args.name) {
        throw new Error('Must provide either id or name');
      }

      // Check permission to read users
      await context.requirePermission('users', 'read');

      let query = db.select().from(usersTable);

      if (args.id) {
        query = query.where(eq(usersTable.id, args.id)) as typeof query;
      } else if (args.name) {
        query = query.where(eq(usersTable.name, args.name)) as typeof query;
      }

      const users = await query.limit(1);

      if (users.length === 0) return null;

      const user = users[0];

      return {
        id: user.id,
        name: user.name,
        status: user.status,
        creationTime: user.creationTime,
        lastLoginTime: user.lastLoginTime,
        lastEditTime: user.lastEditTime,
      };
    },
  })
);

builder.queryField('users', (t) =>
  t.field({
    type: [User],
    description: 'List users with optional filters',
    args: {
      search: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Check permission to read users
      await context.requirePermission('users', 'read');

      let queryBuilder = db.select().from(usersTable);

      // Apply filters
      if (args.search) {
        queryBuilder = queryBuilder.where(
          like(usersTable.name, `%${args.search}%`)
        ) as typeof queryBuilder;
      }

      if (args.status) {
        queryBuilder = queryBuilder.where(
          eq(usersTable.status, args.status as 'ACTIVE' | 'INACTIVE' | 'BANNED')
        ) as typeof queryBuilder;
      }

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const users = await queryBuilder;

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        status: user.status,
        creationTime: user.creationTime,
        lastLoginTime: user.lastLoginTime,
        lastEditTime: user.lastEditTime,
      }));
    },
  })
);
