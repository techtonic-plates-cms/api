import type { DataType } from '../../.graphql/resolvers-types.js';
import type { AppContext } from '../../index.js';
import { requireAuth } from '../../session/auth.js';
import { requirePermission } from '../../session/permissions/index.js';
import { db } from '../../db/index.js';
import { 
  collectionsTable, 
  fieldsTable
} from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export const collectionQueries = {
  collection: async (_: any, { name }: { name: string }, context: AppContext) => {
    // Require authentication for collection access
    requireAuth(context);
    
    const collections = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.name, name))
      .limit(1);

    if (collections.length === 0) {
      return null;
    }

    const collection = collections[0];
    if (!collection) {
      return null;
    }

    // Check permission to read this specific collection
    await requirePermission(context, 'collections', 'read', {
      collection: { id: collection.id, name: collection.name }
    });

    // Get all fields for this collection
    const fields = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.collectionId, collection.id));

    // Filter fields based on field-level read permissions
    const accessibleFields = [];
    for (const field of fields) {
      try {
        // Check if user can read this specific field
        const hasFieldAccess = await context.abacEvaluator!.hasFieldPermission(
          field.id, 
          'read',
          {
            collection: { id: collection.id, name: collection.name },
            field: { 
              name: field.name, 
              dataType: field.dataType,
              sensitivityLevel: field.sensitivityLevel,
              isPii: field.isPii,
              isPublic: field.isPublic
            }
          }
        );

        if (hasFieldAccess) {
          accessibleFields.push({
            id: field.id,
            name: field.name,
            label: field.label,
            dataType: field.dataType.toUpperCase() as DataType,
            isRequired: field.isRequired,
            isUnique: field.isUnique
          });
        }
      } catch (error) {
        // Field is not accessible, skip it
        console.warn(`Field ${field.name} not accessible to user ${context.session!.user.id}:`, error);
      }
    }

    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      fields: accessibleFields
    };
  }
};