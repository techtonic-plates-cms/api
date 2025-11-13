import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { collectionsTable, fieldsTable, dataTypesEnum } from '../../../db/schema.ts';
import { CollectionType } from './collection.type.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Enums
// ============================================================================

const DataTypeEnum = builder.enumType('DataType', {
  values: [
    'text',
    'typst_text',
    'boolean',
    'number',
    'date_time',
    'relation',
    'text_list',
    'number_list',
    'asset',
    'rich_text',
    'json',
  ] as const,
});

// ============================================================================
// Input Types
// ============================================================================

const CreateFieldInput = builder.inputType('CreateFieldInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    label: t.string({ required: false }),
    description: t.string({ required: false }),
    dataType: t.field({ type: DataTypeEnum, required: true }),
    isRequired: t.boolean({ required: false }),
    isUnique: t.boolean({ required: false }),
    isPublic: t.boolean({ required: false }),
    isPii: t.boolean({ required: false }),
    isEncrypted: t.boolean({ required: false }),
    sensitivityLevel: t.string({ required: false }), // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    validationRules: t.string({ required: false }), // JSON schema for validation
    defaultValue: t.string({ required: false }), // Default value as JSON
    helpText: t.string({ required: false }),
  }),
});

const CreateCollectionInput = builder.inputType('CreateCollectionInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    icon: t.string({ required: false }),
    color: t.string({ required: false }),
    defaultLocale: t.string({ required: false }),
    supportedLocales: t.stringList({ required: false }),
    isLocalized: t.boolean({ required: false }),
    fields: t.field({
      type: [CreateFieldInput],
      required: false,
    }),
  }),
});

const UpdateFieldInput = builder.inputType('UpdateFieldInput', {
  fields: (t) => ({
    id: t.string({ required: false }), // If provided, update existing field; otherwise create new
    name: t.string({ required: true }),
    label: t.string({ required: false }),
    description: t.string({ required: false }),
    dataType: t.field({ type: DataTypeEnum, required: true }),
    isRequired: t.boolean({ required: false }),
    isUnique: t.boolean({ required: false }),
    isPublic: t.boolean({ required: false }),
    isPii: t.boolean({ required: false }),
    isEncrypted: t.boolean({ required: false }),
    sensitivityLevel: t.string({ required: false }),
    validationRules: t.string({ required: false }),
    defaultValue: t.string({ required: false }),
    helpText: t.string({ required: false }),
  }),
});

const UpdateCollectionInput = builder.inputType('UpdateCollectionInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    description: t.string({ required: false }),
    icon: t.string({ required: false }),
    color: t.string({ required: false }),
    defaultLocale: t.string({ required: false }),
    supportedLocales: t.stringList({ required: false }),
    isLocalized: t.boolean({ required: false }),
    fields: t.field({
      type: [UpdateFieldInput],
      required: false,
    }),
    deleteFieldIds: t.stringList({ required: false }), // IDs of fields to delete
  }),
});

// ============================================================================
// Collection Mutations Type
// ============================================================================

export const CollectionMutations = builder.objectRef<Record<PropertyKey, never>>('CollectionMutations');

