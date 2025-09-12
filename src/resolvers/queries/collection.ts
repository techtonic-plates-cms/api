import type { DataType } from '../../.graphql/resolvers-types.js';
import type { AppContext } from '../../index.js';
import { db } from '../../db/index.js';
import { 
  collectionsTable, 
  fieldsTable
} from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export const collectionQueries = {
  collection: async (_: any, { name }: { name: string }) => {
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

    // Get all fields for this collection
    const fields = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.collectionId, collection.id));

    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      fields: fields.map(field => ({
        id: field.id,
        name: field.name,
        label: field.label,
        dataType: field.dataType.toUpperCase() as DataType,
        isRequired: field.isRequired,
        isUnique: field.isUnique
      }))
    };
  }
};