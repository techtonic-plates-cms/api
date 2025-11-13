import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { collectionsTable } from '../../../db/schema.ts';
import { eq, or, like } from 'drizzle-orm';
import { CollectionType } from './collection.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Queries
// ============================================================================

builder.queryField('collection', (t) =>
  t.field({
    type: CollectionType,
    nullable: true,
    args: {
      id: t.arg.string({ required: false }),
      name: t.arg.string({ required: false }),
      slug: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      // Require authentication
      requireAuth(context);

      // Must provide at least one identifier
      if (!args.id && !args.name && !args.slug) {
        throw new Error('Must provide at least one of: id, name, or slug');
      }

      // Build query based on provided args
      let query = db.select().from(collectionsTable);

      if (args.id) {
        query = query.where(eq(collectionsTable.id, args.id)) as typeof query;
      } else if (args.slug) {
        query = query.where(eq(collectionsTable.slug, args.slug)) as typeof query;
      } else if (args.name) {
        query = query.where(eq(collectionsTable.name, args.name)) as typeof query;
      }

      const collections = await query.limit(1);

      if (collections.length === 0) return null;

      const collection = collections[0];

      // Check ABAC permission to read this specific collection
      await context.requirePermission('collections', 'read', {
        id: collection.id,
        slug: collection.slug,
        ownerId: collection.createdBy,
      });

      return {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        createdBy: collection.createdBy,
      };
    },
  })
);

builder.queryField('collections', (t) =>
  t.field({
    type: [CollectionType],
    args: {
      search: t.arg.string({ required: false }),
      isLocalized: t.arg.boolean({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Check ABAC permission to read collections
      await context.requirePermission('collections', 'read');

      // Build query
      let queryBuilder = db.select().from(collectionsTable);

      // Apply filters
      if (args.search) {
        queryBuilder = queryBuilder.where(
          or(
            like(collectionsTable.name, `%${args.search}%`),
            like(collectionsTable.slug, `%${args.search}%`)
          )!
        ) as typeof queryBuilder;
      }

      if (args.isLocalized !== undefined && args.isLocalized !== null) {
        queryBuilder = queryBuilder.where(eq(collectionsTable.isLocalized, args.isLocalized)) as typeof queryBuilder;
      }

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const collections = await queryBuilder;

      return collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        createdBy: collection.createdBy,
      }));
    },
  })
);
