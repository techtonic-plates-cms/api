import { builder } from '../builder.ts';
import { db } from '../../db/index.ts';
import { assetsTable } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { GraphQLContext } from '../../graphql-context.ts';
import { requireAuth } from '../../graphql-context.ts';
import { AssetType } from './asset.type.ts';

// ============================================================================
// Queries
// ============================================================================

builder.queryField('asset', (t) =>
  t.field({
    type: AssetType,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);

      const [asset] = await db
        .select()
        .from(assetsTable)
        .where(eq(assetsTable.id, args.id))
        .limit(1);

      if (!asset) {
        return null;
      }

      // Check ABAC permission
      await context.requirePermission('assets', 'read', {
        id: asset.id,
        ownerId: asset.uploadedBy,
      });

      return {
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        path: asset.path,
        uploadedBy: asset.uploadedBy,
        uploadedAt: asset.uploadedAt,
        alt: asset.alt,
        caption: asset.caption,
        isPublic: asset.isPublic,
      };
    },
  })
);

builder.queryField('assets', (t) =>
  t.field({
    type: [AssetType],
    args: {
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);

      // Check ABAC permission
      await context.requirePermission('assets', 'read');

      let queryBuilder = db.select().from(assetsTable);

      if (args.limit) {
        queryBuilder = queryBuilder.limit(args.limit) as typeof queryBuilder;
      }

      if (args.offset) {
        queryBuilder = queryBuilder.offset(args.offset) as typeof queryBuilder;
      }

      const assets = await queryBuilder;

      return assets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        path: asset.path,
        uploadedBy: asset.uploadedBy,
        uploadedAt: asset.uploadedAt,
        alt: asset.alt,
        caption: asset.caption,
        isPublic: asset.isPublic,
      }));
    },
  })
);
