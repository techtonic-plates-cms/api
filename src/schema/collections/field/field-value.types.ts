import { builder } from '../../builder.ts';
import { AssetType } from '../../asset/asset.type.ts';
import { db } from '$db/index.ts';
import { assetsTable, entriesTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

// ============================================================================
// Field Value Interface and Types
// ============================================================================

export const FieldValueInterface = builder.interfaceRef<{ fieldId: string }>('FieldValue');
FieldValueInterface.implement({
  fields: (t) => ({
    fieldId: t.exposeString('fieldId'),
  }),
  resolveType: (value) => {
    // Determine the concrete type based on the shape of the value
    if ('text' in value) return 'Text';
    if ('raw' in value && 'rendered' in value && 'format' in value) return 'RichText';
    if ('assetId' in value) return 'AssetFieldValue';
    if ('entryId' in value) return 'RelationFieldValue';
    if ('value' in value) {
      const val = (value as { value: unknown }).value;
      if (typeof val === 'boolean' || val === null) return 'BooleanValue';
      if (typeof val === 'number') return 'NumberValue';
      if (val instanceof Date) return 'DateTimeValue';
      if (typeof val === 'string') return 'JsonValue';
    }
    
    // Default fallback
    return 'JsonValue';
  },
});

export const TextType = builder.objectRef<{ fieldId: string; text: string | null }>('Text');
TextType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    text: t.string({
      nullable: true,
      resolve: (parent) => parent.text,
    }),
  }),
});

export const BooleanValueType = builder.objectRef<{ fieldId: string; value: boolean | null }>('BooleanValue');
BooleanValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    value: t.boolean({
      nullable: true,
      resolve: (parent) => parent.value,
    }),
  }),
});

export const NumberValueType = builder.objectRef<{ fieldId: string; value: number | null }>('NumberValue');
NumberValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    value: t.float({
      nullable: true,
      resolve: (parent) => parent.value,
    }),
  }),
});

export const DateTimeValueType = builder.objectRef<{ fieldId: string; value: Date | null }>('DateTimeValue');
DateTimeValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    value: t.string({
      nullable: true,
      resolve: (parent) => parent.value?.toISOString() ?? null,
    }),
  }),
});

export const RichTextType = builder.objectRef<{ fieldId: string; raw: string; rendered: string; format: string }>('RichText');
RichTextType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    raw: t.string({ resolve: (parent) => parent.raw }),
    rendered: t.string({ resolve: (parent) => parent.rendered }),
    format: t.string({ resolve: (parent) => parent.format }),
  }),
});

export const JsonValueType = builder.objectRef<{ fieldId: string; value: string }>('JsonValue');
JsonValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    value: t.string({
      resolve: (parent) => parent.value,
    }),
  }),
});

export const AssetFieldValueType = builder.objectRef<{ fieldId: string; assetId: string }>('AssetFieldValue');
AssetFieldValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    assetId: t.string({ 
      resolve: (parent) => parent.assetId,
      deprecationReason: 'Use the asset field instead for the full Asset object',
    }),
    asset: t.field({
      type: AssetType,
      nullable: true,
      resolve: async (parent) => {
        const assets = await db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.id, parent.assetId))
          .limit(1);
        
        if (assets.length === 0) return null;
        
        const asset = assets[0];
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
    }),
  }),
});

export const RelationFieldValueType = builder.objectRef<{ fieldId: string; entryId: string }>('RelationFieldValue');
RelationFieldValueType.implement({
  interfaces: [FieldValueInterface],
  fields: (t) => ({
    entryId: t.string({ 
      resolve: (parent) => parent.entryId,
      deprecationReason: 'Use the entry field instead for the full Entry object',
    }),
    entry: t.field({
      type: 'Entry',
      nullable: true,
      resolve: async (parent) => {
        const entries = await db
          .select()
          .from(entriesTable)
          .where(eq(entriesTable.id, parent.entryId))
          .limit(1);
        
        if (entries.length === 0) return null;
        
        const entry = entries[0];
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
    }),
  }),
});
