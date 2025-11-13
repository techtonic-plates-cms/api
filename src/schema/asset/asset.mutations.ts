import { builder } from '../builder.ts';
import { db } from '../../db/index.ts';
import { assetsTable } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { GraphQLContext } from '../../graphql-context.ts';
import { requireAuth } from '../../graphql-context.ts';
import {
  uploadToS3,
  deleteFromS3,
  generateS3Key,
  getContentType,
} from '../../s3.ts';
import { AssetType, UpdateAssetInput, type FileUpload } from './asset.type.ts';

// ============================================================================
// Asset Mutations Type
// ============================================================================

export const AssetMutations = builder.objectRef<Record<PropertyKey, never>>('AssetMutations');

AssetMutations.implement({
  fields: (t) => ({
    upload: t.field({
      type: AssetType,
      args: {
        file: t.arg({ type: 'Upload', required: true }),
        alt: t.arg.string({ required: false }),
        caption: t.arg.string({ required: false }),
        isPublic: t.arg.boolean({ required: false, description: 'Whether the asset is publicly accessible' }),
      },
      resolve: async (_parent, args, context: GraphQLContext) => {
        const user = requireAuth(context);

        // Check ABAC permission to upload assets
        await context.requirePermission('assets', 'upload');

        // Extract file info from the upload
        const file = args.file as unknown as FileUpload;

        // Validate file object
        if (!file || typeof file !== 'object') {
          throw new Error('Invalid file upload');
        }

        // GraphQL Yoga provides a File object, not the expected structure
        // Need to handle both File API and the custom FileUpload interface
        let filename: string;
        let mimetype: string;
        let fileData: Uint8Array;
        let totalSize: number;

        if ('name' in file && file instanceof File) {
          // Standard File API object from GraphQL Yoga
          filename = (file as File).name;
          mimetype = (file as File).type;
          const arrayBuffer = await (file as File).arrayBuffer();
          fileData = new Uint8Array(arrayBuffer);
          totalSize = fileData.length;
        } else if ('filename' in file && 'createReadStream' in file) {
          // Custom FileUpload interface
          filename = file.filename;
          mimetype = file.mimetype;

          // Read file stream and convert to Uint8Array
          const stream = file.createReadStream();
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];
          
          totalSize = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalSize += value.length;
          }

          // Combine chunks
          fileData = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of chunks) {
            fileData.set(chunk, offset);
            offset += chunk.length;
          }
        } else {
          throw new Error('Unsupported file upload format');
        }

        // Generate S3 key
        const s3Key = generateS3Key(filename, user.id);

        // Determine content type
        const contentType = getContentType(filename) || mimetype;

        // Upload to S3
        await uploadToS3({
          key: s3Key,
          body: fileData,
          contentType,
          metadata: {
            originalFilename: filename,
            uploadedBy: user.id,
          },
        });

        // Store asset metadata in database
        const [newAsset] = await db
          .insert(assetsTable)
          .values({
            filename: filename,
            mimeType: contentType,
            fileSize: totalSize,
            path: s3Key,
            uploadedBy: user.id,
            alt: args.alt ?? null,
            caption: args.caption ?? null,
            isPublic: args.isPublic ?? false,
          })
          .returning();

        return {
          id: newAsset.id,
          filename: newAsset.filename,
          mimeType: newAsset.mimeType,
          fileSize: newAsset.fileSize,
          path: newAsset.path,
          uploadedBy: newAsset.uploadedBy,
          uploadedAt: newAsset.uploadedAt,
          alt: newAsset.alt,
          caption: newAsset.caption,
          isPublic: newAsset.isPublic,
        };
      },
    }),
    update: t.field({
      type: AssetType,
      args: {
        input: t.arg({ type: UpdateAssetInput, required: true }),
      },
      resolve: async (_parent, args, context: GraphQLContext) => {
        requireAuth(context);

        // Fetch existing asset
        const [existingAsset] = await db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.id, args.input.id))
          .limit(1);

        if (!existingAsset) {
          throw new Error(`Asset with id ${args.input.id} not found`);
        }

        // Check ABAC permission
        await context.requirePermission('assets', 'update', {
          id: existingAsset.id,
          ownerId: existingAsset.uploadedBy,
        });

        // Update asset metadata
        const updateValues: Record<string, unknown> = {};
        
        if (args.input.alt !== undefined) updateValues.alt = args.input.alt;
        if (args.input.caption !== undefined) updateValues.caption = args.input.caption;
        if (args.input.isPublic !== undefined) updateValues.isPublic = args.input.isPublic;

        const [updatedAsset] = await db
          .update(assetsTable)
          .set(updateValues)
          .where(eq(assetsTable.id, args.input.id))
          .returning();

        return {
          id: updatedAsset.id,
          filename: updatedAsset.filename,
          mimeType: updatedAsset.mimeType,
          fileSize: updatedAsset.fileSize,
          path: updatedAsset.path,
          uploadedBy: updatedAsset.uploadedBy,
          uploadedAt: updatedAsset.uploadedAt,
          alt: updatedAsset.alt,
          caption: updatedAsset.caption,
          isPublic: updatedAsset.isPublic,
        };
      },
    }),
    delete: t.field({
      type: 'Boolean',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, context: GraphQLContext) => {
        requireAuth(context);

        // Fetch asset
        const [asset] = await db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.id, args.id))
          .limit(1);

        if (!asset) {
          throw new Error(`Asset with id ${args.id} not found`);
        }

        // Check ABAC permission
        await context.requirePermission('assets', 'delete', {
          id: asset.id,
          ownerId: asset.uploadedBy,
        });

        // Delete from S3
        try {
          await deleteFromS3({ key: asset.path });
        } catch (error) {
          console.error('Failed to delete asset from S3:', error);
          // Continue with database deletion even if S3 deletion fails
        }

        // Delete from database
        await db.delete(assetsTable).where(eq(assetsTable.id, args.id));

        return true;
      },
    }),
  }),
});

// ============================================================================
// Wire up AssetMutations to root Mutation type
// ============================================================================

builder.mutationField('assets', (t) =>
  t.field({
    type: AssetMutations,
    resolve: () => ({}),
  })
);
