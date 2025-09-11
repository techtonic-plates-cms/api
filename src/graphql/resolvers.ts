
import type { 
  FieldFilter,
  TextFilter,
  NumberFilter,
  BooleanFilter,
  DateTimeFilter,
  AssetFilter,
  RichTextFilter,
  JsonFilter,
  EntryFilter,
  DataType
} from '../.graphql/resolvers-types.js';
import type { MyContext } from '../index.js';
import type { GraphQLResolveInfo, FieldNode, ArgumentNode } from 'graphql';
import { db } from '../db/index.js';
import { 
  collectionsTable, 
  fieldsTable, 
  entriesTable,
  entryTextsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable,
  entryRichTextsTable,
  entryJsonDataTable,
  entryAssetsTable,
  assets 
} from '../db/schema.js';
import { eq, and, sql, like, gt, gte, lt, lte } from 'drizzle-orm';

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

async function getFieldValueForEntry(entryId: string, fieldId: string, dataType: string, filter?: FieldFilter) {
  // Based on the field data type, query the appropriate table
  switch (dataType.toLowerCase()) {
    case 'text': {
      let conditions = [
        eq(entryTextsTable.entryId, entryId),
        eq(entryTextsTable.fieldId, fieldId)
      ];

      // Apply database-level filters for text
      const textFilter = filter?.text;
      if (textFilter) {
        if (textFilter.eq && textFilter.eq !== null) {
          conditions.push(eq(entryTextsTable.value, textFilter.eq));
        }
        if (textFilter.ne && textFilter.ne !== null) {
          conditions.push(sql`${entryTextsTable.value} != ${textFilter.ne}`);
        }
        if (textFilter.contains && textFilter.contains !== null) {
          conditions.push(like(entryTextsTable.value, `%${textFilter.contains}%`));
        }
        if (textFilter.startsWith && textFilter.startsWith !== null) {
          conditions.push(like(entryTextsTable.value, `${textFilter.startsWith}%`));
        }
        if (textFilter.endsWith && textFilter.endsWith !== null) {
          conditions.push(like(entryTextsTable.value, `%${textFilter.endsWith}`));
        }
        if (textFilter.in && textFilter.in.length > 0) {
          conditions.push(sql`${entryTextsTable.value} IN (${textFilter.in.map(v => `'${v}'`).join(',')})`);
        }
        if (textFilter.notIn && textFilter.notIn.length > 0) {
          conditions.push(sql`${entryTextsTable.value} NOT IN (${textFilter.notIn.map(v => `'${v}'`).join(',')})`);
        }
      }

      const textValues = await db
        .select()
        .from(entryTextsTable)
        .where(and(...conditions));

      if (textValues.length > 0) {
        const value = textValues[0]?.value;
        return {
          __typename: 'Text' as const,
          text: value
        };
      }
      break;
    }

    case 'asset': {
      let conditions = [
        eq(entryAssetsTable.entryId, entryId),
        eq(entryAssetsTable.fieldId, fieldId)
      ];

      // Apply database-level filters for assets
      const assetFilter = filter?.asset;
      const assetConditions: any[] = [];
      
      if (assetFilter) {
        if (assetFilter.filename?.eq) {
          assetConditions.push(eq(assets.filename, assetFilter.filename.eq));
        }
        if (assetFilter.filename?.contains) {
          assetConditions.push(like(assets.filename, `%${assetFilter.filename.contains}%`));
        }
        if (assetFilter.mimeType?.eq) {
          assetConditions.push(eq(assets.mimeType, assetFilter.mimeType.eq));
        }
        if (assetFilter.mimeType?.contains) {
          assetConditions.push(like(assets.mimeType, `%${assetFilter.mimeType.contains}%`));
        }
        if (assetFilter.fileSize?.eq !== undefined && assetFilter.fileSize.eq !== null) {
          assetConditions.push(eq(assets.fileSize, assetFilter.fileSize.eq));
        }
        if (assetFilter.fileSize?.gt !== undefined && assetFilter.fileSize.gt !== null) {
          assetConditions.push(gt(assets.fileSize, assetFilter.fileSize.gt));
        }
        if (assetFilter.fileSize?.gte !== undefined && assetFilter.fileSize.gte !== null) {
          assetConditions.push(gte(assets.fileSize, assetFilter.fileSize.gte));
        }
        if (assetFilter.fileSize?.lt !== undefined && assetFilter.fileSize.lt !== null) {
          assetConditions.push(lt(assets.fileSize, assetFilter.fileSize.lt));
        }
        if (assetFilter.fileSize?.lte !== undefined && assetFilter.fileSize.lte !== null) {
          assetConditions.push(lte(assets.fileSize, assetFilter.fileSize.lte));
        }
        if (assetFilter.alt?.eq) {
          assetConditions.push(eq(assets.alt, assetFilter.alt.eq));
        }
        if (assetFilter.alt?.contains) {
          assetConditions.push(like(assets.alt, `%${assetFilter.alt.contains}%`));
        }
        if (assetFilter.caption?.eq) {
          assetConditions.push(eq(assets.caption, assetFilter.caption.eq));
        }
        if (assetFilter.caption?.contains) {
          assetConditions.push(like(assets.caption, `%${assetFilter.caption.contains}%`));
        }
      }

      let query = db
        .select({
          asset: assets,
        })
        .from(entryAssetsTable)
        .innerJoin(assets, eq(entryAssetsTable.assetId, assets.id))
        .where(and(...conditions, ...assetConditions));

      const assetValues = await query;

      if (assetValues.length > 0) {
        const asset = assetValues[0]?.asset;
        if (asset) {
          return {
            __typename: 'Asset' as const,
            id: asset.id,
            url: asset.url,
            filename: asset.filename,
            mimeType: asset.mimeType,
            fileSize: asset.fileSize,
            alt: asset.alt,
            caption: asset.caption
          };
        }
      }
      break;
    }

    case 'boolean': {
      let conditions = [
        eq(entryBooleansTable.entryId, entryId),
        eq(entryBooleansTable.fieldId, fieldId)
      ];

      // Apply database-level filters for boolean
      const booleanFilter = filter?.boolean;
      if (booleanFilter) {
        if (booleanFilter.eq !== undefined && booleanFilter.eq !== null) {
          conditions.push(eq(entryBooleansTable.value, booleanFilter.eq));
        }
        if (booleanFilter.ne !== undefined && booleanFilter.ne !== null) {
          conditions.push(sql`${entryBooleansTable.value} != ${booleanFilter.ne}`);
        }
      }

      const booleanValues = await db
        .select()
        .from(entryBooleansTable)
        .where(and(...conditions));

      if (booleanValues.length > 0) {
        const value = booleanValues[0]?.value;
        return {
          __typename: 'BooleanValue' as const,
          value: value
        };
      }
      break;
    }

    case 'number': {
      let conditions = [
        eq(entryNumbersTable.entryId, entryId),
        eq(entryNumbersTable.fieldId, fieldId)
      ];

      // Apply numeric filters at database level
      const numberFilter = filter?.number;
      if (numberFilter) {
        if (numberFilter.eq !== undefined && numberFilter.eq !== null) {
          conditions.push(eq(entryNumbersTable.value, numberFilter.eq));
        }
        if (numberFilter.ne !== undefined && numberFilter.ne !== null) {
          conditions.push(sql`${entryNumbersTable.value} != ${numberFilter.ne}`);
        }
        if (numberFilter.gt !== undefined && numberFilter.gt !== null) {
          conditions.push(gt(entryNumbersTable.value, numberFilter.gt));
        }
        if (numberFilter.gte !== undefined && numberFilter.gte !== null) {
          conditions.push(gte(entryNumbersTable.value, numberFilter.gte));
        }
        if (numberFilter.lt !== undefined && numberFilter.lt !== null) {
          conditions.push(lt(entryNumbersTable.value, numberFilter.lt));
        }
        if (numberFilter.lte !== undefined && numberFilter.lte !== null) {
          conditions.push(lte(entryNumbersTable.value, numberFilter.lte));
        }
        if (numberFilter.in && numberFilter.in.length > 0) {
          conditions.push(sql`${entryNumbersTable.value} IN (${numberFilter.in.join(',')})`);
        }
        if (numberFilter.notIn && numberFilter.notIn.length > 0) {
          conditions.push(sql`${entryNumbersTable.value} NOT IN (${numberFilter.notIn.join(',')})`);
        }
      }

      const numberValues = await db
        .select()
        .from(entryNumbersTable)
        .where(and(...conditions));

      if (numberValues.length > 0) {
        const value = numberValues[0]?.value;
        return {
          __typename: 'NumberValue' as const,
          value: value
        };
      }
      break;
    }

    case 'date_time': {
      const dateTimeValues = await db
        .select()
        .from(entryDateTimesTable)
        .where(and(
          eq(entryDateTimesTable.entryId, entryId),
          eq(entryDateTimesTable.fieldId, fieldId)
        ));

      if (dateTimeValues.length > 0) {
        const value = dateTimeValues[0]?.value;
        return {
          __typename: 'DateTime' as const,
          value: value?.toISOString() || null
        };
      }
      break;
    }

    case 'rich_text': {
      const richTextValues = await db
        .select()
        .from(entryRichTextsTable)
        .where(and(
          eq(entryRichTextsTable.entryId, entryId),
          eq(entryRichTextsTable.fieldId, fieldId)
        ));

      if (richTextValues.length > 0) {
        const richText = richTextValues[0];
        if (richText) {
          return {
            __typename: 'RichText' as const,
            raw: richText.raw,
            rendered: richText.rendered,
            format: richText.format
          };
        }
      }
      break;
    }

    default: {
      // For other types (json, object, etc.), try the JSON table
      const jsonValues = await db
        .select()
        .from(entryJsonDataTable)
        .where(and(
          eq(entryJsonDataTable.entryId, entryId),
          eq(entryJsonDataTable.fieldId, fieldId)
        ));

      if (jsonValues.length > 0) {
        const jsonValue = jsonValues[0];
        if (jsonValue) {
          return {
            __typename: 'Json' as const,
            value: jsonValue.value,
            valueType: jsonValue.valueType
          };
        }
      }
      break;
    }
  }

  return null;
}

