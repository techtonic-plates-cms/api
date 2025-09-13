import type { AppContext } from '#/index';
import type { MutationResolvers } from '$graphql/resolvers-types';
import { 
  requireAuth,
} from '#/session/';
import {
  requirePermission,
  requireFieldPermission,
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

// Helper function to extract and validate typed field values
function extractFieldValue(dataType: string, valueInput: any): any {
  try {
    switch (dataType.toLowerCase()) {
      case 'text':
        if (!valueInput.text) throw new Error('TEXT field requires text input');
        return valueInput.text.value;
        
      case 'typst_text':
        if (!valueInput.typstText) throw new Error('TYPST_TEXT field requires typstText input');
        return {
          raw: valueInput.typstText.raw,
          rendered: valueInput.typstText.rendered
        };
        
      case 'boolean':
        if (!valueInput.boolean) throw new Error('BOOLEAN field requires boolean input');
        return valueInput.boolean.value;
        
      case 'number':
        if (!valueInput.number) throw new Error('NUMBER field requires number input');
        return valueInput.number.value;
        
      case 'date_time':
        if (!valueInput.dateTime) throw new Error('DATE_TIME field requires dateTime input');
        return new Date(valueInput.dateTime.value);
        
      case 'relation':
        if (!valueInput.relation) throw new Error('RELATION field requires relation input');
        return valueInput.relation.entryId;
        
      case 'asset':
        if (!valueInput.asset) throw new Error('ASSET field requires asset input');
        return valueInput.asset.assetId;
        
      case 'rich_text':
        if (!valueInput.richText) throw new Error('RICH_TEXT field requires richText input');
        return {
          raw: valueInput.richText.raw,
          rendered: valueInput.richText.rendered,
          format: valueInput.richText.format || 'markdown'
        };
        
      case 'object':
        if (!valueInput.object) throw new Error('OBJECT field requires object input');
        return JSON.stringify(valueInput.object.value);
        
      case 'text_list':
        if (!valueInput.textList) throw new Error('TEXT_LIST field requires textList input');
        return JSON.stringify(valueInput.textList.value);
        
      case 'number_list':
        if (!valueInput.numberList) throw new Error('NUMBER_LIST field requires numberList input');
        return JSON.stringify(valueInput.numberList.value);
        
      case 'json':
        if (!valueInput.json) throw new Error('JSON field requires json input');
        return JSON.stringify(valueInput.json.value);
        
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract value for ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    await requirePermission(context, 'entries', 'create');
    const userId = context.session!.user.id;

    try {
      // First, verify the collection exists and get its fields
      const [collection] = await db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.name, input.collectionName));

      if (!collection) {
        throw new Error(`Collection with name "${input.collectionName}" not found`);
      }

      // Check permission for this specific collection
      await requirePermission(context, 'entries', 'create', {
        collection: { id: collection.id, name: collection.name }
      });

      // Get the collection's fields
      const collectionFields = await db
        .select()
        .from(fieldsTable)
        .where(eq(fieldsTable.collectionId, collection.id));

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
        collectionId: collection.id,
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
          // Check field-level permission to create/write to this field
          await requireFieldPermission(context, field.id, 'create', {
            collection: { id: collection.id, name: collection.name },
            field: { 
              name: field.name, 
              dataType: field.dataType,
              sensitivityLevel: field.sensitivityLevel,
              isPii: field.isPii 
            }
          });

          // Extract the typed value based on the field's data type
          const extractedValue = extractFieldValue(field.dataType, fieldInput.value);
          
          // Insert the value into the appropriate table
          await insertFieldValue(entry.id, field.id, field.dataType, extractedValue);
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