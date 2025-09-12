import type { FieldFilter } from '../../.graphql/resolvers-types.js';
import { db } from '../../db/index.js';
import { 
  entryTextsTable,
  entryTypstTextsTable,
  entryRelationsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable,
  entryRichTextsTable,
  entryJsonDataTable,
  entryAssetsTable,
  assetsTable,
  entriesTable
} from '../../db/schema.js';
import { eq, and, sql, like, gt, gte, lt, lte } from 'drizzle-orm';

export async function getFieldValueForEntry(entryId: string, fieldId: string, dataType: string, filter?: FieldFilter) {
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

    case 'typst_text': {
      let conditions = [
        eq(entryTypstTextsTable.entryId, entryId),
        eq(entryTypstTextsTable.fieldId, fieldId)
      ];

      // Apply database-level filters for typst text
      const typstTextFilter = filter?.typstText;
      if (typstTextFilter) {
        if (typstTextFilter.raw?.eq) {
          conditions.push(eq(entryTypstTextsTable.raw, typstTextFilter.raw.eq));
        }
        if (typstTextFilter.raw?.contains) {
          conditions.push(like(entryTypstTextsTable.raw, `%${typstTextFilter.raw.contains}%`));
        }
        if (typstTextFilter.raw?.startsWith) {
          conditions.push(like(entryTypstTextsTable.raw, `${typstTextFilter.raw.startsWith}%`));
        }
        if (typstTextFilter.raw?.endsWith) {
          conditions.push(like(entryTypstTextsTable.raw, `%${typstTextFilter.raw.endsWith}`));
        }
        if (typstTextFilter.rendered?.eq) {
          conditions.push(eq(entryTypstTextsTable.rendered, typstTextFilter.rendered.eq));
        }
        if (typstTextFilter.rendered?.contains) {
          conditions.push(like(entryTypstTextsTable.rendered, `%${typstTextFilter.rendered.contains}%`));
        }
      }

      const typstTextValues = await db
        .select()
        .from(entryTypstTextsTable)
        .where(and(...conditions));

      if (typstTextValues.length > 0) {
        const value = typstTextValues[0];
        if (value) {
          return {
            __typename: 'TypstText' as const,
            raw: value.raw,
            rendered: value.rendered
          };
        }
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
          assetConditions.push(eq(assetsTable.filename, assetFilter.filename.eq));
        }
        if (assetFilter.filename?.contains) {
          assetConditions.push(like(assetsTable.filename, `%${assetFilter.filename.contains}%`));
        }
        if (assetFilter.mimeType?.eq) {
          assetConditions.push(eq(assetsTable.mimeType, assetFilter.mimeType.eq));
        }
        if (assetFilter.mimeType?.contains) {
          assetConditions.push(like(assetsTable.mimeType, `%${assetFilter.mimeType.contains}%`));
        }
        if (assetFilter.fileSize?.eq !== undefined && assetFilter.fileSize.eq !== null) {
          assetConditions.push(eq(assetsTable.fileSize, assetFilter.fileSize.eq));
        }
        if (assetFilter.fileSize?.gt !== undefined && assetFilter.fileSize.gt !== null) {
          assetConditions.push(gt(assetsTable.fileSize, assetFilter.fileSize.gt));
        }
        if (assetFilter.fileSize?.gte !== undefined && assetFilter.fileSize.gte !== null) {
          assetConditions.push(gte(assetsTable.fileSize, assetFilter.fileSize.gte));
        }
        if (assetFilter.fileSize?.lt !== undefined && assetFilter.fileSize.lt !== null) {
          assetConditions.push(lt(assetsTable.fileSize, assetFilter.fileSize.lt));
        }
        if (assetFilter.fileSize?.lte !== undefined && assetFilter.fileSize.lte !== null) {
          assetConditions.push(lte(assetsTable.fileSize, assetFilter.fileSize.lte));
        }
        if (assetFilter.alt?.eq) {
          assetConditions.push(eq(assetsTable.alt, assetFilter.alt.eq));
        }
        if (assetFilter.alt?.contains) {
          assetConditions.push(like(assetsTable.alt, `%${assetFilter.alt.contains}%`));
        }
        if (assetFilter.caption?.eq) {
          assetConditions.push(eq(assetsTable.caption, assetFilter.caption.eq));
        }
        if (assetFilter.caption?.contains) {
          assetConditions.push(like(assetsTable.caption, `%${assetFilter.caption.contains}%`));
        }
      }

      let query = db
        .select({
          asset: assetsTable,
        })
        .from(entryAssetsTable)
        .innerJoin(assetsTable, eq(entryAssetsTable.assetId, assetsTable.id))
        .where(and(...conditions, ...assetConditions));

      const assetValues = await query;

      if (assetValues.length > 0) {
        const asset = assetValues[0]?.asset;
        if (asset) {
          return {
            __typename: 'Asset' as const,
            id: asset.id,
            path: asset.path,
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
      let conditions = [
        eq(entryDateTimesTable.entryId, entryId),
        eq(entryDateTimesTable.fieldId, fieldId)
      ];

      // Apply database-level filters for date/time
      const dateTimeFilter = filter?.dateTime;
      if (dateTimeFilter) {
        if (dateTimeFilter.eq) {
          conditions.push(eq(entryDateTimesTable.value, new Date(dateTimeFilter.eq)));
        }
        if (dateTimeFilter.ne) {
          conditions.push(sql`${entryDateTimesTable.value} != ${new Date(dateTimeFilter.ne)}`);
        }
        if (dateTimeFilter.gt) {
          conditions.push(sql`${entryDateTimesTable.value} > ${new Date(dateTimeFilter.gt)}`);
        }
        if (dateTimeFilter.gte) {
          conditions.push(sql`${entryDateTimesTable.value} >= ${new Date(dateTimeFilter.gte)}`);
        }
        if (dateTimeFilter.lt) {
          conditions.push(sql`${entryDateTimesTable.value} < ${new Date(dateTimeFilter.lt)}`);
        }
        if (dateTimeFilter.lte) {
          conditions.push(sql`${entryDateTimesTable.value} <= ${new Date(dateTimeFilter.lte)}`);
        }
      }

      const dateTimeValues = await db
        .select()
        .from(entryDateTimesTable)
        .where(and(...conditions));

      if (dateTimeValues.length > 0) {
        const value = dateTimeValues[0]?.value;
        return {
          __typename: 'DateTime' as const,
          value: value?.toISOString() || null
        };
      }
      break;
    }

    case 'relation': {
      let conditions = [
        eq(entryRelationsTable.fromEntryId, entryId),
        eq(entryRelationsTable.fieldId, fieldId)
      ];

      // Apply database-level filters for relations
      const relationFilter = filter?.relation;
      let joinConditions: any[] = [];
      
      if (relationFilter) {
        if (relationFilter.entryId) {
          conditions.push(eq(entryRelationsTable.toEntryId, relationFilter.entryId));
        }
        if (relationFilter.entryName?.eq) {
          joinConditions.push(eq(entriesTable.name, relationFilter.entryName.eq));
        }
        if (relationFilter.entryName?.contains) {
          joinConditions.push(like(entriesTable.name, `%${relationFilter.entryName.contains}%`));
        }
        if (relationFilter.entryStatus) {
          joinConditions.push(eq(entriesTable.status, relationFilter.entryStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'));
        }
      }

      let query = db
        .select({
          relation: entryRelationsTable,
          relatedEntry: entriesTable
        })
        .from(entryRelationsTable)
        .innerJoin(entriesTable, eq(entryRelationsTable.toEntryId, entriesTable.id))
        .where(and(...conditions, ...joinConditions));

      const relationValues = await query;

      if (relationValues.length > 0) {
        const relationData = relationValues[0];
        if (relationData?.relatedEntry) {
          return {
            __typename: 'Relation' as const,
            entry: {
              id: relationData.relatedEntry.id,
              name: relationData.relatedEntry.name,
              slug: relationData.relatedEntry.slug,
              status: relationData.relatedEntry.status,
              createdAt: relationData.relatedEntry.createdAt.toISOString(),
              updatedAt: relationData.relatedEntry.updatedAt.toISOString()
            }
          };
        }
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