CollectionMutations.implement({
  fields: (t) => ({
    create: t.field({
      type: CollectionType,
      args: {
        input: t.arg({ type: CreateCollectionInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        // Require authentication
        const user = requireAuth(context);
        
        // Check ABAC permission to create collections
        await context.requirePermission('collections', 'create');

        // If creating fields, also check permission to configure fields
        if (args.input.fields && args.input.fields.length > 0) {
          await context.requirePermission('fields', 'configure_fields');
        }

        // Insert collection and fields in a transaction
        const [newCollection] = await db
          .insert(collectionsTable)
          .values({
            name: args.input.name,
            slug: args.input.slug,
            description: args.input.description ?? null,
            icon: args.input.icon ?? null,
            color: args.input.color ?? null,
            defaultLocale: args.input.defaultLocale 
              ? (args.input.defaultLocale as 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'ru') 
              : 'en',
            supportedLocales: args.input.supportedLocales ?? ['en'],
            isLocalized: args.input.isLocalized ?? false,
            createdBy: user.id,
          })
          .returning();

        // Insert fields if provided
        if (args.input.fields && args.input.fields.length > 0) {
          await db.insert(fieldsTable).values(
            args.input.fields.map((field) => ({
              collectionId: newCollection.id,
              name: field.name,
              label: field.label ?? null,
              description: field.description ?? null,
              dataType: field.dataType as typeof dataTypesEnum.enumValues[number],
              isRequired: field.isRequired ?? false,
              isUnique: field.isUnique ?? false,
              isPublic: field.isPublic ?? true,
              isPii: field.isPii ?? false,
              isEncrypted: field.isEncrypted ?? false,
              sensitivityLevel: field.sensitivityLevel ?? 'PUBLIC',
              validationRules: field.validationRules ?? null,
              defaultValue: field.defaultValue ?? null,
              helpText: field.helpText ?? null,
              createdBy: user.id,
            }))
          );
        }

        return {
          id: newCollection.id,
          name: newCollection.name,
          slug: newCollection.slug,
          description: newCollection.description,
        };
      },
    }),
    update: t.field({
      type: CollectionType,
      args: {
        input: t.arg({ type: UpdateCollectionInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        // Require authentication
        const user = requireAuth(context);

        // First, fetch the existing collection to get its details for permission check
        const [existingCollection] = await db
          .select()
          .from(collectionsTable)
          .where(eq(collectionsTable.id, args.input.id))
          .limit(1);

        if (!existingCollection) {
          throw new Error(`Collection with id ${args.input.id} not found`);
        }

        // Check ABAC permission to update this specific collection
        await context.requirePermission('collections', 'update', {
          id: existingCollection.id,
          slug: existingCollection.slug,
          ownerId: existingCollection.createdBy,
        });

        // If modifying fields, also check permission to configure fields
        if (args.input.fields || args.input.deleteFieldIds) {
          await context.requirePermission('fields', 'configure_fields', {
            collectionId: args.input.id,
          });
        }

        // Build update values for collection (only include provided fields)
        const collectionUpdateValues: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (args.input.name !== undefined) collectionUpdateValues.name = args.input.name;
        if (args.input.slug !== undefined) collectionUpdateValues.slug = args.input.slug;
        if (args.input.description !== undefined) collectionUpdateValues.description = args.input.description;
        if (args.input.icon !== undefined) collectionUpdateValues.icon = args.input.icon;
        if (args.input.color !== undefined) collectionUpdateValues.color = args.input.color;
        if (args.input.isLocalized !== undefined) collectionUpdateValues.isLocalized = args.input.isLocalized;
        
        if (args.input.defaultLocale !== undefined) {
          collectionUpdateValues.defaultLocale = args.input.defaultLocale as 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'ru';
        }
        
        if (args.input.supportedLocales !== undefined) {
          collectionUpdateValues.supportedLocales = args.input.supportedLocales;
        }

        // Update collection
        const [updatedCollection] = await db
          .update(collectionsTable)
          .set(collectionUpdateValues)
          .where(eq(collectionsTable.id, args.input.id))
          .returning();

        if (!updatedCollection) {
          throw new Error(`Collection with id ${args.input.id} not found`);
        }

        // Delete fields if requested
        if (args.input.deleteFieldIds && args.input.deleteFieldIds.length > 0) {
          for (const fieldId of args.input.deleteFieldIds) {
            await db
              .delete(fieldsTable)
              .where(
                and(
                  eq(fieldsTable.id, fieldId),
                  eq(fieldsTable.collectionId, args.input.id)
                )
              );
          }
        }

        // Update or create fields if provided
        if (args.input.fields && args.input.fields.length > 0) {
          for (const field of args.input.fields) {
            const fieldData = {
              name: field.name,
              label: field.label ?? null,
              description: field.description ?? null,
              dataType: field.dataType as typeof dataTypesEnum.enumValues[number],
              isRequired: field.isRequired ?? false,
              isUnique: field.isUnique ?? false,
              isPublic: field.isPublic ?? true,
              isPii: field.isPii ?? false,
              isEncrypted: field.isEncrypted ?? false,
              sensitivityLevel: field.sensitivityLevel ?? 'PUBLIC',
              validationRules: field.validationRules ?? null,
              defaultValue: field.defaultValue ?? null,
              helpText: field.helpText ?? null,
              updatedAt: new Date(),
            };

            if (field.id) {
              // Update existing field
              await db
                .update(fieldsTable)
                .set(fieldData)
                .where(
                  and(
                    eq(fieldsTable.id, field.id),
                    eq(fieldsTable.collectionId, args.input.id)
                  )
                );
            } else {
              // Create new field
              await db.insert(fieldsTable).values({
                ...fieldData,
                collectionId: updatedCollection.id,
                createdBy: user.id,
              });
            }
          }
        }

        return {
          id: updatedCollection.id,
          name: updatedCollection.name,
          slug: updatedCollection.slug,
          description: updatedCollection.description,
        };
      },
    }),
    delete: t.field({
      type: 'Boolean',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);

        // Fetch collection to check permissions
        const [collection] = await db
          .select()
          .from(collectionsTable)
          .where(eq(collectionsTable.id, args.id))
          .limit(1);

        if (!collection) {
          throw new Error(`Collection with id ${args.id} not found`);
        }

        // Check ABAC permission to delete this collection
        await context.requirePermission('collections', 'delete', {
          id: collection.id,
          slug: collection.slug,
          ownerId: collection.createdBy,
        });

        // Delete collection (cascade will handle fields and entries)
        await db.delete(collectionsTable).where(eq(collectionsTable.id, args.id));

        return true;
      },
    }),
  }),
});

// ============================================================================
// Wire up CollectionMutations to root Mutation type
// ============================================================================

builder.mutationField('collections', (t) =>
  t.field({
    type: CollectionMutations,
    resolve: () => ({}),
  })
);
