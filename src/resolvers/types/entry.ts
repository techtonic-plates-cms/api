import type { FieldFilter } from '../../.graphql/resolvers-types.js';
import { db } from '../../db/index.js';
import { 
  fieldsTable, 
  entriesTable
} from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getFieldValueForEntry } from '../utils/field-utils.js';

export const entryTypeResolvers = {
  Entry: {
    field: async (parent: any, { name, filter }: { name: string; filter?: FieldFilter }) => {
      // Find the field by name within the collection
      const field = await db
        .select()
        .from(fieldsTable)
        .innerJoin(entriesTable, eq(entriesTable.id, parent.id))
        .where(and(
          eq(fieldsTable.collectionId, entriesTable.collectionId),
          eq(fieldsTable.name, name)
        ))
        .limit(1);

      if (field.length === 0) {
        return null;
      }

      const fieldData = field[0]?.fields;
      if (!fieldData) {
        return null;
      }

      // Pass the filter to getFieldValueForEntry so it can be applied
      return getFieldValueForEntry(parent.id, fieldData.id, fieldData.dataType, filter);
    }
  }
};