import { db } from '../../../db/index.ts';
import {
  fieldsTable,
  entryTextsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable,
  entryRichTextsTable,
  entryJsonDataTable,
  entryAssetsTable,
  entryRelationsTable,
} from '../../../db/schema.ts';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// Entry Field Resolver
// ============================================================================

interface EntryParent {
  id: string;
  name: string;
  collectionId: string;
  status: string;
}

interface FieldArgs {
  name: string;
  filter?: {
    text?: {
      eq?: string | null;
      ne?: string | null;
      contains?: string | null;
      startsWith?: string | null;
      endsWith?: string | null;
    } | null;
    number?: {
      eq?: number | null;
      ne?: number | null;
      gt?: number | null;
      gte?: number | null;
      lt?: number | null;
      lte?: number | null;
    } | null;
    boolean?: {
      eq?: boolean | null;
    } | null;
    dateTime?: {
      eq?: string | null;
      gt?: string | null;
      gte?: string | null;
      lt?: string | null;
      lte?: string | null;
    } | null;
  } | null;
}

export async function resolveEntryField(parent: EntryParent, args: FieldArgs) {
  // Find the field by name for this collection
  const fields = await db
    .select()
    .from(fieldsTable)
    .where(
      and(
        eq(fieldsTable.collectionId, parent.collectionId),
        eq(fieldsTable.name, args.name)
      )
    )
    .limit(1);

  if (fields.length === 0) return null;
  const field = fields[0];

  // Fetch the value based on dataType
  const fieldId = field.id;
  const entryId = parent.id;

  switch (field.dataType) {
    case 'text': {
      const values = await db
        .select()
        .from(entryTextsTable)
        .where(
          and(
            eq(entryTextsTable.entryId, entryId),
            eq(entryTextsTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      const value = values[0].value;

      // Apply text filter if provided
      if (args.filter?.text && value !== null) {
        const textFilter = args.filter.text;
        if (textFilter.eq !== undefined && textFilter.eq !== null && value !== textFilter.eq) return null;
        if (textFilter.ne !== undefined && textFilter.ne !== null && value === textFilter.ne) return null;
        if (textFilter.contains !== undefined && textFilter.contains !== null && !value.includes(textFilter.contains)) return null;
        if (textFilter.startsWith !== undefined && textFilter.startsWith !== null && !value.startsWith(textFilter.startsWith)) return null;
        if (textFilter.endsWith !== undefined && textFilter.endsWith !== null && !value.endsWith(textFilter.endsWith)) return null;
      }

      return { fieldId, text: value };
    }
    
    case 'boolean': {
      const values = await db
        .select()
        .from(entryBooleansTable)
        .where(
          and(
            eq(entryBooleansTable.entryId, entryId),
            eq(entryBooleansTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      const value = values[0].value;

      // Apply boolean filter if provided
      if (args.filter?.boolean?.eq !== undefined && value !== args.filter.boolean.eq) {
        return null;
      }

      return { fieldId, value };
    }

    case 'number': {
      const values = await db
        .select()
        .from(entryNumbersTable)
        .where(
          and(
            eq(entryNumbersTable.entryId, entryId),
            eq(entryNumbersTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      const value = values[0].value;

      // Apply number filter if provided
      if (args.filter?.number) {
        const numFilter = args.filter.number;
        if (numFilter.eq !== undefined && numFilter.eq !== null && value !== numFilter.eq) return null;
        if (numFilter.ne !== undefined && numFilter.ne !== null && value === numFilter.ne) return null;
        if (numFilter.gt !== undefined && numFilter.gt !== null && (value === null || value <= numFilter.gt)) return null;
        if (numFilter.gte !== undefined && numFilter.gte !== null && (value === null || value < numFilter.gte)) return null;
        if (numFilter.lt !== undefined && numFilter.lt !== null && (value === null || value >= numFilter.lt)) return null;
        if (numFilter.lte !== undefined && numFilter.lte !== null && (value === null || value > numFilter.lte)) return null;
      }

      return { fieldId, value };
    }

    case 'date_time': {
      const values = await db
        .select()
        .from(entryDateTimesTable)
        .where(
          and(
            eq(entryDateTimesTable.entryId, entryId),
            eq(entryDateTimesTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      const value = values[0].value;

      // Apply datetime filter if provided
      if (args.filter?.dateTime) {
        const dtFilter = args.filter.dateTime;
        const valueTime = value?.getTime() ?? null;
        
        if (dtFilter.eq !== undefined && dtFilter.eq !== null) {
          const eqTime = new Date(dtFilter.eq).getTime();
          if (valueTime !== eqTime) return null;
        }
        if (dtFilter.gt !== undefined && dtFilter.gt !== null) {
          const gtTime = new Date(dtFilter.gt).getTime();
          if (valueTime === null || valueTime <= gtTime) return null;
        }
        if (dtFilter.gte !== undefined && dtFilter.gte !== null) {
          const gteTime = new Date(dtFilter.gte).getTime();
          if (valueTime === null || valueTime < gteTime) return null;
        }
        if (dtFilter.lt !== undefined && dtFilter.lt !== null) {
          const ltTime = new Date(dtFilter.lt).getTime();
          if (valueTime === null || valueTime >= ltTime) return null;
        }
        if (dtFilter.lte !== undefined && dtFilter.lte !== null) {
          const lteTime = new Date(dtFilter.lte).getTime();
          if (valueTime === null || valueTime > lteTime) return null;
        }
      }

      return { fieldId, value };
    }

    case 'rich_text': {
      const values = await db
        .select()
        .from(entryRichTextsTable)
        .where(
          and(
            eq(entryRichTextsTable.entryId, entryId),
            eq(entryRichTextsTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      return {
        fieldId,
        raw: values[0].raw,
        rendered: values[0].rendered,
        format: values[0].format,
      };
    }

    case 'json':
    case 'text_list':
    case 'number_list': {
      const values = await db
        .select()
        .from(entryJsonDataTable)
        .where(
          and(
            eq(entryJsonDataTable.entryId, entryId),
            eq(entryJsonDataTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      return { fieldId, value: values[0].value };
    }

    case 'asset': {
      const values = await db
        .select()
        .from(entryAssetsTable)
        .where(
          and(
            eq(entryAssetsTable.entryId, entryId),
            eq(entryAssetsTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      return { fieldId, assetId: values[0].assetId };
    }

    case 'relation': {
      const values = await db
        .select()
        .from(entryRelationsTable)
        .where(
          and(
            eq(entryRelationsTable.fromEntryId, entryId),
            eq(entryRelationsTable.fieldId, fieldId)
          )
        )
        .limit(1);

      if (values.length === 0) return null;
      return { fieldId, entryId: values[0].toEntryId };
    }

    default:
      return null;
  }
}