// Function to extract field filters from GraphQL selection set
function extractFieldFiltersFromSelectionSet(info: GraphQLResolveInfo): Array<{ fieldName: string; filter: FieldFilter }> {
  const fieldFilters: Array<{ fieldName: string; filter: FieldFilter }> = [];
  
  // Find the entries field in the selection set
  const selectionSet = info.fieldNodes[0]?.selectionSet;
  if (!selectionSet) return fieldFilters;
  
  const entriesField = selectionSet.selections.find(
    (selection): selection is FieldNode => 
      selection.kind === 'Field' && selection.name.value === 'entries'
  );
  
  if (!entriesField?.selectionSet) return fieldFilters;
  
  // Look for field selections within entries
  entriesField.selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field' && selection.name.value === 'field') {
      // Extract field name and filter from arguments
      const nameArg = selection.arguments?.find(arg => arg.name.value === 'name');
      const filterArg = selection.arguments?.find(arg => arg.name.value === 'filter');
      
      if (nameArg?.value.kind === 'StringValue' && filterArg?.value.kind === 'ObjectValue') {
        const fieldName = nameArg.value.value;
        const filter: FieldFilter = {};
        
        // Parse nested filter object structure
        filterArg.value.fields.forEach((typeField) => {
          if (typeField.value.kind === 'ObjectValue') {
            const filterType = typeField.name.value as keyof FieldFilter;
            const filterValues: any = {};
            
            typeField.value.fields.forEach((filterField) => {
              if (filterField.value.kind === 'StringValue') {
                filterValues[filterField.name.value] = filterField.value.value;
              } else if (filterField.value.kind === 'IntValue') {
                filterValues[filterField.name.value] = parseInt(filterField.value.value);
              } else if (filterField.value.kind === 'BooleanValue') {
                filterValues[filterField.name.value] = filterField.value.value;
              } else if (filterField.value.kind === 'ListValue') {
                const listValues = filterField.value.values.map(v => {
                  if (v.kind === 'StringValue') return v.value;
                  if (v.kind === 'IntValue') return parseInt(v.value);
                  return null;
                }).filter(v => v !== null);
                filterValues[filterField.name.value] = listValues;
              }
            });
            
            (filter as any)[filterType] = filterValues;
          }
        });
        
        fieldFilters.push({ fieldName, filter });
      }
    }
  });
  
  return fieldFilters;
}

