import type { AppContext } from '#/index';
import type { MutationResolvers } from '$graphql/resolvers-types';
import { 
  requireAuth,
} from '#/session/';
import {
  requirePermission,
} from "#/session/permissions"
import { db } from '$db/index';
import { 
  entriesTable, 
  fieldsTable,
  collectionsTable,
  entryTextsTable,
  entryTypstTextsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable,
  entryRichTextsTable,
  entryJsonDataTable,
  entryAssetsTable,
  entryRelationsTable
} from '$db/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to decode JSON values based on DataType
function decodeFieldValue(dataType: string, jsonValue: any): any {
  try {
    switch (dataType.toLowerCase()) {
      case 'text':
        return typeof jsonValue === 'string' ? jsonValue : String(jsonValue);
        
      case 'typst_text':
        if (typeof jsonValue === 'object' && jsonValue.raw && jsonValue.rendered) {
          return { raw: String(jsonValue.raw), rendered: String(jsonValue.rendered) };
        }
        throw new Error('TypstText value must be an object with "raw" and "rendered" properties');
        
      case 'boolean':
        return Boolean(jsonValue);
        
      case 'number':
        const num = Number(jsonValue);
        if (isNaN(num)) throw new Error('Invalid number value');
        return Math.floor(num); // Ensure integer
        
      case 'date_time':
        return new Date(jsonValue);
        
      case 'relation':
        return typeof jsonValue === 'string' ? jsonValue : String(jsonValue);
        
      case 'asset':
        return typeof jsonValue === 'string' ? jsonValue : String(jsonValue);
        
      case 'rich_text':
        if (typeof jsonValue === 'object' && jsonValue.raw && jsonValue.rendered) {
          return { 
            raw: String(jsonValue.raw), 
            rendered: String(jsonValue.rendered),
            format: jsonValue.format || 'markdown'
          };
        }
        throw new Error('RichText value must be an object with "raw" and "rendered" properties');
        
      case 'object':
      case 'text_list':
      case 'number_list':
      case 'json':
        return JSON.stringify(jsonValue);
        
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  } catch (error) {
    throw new Error(`Failed to decode value for ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to insert field value into appropriate table
async function insertFieldValue(entryId: string, fieldId: string, dataType: string, decodedValue: any) {
  switch (dataType.toLowerCase()) {
    case 'text':
      await db.insert(entryTextsTable).values({
        entryId,
        fieldId,
        value: decodedValue
      });
      break;
      
    case 'typst_text':
      await db.insert(entryTypstTextsTable).values({
        entryId,
        fieldId,
        raw: decodedValue.raw,
        rendered: decodedValue.rendered
      });
      break;
      
    case 'boolean':
      await db.insert(entryBooleansTable).values({
        entryId,
        fieldId,
        value: decodedValue
      });
      break;
      
    case 'number':
      await db.insert(entryNumbersTable).values({
        entryId,
        fieldId,
        value: decodedValue
      });
      break;
      
    case 'date_time':
      await db.insert(entryDateTimesTable).values({
        entryId,
        fieldId,
        value: decodedValue
      });
      break;
      
    case 'relation':
      await db.insert(entryRelationsTable).values({
        fromEntryId: entryId,
        fieldId,
        toEntryId: decodedValue
      });
      break;
      
    case 'asset':
      await db.insert(entryAssetsTable).values({
        entryId,
        fieldId,
        assetId: decodedValue
      });
      break;
      
    case 'rich_text':
      await db.insert(entryRichTextsTable).values({
        entryId,
        fieldId,
        raw: decodedValue.raw,
        rendered: decodedValue.rendered,
        format: decodedValue.format
      });
      break;
      
    case 'text_list':
    case 'number_list':  
    case 'json':
      await db.insert(entryJsonDataTable).values({
        entryId,
        fieldId,
        value: decodedValue,
        valueType: dataType
      });
      break;
      
    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
}

export const entryMutations: Pick<MutationResolvers, 'createEntry'> = {
  async createEntry(_parent, { input }, context) {
    // Require authentication and permission to create entries
    requireAuth(context);
    requirePermission(context, 'entries', 'create');
    const userId = context.session!.user.id;

    try {
      // First, verify the collection exists and get its fields
      const [collection] = await db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, input.collectionId));

      if (!collection) {
        throw new Error('Collection not found');
      }

      // Get the collection's fields
      const collectionFields = await db
        .select()
        .from(fieldsTable)
        .where(eq(fieldsTable.collectionId, input.collectionId));

      // Create a map of field names to field definitions for easier lookup
      const fieldMap = new Map(collectionFields.map(field => [field.name, field]));

      // Validate required fields
      const providedFieldNames = new Set(input.fields.map(f => f.field));
      const requiredFields = collectionFields.filter(field => field.isRequired);
      
      for (const requiredField of requiredFields) {
        if (!providedFieldNames.has(requiredField.name)) {
          throw new Error(`Required field "${requiredField.name}" is missing`);
        }
      }

      // Validate that all provided fields exist in the collection schema
      for (const fieldInput of input.fields) {
        if (!fieldMap.has(fieldInput.field)) {
          throw new Error(`Field "${fieldInput.field}" does not exist in collection schema`);
        }
      }

      // Create the entry first
      const [entry] = await db.insert(entriesTable).values({
        createdBy: userId,
        collectionId: input.collectionId,
        name: input.name,
        slug: input.slug || null,
        status: (input.status as any) || 'DRAFT',
        locale: (input.locale as any) || 'en',
        defaultLocale: (input.defaultLocale as any) || 'en',
      }).returning();

      if (!entry) {
        throw new Error('Failed to create entry');
      }

      // Process and insert field values
      for (const fieldInput of input.fields) {
        const field = fieldMap.get(fieldInput.field)!;
        
        try {
          // Decode the JSON value based on the field's data type
          const decodedValue = decodeFieldValue(field.dataType, fieldInput.value);
          
          // Insert the value into the appropriate table
          await insertFieldValue(entry.id, field.id, field.dataType, decodedValue);
        } catch (error) {
          // Clean up the entry if field processing fails
          await db.delete(entriesTable).where(eq(entriesTable.id, entry.id));
          throw new Error(`Error processing field "${fieldInput.field}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Return the created entry
      return {
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error; // Re-throw to preserve the specific error message
    }
  }
};