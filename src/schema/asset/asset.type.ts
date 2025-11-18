import { builder } from '../builder.ts';
import { db } from '../../db/index.ts';
import { usersTable } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { User } from '../auth/auth.type.ts';

// ============================================================================
// Asset Type
// ============================================================================

export const AssetType = builder.objectRef<{
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
  alt?: string | null;
  caption?: string | null;
  isPublic?: boolean;
}>('Asset');

AssetType.implement({
  fields: (t) => ({
    id: t.exposeString('id', {nullable: false}),
    filename: t.exposeString('filename', {nullable: false}),
    mimeType: t.exposeString('mimeType'),
    fileSize: t.exposeInt('fileSize'),
    path: t.exposeString('path', {nullable: false}),
    uploadedBy: t.exposeString('uploadedBy', {nullable: false}),
    uploadedAt: t.string({
      resolve: (parent) => parent.uploadedAt.toISOString(),
    }),
    uploadedByUser: t.field({
      type: User,
      nullable: true,
      resolve: async (parent) => {
        const users = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, parent.uploadedBy))
          .limit(1);
        
        if (users.length === 0) return null;
        
        const user = users[0];
        return {
          id: user.id,
          name: user.name,
        };
      },
    }),
    alt: t.exposeString('alt', { nullable: true }),
    caption: t.exposeString('caption', { nullable: true }),
    isPublic: t.exposeBoolean('isPublic', { nullable: true }),
    url: t.string({
      description: 'URL for accessing the asset through the API proxy',
      resolve: (parent) => {
        // Get the base URL from environment or use default
        const baseUrl = Deno.env.get('API_BASE_URL') || 'http://localhost:8000';
        return `${baseUrl}/assets/${parent.id}`;
      },
    }),
  }),
});

// ============================================================================
// Upload Type Definition (for file uploads)
// ============================================================================

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadableStream;
}

// Define Upload scalar
builder.scalarType('Upload', {
  serialize: (): never => {
    throw new Error('Upload serialization unsupported');
  },
  parseValue: (value: unknown) => value as FileUpload,
});

// ============================================================================
// Input Types
// ============================================================================

export const UpdateAssetInput = builder.inputType('UpdateAssetInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    alt: t.string({ required: false }),
    caption: t.string({ required: false }),
    isPublic: t.boolean({ required: false, description: 'Whether the asset is publicly accessible' }),
  }),
});