// Function to build entry queries with field filters applied at database level
async function getEntriesWithFieldFilters(
  collectionId: string, 
  basicFilters: any,
  fieldFilters: Array<{ fieldName: string; filter: FieldFilter }>
) {
  if (fieldFilters.length === 0) {
    // No field filters, use basic query
    let whereConditions = [eq(entriesTable.collectionId, collectionId)];

    if (basicFilters?.name) {
      whereConditions.push(eq(entriesTable.name, basicFilters.name));
    }
    if (basicFilters?.status) {
      whereConditions.push(eq(entriesTable.status, basicFilters.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'));
    }

    return await db
      .select()
      .from(entriesTable)
      .where(and(...whereConditions));
  }

  // Build a complex query with joins for each field filter
  let query = db
    .select({
      id: entriesTable.id,
      name: entriesTable.name,
      slug: entriesTable.slug,
      status: entriesTable.status,
      createdAt: entriesTable.createdAt,
      updatedAt: entriesTable.updatedAt
    })
    .from(entriesTable);

  // Add basic filters
  let whereConditions = [eq(entriesTable.collectionId, collectionId)];
  
  if (basicFilters?.name) {
    whereConditions.push(eq(entriesTable.name, basicFilters.name));
  }
  if (basicFilters?.status) {
    whereConditions.push(eq(entriesTable.status, basicFilters.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'));
  }

  // For each field filter, we need to ensure the entry has a matching value
  // We'll use EXISTS subqueries for each filter
  for (const { fieldName, filter } of fieldFilters) {
    // Get the field info
    const fieldInfo = await db
      .select()
      .from(fieldsTable)
      .where(and(
        eq(fieldsTable.collectionId, collectionId),
        eq(fieldsTable.name, fieldName)
      ))
      .limit(1);

    if (fieldInfo.length === 0) continue;

    const field = fieldInfo[0];
    if (!field) continue;

    // Build EXISTS subquery based on field data type
    switch (field.dataType.toLowerCase()) {
      case 'text': {
        let textConditions = [
          eq(entryTextsTable.entryId, entriesTable.id),
          eq(entryTextsTable.fieldId, field.id)
        ];

        const textFilter = filter.text;
        if (textFilter) {
          if (textFilter.eq && textFilter.eq !== null) {
            textConditions.push(eq(entryTextsTable.value, textFilter.eq));
          }
          if (textFilter.ne && textFilter.ne !== null) {
            textConditions.push(sql`${entryTextsTable.value} != ${textFilter.ne}`);
          }
          if (textFilter.contains && textFilter.contains !== null) {
            textConditions.push(like(entryTextsTable.value, `%${textFilter.contains}%`));
          }
          if (textFilter.startsWith && textFilter.startsWith !== null) {
            textConditions.push(like(entryTextsTable.value, `${textFilter.startsWith}%`));
          }
          if (textFilter.endsWith && textFilter.endsWith !== null) {
            textConditions.push(like(entryTextsTable.value, `%${textFilter.endsWith}`));
          }
          if (textFilter.in && textFilter.in.length > 0) {
            textConditions.push(sql`${entryTextsTable.value} IN (${textFilter.in.map(v => `'${v}'`).join(',')})`);
          }
          if (textFilter.notIn && textFilter.notIn.length > 0) {
            textConditions.push(sql`${entryTextsTable.value} NOT IN (${textFilter.notIn.map(v => `'${v}'`).join(',')})`);
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryTextsTable} WHERE ${and(...textConditions)})`
        );
        break;
      }

      case 'boolean': {
        let boolConditions = [
          eq(entryBooleansTable.entryId, entriesTable.id),
          eq(entryBooleansTable.fieldId, field.id)
        ];

        const booleanFilter = filter.boolean;
        if (booleanFilter) {
          if (booleanFilter.eq !== undefined && booleanFilter.eq !== null) {
            boolConditions.push(eq(entryBooleansTable.value, booleanFilter.eq));
          }
          if (booleanFilter.ne !== undefined && booleanFilter.ne !== null) {
            boolConditions.push(sql`${entryBooleansTable.value} != ${booleanFilter.ne}`);
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryBooleansTable} WHERE ${and(...boolConditions)})`
        );
        break;
      }

      case 'number': {
        let numberConditions = [
          eq(entryNumbersTable.entryId, entriesTable.id),
          eq(entryNumbersTable.fieldId, field.id)
        ];

        const numberFilter = filter.number;
        if (numberFilter) {
          if (numberFilter.eq !== undefined && numberFilter.eq !== null) {
            numberConditions.push(eq(entryNumbersTable.value, numberFilter.eq));
          }
          if (numberFilter.ne !== undefined && numberFilter.ne !== null) {
            numberConditions.push(sql`${entryNumbersTable.value} != ${numberFilter.ne}`);
          }
          if (numberFilter.gt !== undefined && numberFilter.gt !== null) {
            numberConditions.push(gt(entryNumbersTable.value, numberFilter.gt));
          }
          if (numberFilter.gte !== undefined && numberFilter.gte !== null) {
            numberConditions.push(gte(entryNumbersTable.value, numberFilter.gte));
          }
          if (numberFilter.lt !== undefined && numberFilter.lt !== null) {
            numberConditions.push(lt(entryNumbersTable.value, numberFilter.lt));
          }
          if (numberFilter.lte !== undefined && numberFilter.lte !== null) {
            numberConditions.push(lte(entryNumbersTable.value, numberFilter.lte));
          }
          if (numberFilter.in && numberFilter.in.length > 0) {
            numberConditions.push(sql`${entryNumbersTable.value} IN (${numberFilter.in.join(',')})`);
          }
          if (numberFilter.notIn && numberFilter.notIn.length > 0) {
            numberConditions.push(sql`${entryNumbersTable.value} NOT IN (${numberFilter.notIn.join(',')})`);
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryNumbersTable} WHERE ${and(...numberConditions)})`
        );
        break;
      }
    }
  }

  return await query.where(and(...whereConditions));
}

// Legacy function kept for compatibility - now redirects to database-level filtering
async function checkEntryMatchesFieldFilters(
  entryId: string, 
  collectionId: string, 
  fieldFilters: Array<{ fieldName: string; filter: FieldFilter }>
): Promise<boolean> {
  // This function is now deprecated in favor of database-level filtering
  // but kept for any remaining usage
  return true;
}

export const resolvers = {
  Query: {
    books: () => books,
    
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
    },

    collections: async () => {
      const collections = await db
        .select()
        .from(collectionsTable);

      const result = [];
      for (const collection of collections) {
        const fields = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.collectionId, collection.id));

        result.push({
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
        });
      }

      return result;
    }
  },

  Collection: {
    entries: async (parent: any, { filter }: { filter?: EntryFilter }, context: MyContext, info: GraphQLResolveInfo) => {
      // Extract field filters from the GraphQL query
      const fieldFilters = extractFieldFiltersFromSelectionSet(info);
      
      // Use database-level filtering for much better performance
      const entries = await getEntriesWithFieldFilters(parent.id, filter, fieldFilters);

      return entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      }));
    }
  },

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