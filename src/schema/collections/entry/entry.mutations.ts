import { builder } from '../../builder.ts';
import { db } from '$db/index.ts';
import {
  entriesTable,
  collectionsTable,
  fieldsTable,
  entryTextsTable,
  entryTypstTextsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable,
  entryRichTextsTable,
  entryJsonDataTable,
  entryAssetsTable,
  entryRelationsTable,
  entryStatusEnum,
  localeEnum,
} from '$db/schema.ts';
import { EntryType } from './entry.type.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Enums
// ============================================================================

const EntryStatusEnum = builder.enumType('EntryStatus', {
  values: ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED'] as const,
});

const LocaleEnum = builder.enumType('Locale', {
  values: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'ru'] as const,
});

// ============================================================================
// Input Types
// ============================================================================

// Field value inputs for different data types
const FieldTextValueInput = builder.inputType('FieldTextValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    value: t.string({ required: true }),
  }),
});

const FieldTypstTextValueInput = builder.inputType('FieldTypstTextValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    raw: t.string({ required: true }),
    rendered: t.string({ required: true }),
  }),
});

const FieldBooleanValueInput = builder.inputType('FieldBooleanValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    value: t.boolean({ required: true }),
  }),
});

const FieldNumberValueInput = builder.inputType('FieldNumberValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    value: t.int({ required: true }),
  }),
});

const FieldDateTimeValueInput = builder.inputType('FieldDateTimeValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    value: t.string({ required: true }), // ISO 8601 date string
  }),
});

const FieldRichTextValueInput = builder.inputType('FieldRichTextValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    raw: t.string({ required: true }),
    rendered: t.string({ required: true }),
    format: t.string({ required: false }), // 'markdown', 'html', 'prosemirror'
  }),
});

const FieldJsonValueInput = builder.inputType('FieldJsonValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    value: t.string({ required: true }), // JSON string
    valueType: t.string({ required: true }), // 'object', 'text_list', 'number_list', 'json'
  }),
});

const FieldAssetValueInput = builder.inputType('FieldAssetValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    assetId: t.id({ required: true }),
    sortOrder: t.int({ required: false }),
  }),
});

const FieldRelationValueInput = builder.inputType('FieldRelationValueInput', {
  fields: (t) => ({
    fieldName: t.string({ required: true }),
    entryId: t.id({ required: true }),
  }),
});

const CreateEntryInput = builder.inputType('CreateEntryInput', {
  fields: (t) => ({
    collectionId: t.id({ required: true }),
    name: t.string({ required: true }),
    slug: t.string({ required: false }),
    status: t.field({ type: EntryStatusEnum, required: false }),
    locale: t.field({ type: LocaleEnum, required: false }),
    defaultLocale: t.field({ type: LocaleEnum, required: false }),
    
    // Field values
    textFields: t.field({ type: [FieldTextValueInput], required: false }),
    typstTextFields: t.field({ type: [FieldTypstTextValueInput], required: false }),
    booleanFields: t.field({ type: [FieldBooleanValueInput], required: false }),
    numberFields: t.field({ type: [FieldNumberValueInput], required: false }),
    dateTimeFields: t.field({ type: [FieldDateTimeValueInput], required: false }),
    richTextFields: t.field({ type: [FieldRichTextValueInput], required: false }),
    jsonFields: t.field({ type: [FieldJsonValueInput], required: false }),
    assetFields: t.field({ type: [FieldAssetValueInput], required: false }),
    relationFields: t.field({ type: [FieldRelationValueInput], required: false }),
  }),
});

