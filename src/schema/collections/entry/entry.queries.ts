import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { entriesTable, entryStatusEnum } from '../../../db/schema.ts';
import { EntryType } from './entry.type.ts';
import { eq, and, or, like } from 'drizzle-orm';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Entry Queries
// ============================================================================

builder.queryField('entry', (t) =>
  t.field({
    type: EntryType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Fetch entry
      const [entry] = await db
        .select()
        .from(entriesTable)
        .where(eq(entriesTable.id, args.id))
        .limit(1);

      if (!entry) {
        return null;
      }

      // Check ABAC permission to read this entry
      await context.requirePermission('entries', 'read', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      return {
        id: entry.id,
        name: entry.name,
        collectionId: entry.collectionId,
        status: entry.status,
        slug: entry.slug,
        locale: entry.locale,
        defaultLocale: entry.defaultLocale,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
        createdBy: entry.createdBy,
      };
    },
  })
);

builder.queryField('entries', (t) =>
  t.field({
    type: [EntryType],
    args: {
      collectionId: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
      locale: t.arg.string({ required: false }),
      search: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Check ABAC permission to read entries
      await context.requirePermission('entries', 'read', {
        collectionId: args.collectionId ?? undefined,
      });

      // Build query conditions
      const conditions = [];
      
      if (args.collectionId) {
        conditions.push(eq(entriesTable.collectionId, args.collectionId));
      }
      
      if (args.status) {
        conditions.push(eq(entriesTable.status, args.status as typeof entryStatusEnum.enumValues[number]));
      }
      
      if (args.locale) {
        conditions.push(eq(entriesTable.locale, args.locale as 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'ru'));
      }
      
      if (args.search) {
        conditions.push(
          or(
            like(entriesTable.name, `%${args.search}%`),
            like(entriesTable.slug, `%${args.search}%`)
          )!
        );
      }

      // Execute query
      let queryBuilder = db.select().from(entriesTable);
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const entries = await queryBuilder;

      // Map to expected format
      return entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        collectionId: entry.collectionId,
        status: entry.status,
        slug: entry.slug,
        locale: entry.locale,
        defaultLocale: entry.defaultLocale,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
        createdBy: entry.createdBy,
      }));
    },
  })
);
