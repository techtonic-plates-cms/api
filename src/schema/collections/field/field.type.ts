import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { fieldsTable, collectionsTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

// ============================================================================
// Field Type
// ============================================================================

export const FieldType = builder.objectRef<{
  id: string;
  name: string;
  label: string | null;
  dataType: string;
  collectionId: string;
}>('Field');

FieldType.implement({
  fields: (t) => ({
    id: t.exposeID('id', {nullable: false}),
    name: t.exposeString('name', {nullable: false}),
    label: t.string({ nullable: true, resolve: (parent) => parent.label }),
    dataType: t.exposeString('dataType', {nullable: false}),
    collectionId: t.exposeID('collectionId', {nullable: false}),
    collection: t.field({
      type: 'Collection',
      nullable: true,
      resolve: async (parent) => {
        const collections = await db
          .select()
          .from(collectionsTable)
          .where(eq(collectionsTable.id, parent.collectionId))
          .limit(1);
        
        if (collections.length === 0) return null;
        
        const collection = collections[0];
        return {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          createdBy: collection.createdBy,
        };
      },
    }),
    
    // Sensitive field metadata - requires field-level read permission
    description: t.string({
      nullable: true,
      resolve: async (parent, _args, context) => {
        // Re-fetch full field data to get sensitive properties
        const [field] = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.id, parent.id))
          .limit(1);
        
        if (!field) return null;
        
        // Check permission to read field metadata
        const canReadMetadata = await context.checkPermission('fields', 'read', {
          id: field.id,
          sensitivityLevel: field.sensitivityLevel,
          isPii: field.isPii,
          isPublic: field.isPublic,
          collectionId: field.collectionId,
        });
        
        return canReadMetadata ? field.description : null;
      },
    }),
    
    isRequired: t.boolean({
      resolve: async (parent, _args, context) => {
        const [field] = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.id, parent.id))
          .limit(1);
        
        if (!field) return false;
        
        const canReadMetadata = await context.checkPermission('fields', 'read', {
          id: field.id,
          sensitivityLevel: field.sensitivityLevel,
          isPii: field.isPii,
          isPublic: field.isPublic,
          collectionId: field.collectionId,
        });
        
        return canReadMetadata ? field.isRequired : false;
      },
    }),
    
    isUnique: t.boolean({
      resolve: async (parent, _args, context) => {
        const [field] = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.id, parent.id))
          .limit(1);
        
        if (!field) return false;
        
        const canReadMetadata = await context.checkPermission('fields', 'read', {
          id: field.id,
          sensitivityLevel: field.sensitivityLevel,
          isPii: field.isPii,
          isPublic: field.isPublic,
          collectionId: field.collectionId,
        });
        
        return canReadMetadata ? field.isUnique : false;
      },
    }),
    
    // Only expose PII/sensitivity flags to users with appropriate permissions
    isPii: t.boolean({
      nullable: true,
      resolve: async (parent, _args, context) => {
        const [field] = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.id, parent.id))
          .limit(1);
        
        if (!field) return null;
        
        // Only users who can configure fields should see PII flags
        const canConfigureFields = await context.checkPermission('fields', 'configure_fields', {
          id: field.id,
          collectionId: field.collectionId,
        });
        
        return canConfigureFields ? field.isPii : null;
      },
    }),
    
    sensitivityLevel: t.string({
      nullable: true,
      resolve: async (parent, _args, context) => {
        const [field] = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.id, parent.id))
          .limit(1);
        
        if (!field) return null;
        
        // Only users who can configure fields should see sensitivity levels
        const canConfigureFields = await context.checkPermission('fields', 'configure_fields', {
          id: field.id,
          collectionId: field.collectionId,
        });
        
        return canConfigureFields ? field.sensitivityLevel : null;
      },
    }),
  }),
});