const UpdateEntryInput = builder.inputType('UpdateEntryInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    status: t.field({ type: EntryStatusEnum, required: false }),
    locale: t.field({ type: LocaleEnum, required: false }),
    defaultLocale: t.field({ type: LocaleEnum, required: false }),
    
    // Field values
    textFields: t.field({ type: [FieldTextValueInput], required: false }),
    typstTextFields: t.field({ type: [FieldTypstTextValueInput], required: false }),
    booleanFields: t.field({ type: [FieldBooleanValueInput], required: false }),
    numberFields: t.field({ type: [FieldNumberValueInput], required: false }),
    dateTimeFields: t.field({ type: [FieldDateTimeValueInput], required: false }),
    richTextFields: t.field({ type: [FieldRichTextValueInput], required: false }),
    jsonFields: t.field({ type: [FieldJsonValueInput], required: false }),
    assetFields: t.field({ type: [FieldAssetValueInput], required: false }),
    relationFields: t.field({ type: [FieldRelationValueInput], required: false }),
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

async function getFieldByName(collectionId: string, fieldName: string) {
  const [field] = await db
    .select()
    .from(fieldsTable)
    .where(
      and(
        eq(fieldsTable.collectionId, collectionId),
        eq(fieldsTable.name, fieldName)
      )
    )
    .limit(1);
  
  return field;
}

async function setFieldValues(
  entryId: string,
  collectionId: string,
  input: {
    textFields?: Array<{ fieldName: string; value: string }> | null;
    typstTextFields?: Array<{ fieldName: string; raw: string; rendered: string }> | null;
    booleanFields?: Array<{ fieldName: string; value: boolean }> | null;
    numberFields?: Array<{ fieldName: string; value: number }> | null;
    dateTimeFields?: Array<{ fieldName: string; value: string }> | null;
    richTextFields?: Array<{ fieldName: string; raw: string; rendered: string; format?: string | null }> | null;
    jsonFields?: Array<{ fieldName: string; value: string; valueType: string }> | null;
    assetFields?: Array<{ fieldName: string; assetId: string; sortOrder?: number | null }> | null;
    relationFields?: Array<{ fieldName: string; entryId: string }> | null;
  }
) {
  // Text fields
  if (input.textFields && input.textFields.length > 0) {
    for (const textField of input.textFields) {
      const field = await getFieldByName(collectionId, textField.fieldName);
      if (!field) {
        throw new Error(`Field '${textField.fieldName}' not found in collection`);
      }
      
      // Delete existing value first
      await db
        .delete(entryTextsTable)
        .where(
          and(
            eq(entryTextsTable.entryId, entryId),
            eq(entryTextsTable.fieldId, field.id)
          )
        );
      
      // Insert new value
      await db.insert(entryTextsTable).values({
        entryId,
        fieldId: field.id,
        value: textField.value,
      });
    }
  }

  // Typst text fields
  if (input.typstTextFields && input.typstTextFields.length > 0) {
    for (const typstField of input.typstTextFields) {
      const field = await getFieldByName(collectionId, typstField.fieldName);
      if (!field) {
        throw new Error(`Field '${typstField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryTypstTextsTable)
        .where(
          and(
            eq(entryTypstTextsTable.entryId, entryId),
            eq(entryTypstTextsTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryTypstTextsTable).values({
        entryId,
        fieldId: field.id,
        raw: typstField.raw,
        rendered: typstField.rendered,
      });
    }
  }

  // Boolean fields
  if (input.booleanFields && input.booleanFields.length > 0) {
    for (const boolField of input.booleanFields) {
      const field = await getFieldByName(collectionId, boolField.fieldName);
      if (!field) {
        throw new Error(`Field '${boolField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryBooleansTable)
        .where(
          and(
            eq(entryBooleansTable.entryId, entryId),
            eq(entryBooleansTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryBooleansTable).values({
        entryId,
        fieldId: field.id,
        value: boolField.value,
      });
    }
  }

  // Number fields
  if (input.numberFields && input.numberFields.length > 0) {
    for (const numField of input.numberFields) {
      const field = await getFieldByName(collectionId, numField.fieldName);
      if (!field) {
        throw new Error(`Field '${numField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryNumbersTable)
        .where(
          and(
            eq(entryNumbersTable.entryId, entryId),
            eq(entryNumbersTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryNumbersTable).values({
        entryId,
        fieldId: field.id,
        value: numField.value,
      });
    }
  }

  // DateTime fields
  if (input.dateTimeFields && input.dateTimeFields.length > 0) {
    for (const dtField of input.dateTimeFields) {
      const field = await getFieldByName(collectionId, dtField.fieldName);
      if (!field) {
        throw new Error(`Field '${dtField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryDateTimesTable)
        .where(
          and(
            eq(entryDateTimesTable.entryId, entryId),
            eq(entryDateTimesTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryDateTimesTable).values({
        entryId,
        fieldId: field.id,
        value: new Date(dtField.value),
      });
    }
  }

  // Rich text fields
  if (input.richTextFields && input.richTextFields.length > 0) {
    for (const richField of input.richTextFields) {
      const field = await getFieldByName(collectionId, richField.fieldName);
      if (!field) {
        throw new Error(`Field '${richField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryRichTextsTable)
        .where(
          and(
            eq(entryRichTextsTable.entryId, entryId),
            eq(entryRichTextsTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryRichTextsTable).values({
        entryId,
        fieldId: field.id,
        raw: richField.raw,
        rendered: richField.rendered,
        format: richField.format ?? 'markdown',
      });
    }
  }

  // JSON fields
  if (input.jsonFields && input.jsonFields.length > 0) {
    for (const jsonField of input.jsonFields) {
      const field = await getFieldByName(collectionId, jsonField.fieldName);
      if (!field) {
        throw new Error(`Field '${jsonField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryJsonDataTable)
        .where(
          and(
            eq(entryJsonDataTable.entryId, entryId),
            eq(entryJsonDataTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryJsonDataTable).values({
        entryId,
        fieldId: field.id,
        value: jsonField.value,
        valueType: jsonField.valueType,
      });
    }
  }

  // Asset fields
  if (input.assetFields && input.assetFields.length > 0) {
    for (const assetField of input.assetFields) {
      const field = await getFieldByName(collectionId, assetField.fieldName);
      if (!field) {
        throw new Error(`Field '${assetField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryAssetsTable)
        .where(
          and(
            eq(entryAssetsTable.entryId, entryId),
            eq(entryAssetsTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryAssetsTable).values({
        entryId,
        fieldId: field.id,
        assetId: assetField.assetId,
        sortOrder: assetField.sortOrder ?? 0,
      });
    }
  }

  // Relation fields
  if (input.relationFields && input.relationFields.length > 0) {
    for (const relField of input.relationFields) {
      const field = await getFieldByName(collectionId, relField.fieldName);
      if (!field) {
        throw new Error(`Field '${relField.fieldName}' not found in collection`);
      }
      
      await db
        .delete(entryRelationsTable)
        .where(
          and(
            eq(entryRelationsTable.fromEntryId, entryId),
            eq(entryRelationsTable.fieldId, field.id)
          )
        );
      
      await db.insert(entryRelationsTable).values({
        fromEntryId: entryId,
        fieldId: field.id,
        toEntryId: relField.entryId,
      });
    }
  }
}

// ============================================================================
// Entry Mutations Type
// ============================================================================

export const EntryMutations = builder.objectRef<Record<PropertyKey, never>>('EntryMutations');

EntryMutations.implement({
  fields: (t) => ({
    create: t.field({
    type: EntryType,
    args: {
      input: t.arg({ type: CreateEntryInput, required: true }),
    },
    resolve: async (_parent, args, context) => {
      const user = requireAuth(context);

      // Verify collection exists
      const [collection] = await db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, args.input.collectionId))
        .limit(1);

      if (!collection) {
        throw new Error(`Collection with id ${args.input.collectionId} not found`);
      }

      // Check ABAC permission to create entries
      await context.requirePermission('entries', 'create', {
        collectionId: args.input.collectionId,
      });

      // Create entry
      const [newEntry] = await db
        .insert(entriesTable)
        .values({
          collectionId: args.input.collectionId,
          name: args.input.name,
          slug: args.input.slug ?? null,
          status: args.input.status ? (args.input.status as typeof entryStatusEnum.enumValues[number]) : 'DRAFT',
          locale: args.input.locale ? (args.input.locale as typeof localeEnum.enumValues[number]) : 'en',
          defaultLocale: args.input.defaultLocale ? (args.input.defaultLocale as typeof localeEnum.enumValues[number]) : 'en',
          createdBy: user.id,
        })
        .returning();

      // Set field values
      await setFieldValues(newEntry.id, args.input.collectionId, args.input);

      return {
        id: newEntry.id,
        name: newEntry.name,
        collectionId: newEntry.collectionId,
        status: newEntry.status,
        slug: newEntry.slug,
        locale: newEntry.locale,
        defaultLocale: newEntry.defaultLocale,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
        publishedAt: newEntry.publishedAt,
        createdBy: newEntry.createdBy,
      };
    },
  }),
    update: t.field({
    type: EntryType,
    args: {
      input: t.arg({ type: UpdateEntryInput, required: true }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Fetch existing entry
      const [existingEntry] = await db
        .select()
        .from(entriesTable)
        .where(eq(entriesTable.id, args.input.id))
        .limit(1);

      if (!existingEntry) {
        throw new Error(`Entry with id ${args.input.id} not found`);
      }

      // Check ABAC permission to update this entry
      await context.requirePermission('entries', 'update', {
        id: existingEntry.id,
        ownerId: existingEntry.createdBy,
        collectionId: existingEntry.collectionId,
        status: existingEntry.status,
      });

      // Build update values
      const updateValues: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (args.input.name !== undefined) updateValues.name = args.input.name;
      if (args.input.slug !== undefined) updateValues.slug = args.input.slug;
      if (args.input.status !== undefined) {
        updateValues.status = args.input.status as typeof entryStatusEnum.enumValues[number];
        
        // If publishing, set publishedAt timestamp
        if (args.input.status === 'PUBLISHED' && !existingEntry.publishedAt) {
          updateValues.publishedAt = new Date();
        }
      }
      if (args.input.locale !== undefined) {
        updateValues.locale = args.input.locale as typeof localeEnum.enumValues[number];
      }
      if (args.input.defaultLocale !== undefined) {
        updateValues.defaultLocale = args.input.defaultLocale as typeof localeEnum.enumValues[number];
      }

      // Update entry
      const [updatedEntry] = await db
        .update(entriesTable)
        .set(updateValues)
        .where(eq(entriesTable.id, args.input.id))
        .returning();

      // Update field values if provided
      await setFieldValues(existingEntry.id, existingEntry.collectionId, args.input);

      return {
        id: updatedEntry.id,
        name: updatedEntry.name,
        collectionId: updatedEntry.collectionId,
        status: updatedEntry.status,
        slug: updatedEntry.slug,
        locale: updatedEntry.locale,
        defaultLocale: updatedEntry.defaultLocale,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        publishedAt: updatedEntry.publishedAt,
        createdBy: updatedEntry.createdBy,
      };
    },
  }),
    delete: t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, context) => {
      requireAuth(context);

      // Fetch entry to check permissions
      const [entry] = await db
        .select()
        .from(entriesTable)
        .where(eq(entriesTable.id, args.id))
        .limit(1);

      if (!entry) {
        throw new Error(`Entry with id ${args.id} not found`);
      }

      // Check ABAC permission to delete this entry
      await context.requirePermission('entries', 'delete', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      // Delete entry (cascade will handle field values)
      await db.delete(entriesTable).where(eq(entriesTable.id, args.id));

      return true;
    },
  }),
    publish: t.field({
    type: EntryType,
    args: {
      id: t.arg.id({ required: true }),
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
        throw new Error(`Entry with id ${args.id} not found`);
      }

      // Check ABAC permission to publish
      await context.requirePermission('entries', 'publish', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      // Update status to PUBLISHED and set publishedAt
      const [updatedEntry] = await db
        .update(entriesTable)
        .set({
          status: 'PUBLISHED',
          publishedAt: entry.publishedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(entriesTable.id, args.id))
        .returning();

      return {
        id: updatedEntry.id,
        name: updatedEntry.name,
        collectionId: updatedEntry.collectionId,
        status: updatedEntry.status,
        slug: updatedEntry.slug,
        locale: updatedEntry.locale,
        defaultLocale: updatedEntry.defaultLocale,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        publishedAt: updatedEntry.publishedAt,
        createdBy: updatedEntry.createdBy,
      };
    },
  }),
    unpublish: t.field({
    type: EntryType,
    args: {
      id: t.arg.id({ required: true }),
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
        throw new Error(`Entry with id ${args.id} not found`);
      }

      // Check ABAC permission to unpublish
      await context.requirePermission('entries', 'unpublish', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      // Update status to DRAFT
      const [updatedEntry] = await db
        .update(entriesTable)
        .set({
          status: 'DRAFT',
          updatedAt: new Date(),
        })
        .where(eq(entriesTable.id, args.id))
        .returning();

      return {
        id: updatedEntry.id,
        name: updatedEntry.name,
        collectionId: updatedEntry.collectionId,
        status: updatedEntry.status,
        slug: updatedEntry.slug,
        locale: updatedEntry.locale,
        defaultLocale: updatedEntry.defaultLocale,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        publishedAt: updatedEntry.publishedAt,
        createdBy: updatedEntry.createdBy,
      };
    },
  }),
    archive: t.field({
    type: EntryType,
    args: {
      id: t.arg.id({ required: true }),
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
        throw new Error(`Entry with id ${args.id} not found`);
      }

      // Check ABAC permission to archive
      await context.requirePermission('entries', 'archive', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      // Update status to ARCHIVED
      const [updatedEntry] = await db
        .update(entriesTable)
        .set({
          status: 'ARCHIVED',
          updatedAt: new Date(),
        })
        .where(eq(entriesTable.id, args.id))
        .returning();

      return {
        id: updatedEntry.id,
        name: updatedEntry.name,
        collectionId: updatedEntry.collectionId,
        status: updatedEntry.status,
        slug: updatedEntry.slug,
        locale: updatedEntry.locale,
        defaultLocale: updatedEntry.defaultLocale,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        publishedAt: updatedEntry.publishedAt,
        createdBy: updatedEntry.createdBy,
      };
    },
  }),
    restore: t.field({
    type: EntryType,
    args: {
      id: t.arg.id({ required: true }),
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
        throw new Error(`Entry with id ${args.id} not found`);
      }

      // Check ABAC permission to restore
      await context.requirePermission('entries', 'restore', {
        id: entry.id,
        ownerId: entry.createdBy,
        collectionId: entry.collectionId,
        status: entry.status,
      });

      // Update status to DRAFT (restored from archived/deleted)
      const [updatedEntry] = await db
        .update(entriesTable)
        .set({
          status: 'DRAFT',
          updatedAt: new Date(),
        })
        .where(eq(entriesTable.id, args.id))
        .returning();

      return {
        id: updatedEntry.id,
        name: updatedEntry.name,
        collectionId: updatedEntry.collectionId,
        status: updatedEntry.status,
        slug: updatedEntry.slug,
        locale: updatedEntry.locale,
        defaultLocale: updatedEntry.defaultLocale,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        publishedAt: updatedEntry.publishedAt,
        createdBy: updatedEntry.createdBy,
      };
    },
  }),
  }),
});

// ============================================================================
// Wire up EntryMutations to root Mutation type
// ============================================================================

builder.mutationField('entries', (t) =>
  t.field({
    type: EntryMutations,
    resolve: () => ({}),
  })
);
