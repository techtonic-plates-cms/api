import type { FieldFilter } from '../../.graphql/resolvers-types.js';
import { db } from '../../db/index.js';
import { 
  collectionsTable, 
  fieldsTable, 
  entriesTable,
  entryTextsTable,
  entryTypstTextsTable,
  entryRelationsTable,
  entryBooleansTable,
  entryNumbersTable,
  entryDateTimesTable
} from '../../db/schema.js';
import { eq, and, sql, like, gt, gte, lt, lte } from 'drizzle-orm';

export async function getEntriesWithFieldFilters(
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

      case 'typst_text': {
        let typstTextConditions = [
          eq(entryTypstTextsTable.entryId, entriesTable.id),
          eq(entryTypstTextsTable.fieldId, field.id)
        ];

        const typstTextFilter = filter.typstText;
        if (typstTextFilter) {
          if (typstTextFilter.raw?.eq) {
            typstTextConditions.push(eq(entryTypstTextsTable.raw, typstTextFilter.raw.eq));
          }
          if (typstTextFilter.raw?.contains) {
            typstTextConditions.push(like(entryTypstTextsTable.raw, `%${typstTextFilter.raw.contains}%`));
          }
          if (typstTextFilter.raw?.startsWith) {
            typstTextConditions.push(like(entryTypstTextsTable.raw, `${typstTextFilter.raw.startsWith}%`));
          }
          if (typstTextFilter.raw?.endsWith) {
            typstTextConditions.push(like(entryTypstTextsTable.raw, `%${typstTextFilter.raw.endsWith}`));
          }
          if (typstTextFilter.rendered?.eq) {
            typstTextConditions.push(eq(entryTypstTextsTable.rendered, typstTextFilter.rendered.eq));
          }
          if (typstTextFilter.rendered?.contains) {
            typstTextConditions.push(like(entryTypstTextsTable.rendered, `%${typstTextFilter.rendered.contains}%`));
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryTypstTextsTable} WHERE ${and(...typstTextConditions)})`
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

      case 'date_time': {
        let dateTimeConditions = [
          eq(entryDateTimesTable.entryId, entriesTable.id),
          eq(entryDateTimesTable.fieldId, field.id)
        ];

        const dateTimeFilter = filter.dateTime;
        if (dateTimeFilter) {
          if (dateTimeFilter.eq) {
            dateTimeConditions.push(eq(entryDateTimesTable.value, new Date(dateTimeFilter.eq)));
          }
          if (dateTimeFilter.ne) {
            dateTimeConditions.push(sql`${entryDateTimesTable.value} != ${new Date(dateTimeFilter.ne)}`);
          }
          if (dateTimeFilter.gt) {
            dateTimeConditions.push(sql`${entryDateTimesTable.value} > ${new Date(dateTimeFilter.gt)}`);
          }
          if (dateTimeFilter.gte) {
            dateTimeConditions.push(sql`${entryDateTimesTable.value} >= ${new Date(dateTimeFilter.gte)}`);
          }
          if (dateTimeFilter.lt) {
            dateTimeConditions.push(sql`${entryDateTimesTable.value} < ${new Date(dateTimeFilter.lt)}`);
          }
          if (dateTimeFilter.lte) {
            dateTimeConditions.push(sql`${entryDateTimesTable.value} <= ${new Date(dateTimeFilter.lte)}`);
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryDateTimesTable} WHERE ${and(...dateTimeConditions)})`
        );
        break;
      }

      case 'relation': {
        let relationConditions = [
          eq(entryRelationsTable.fromEntryId, entriesTable.id),
          eq(entryRelationsTable.fieldId, field.id)
        ];

        const relationFilter = filter.relation;
        if (relationFilter) {
          if (relationFilter.entryId) {
            relationConditions.push(eq(entryRelationsTable.toEntryId, relationFilter.entryId));
          }
          // For more complex relation filters (entryName, entryStatus), we would need a subquery with joins
          if (relationFilter.entryName?.eq || relationFilter.entryName?.contains || relationFilter.entryStatus) {
            // Use EXISTS with JOIN to filter by related entry properties
            let relatedEntryConditions = [eq(entriesTable.id, entryRelationsTable.toEntryId)];
            
            if (relationFilter.entryName?.eq) {
              relatedEntryConditions.push(eq(entriesTable.name, relationFilter.entryName.eq));
            }
            if (relationFilter.entryName?.contains) {
              relatedEntryConditions.push(like(entriesTable.name, `%${relationFilter.entryName.contains}%`));
            }
            if (relationFilter.entryStatus) {
              relatedEntryConditions.push(eq(entriesTable.status, relationFilter.entryStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'));
            }
            
            whereConditions.push(
              sql`EXISTS (
                SELECT 1 FROM ${entryRelationsTable} 
                INNER JOIN ${entriesTable} ON ${entriesTable.id} = ${entryRelationsTable.toEntryId}
                WHERE ${and(...relationConditions, ...relatedEntryConditions)}
              )`
            );
            break;
          }
        }

        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${entryRelationsTable} WHERE ${and(...relationConditions)})`
        );
        break;
      }
    }
  }

  return await query.where(and(...whereConditions));
}

export async function checkEntryMatchesFieldFilters(
  entryId: string, 
  collectionId: string, 
  fieldFilters: Array<{ fieldName: string; filter: FieldFilter }>
): Promise<boolean> {
  // This function is now deprecated in favor of database-level filtering
  // but kept for any remaining usage
  return true;
}