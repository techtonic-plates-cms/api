import type { AppContext } from '#/index';
import type { MutationResolvers } from '$graphql/resolvers-types';
import { 
  requireAuth,
} from '#/session/';
import {

  requirePermission,

} from "#/session/permissions"
import { db } from '$db/index';
import { collectionsTable, fieldsTable } from '$db/schema';
import { eq } from 'drizzle-orm';
import { DataType } from '$graphql/resolvers-types';

// Map database enum values back to GraphQL enum values
const mapDbTypeToGraphQL = (dbType: string): DataType => {
  switch (dbType) {
    case 'text':
      return DataType.Text;
    case 'typst_text':
      return DataType.TypstText;
    case 'boolean':
      return DataType.Boolean;
    case 'number':
      return DataType.Number;
    case 'date_time':
      return DataType.DateTime;
    case 'relation':
      return DataType.Relation;
    case 'object':
      return DataType.Object;
    case 'text_list':
      return DataType.TextList;
    case 'number_list':
      return DataType.NumberList;
    case 'asset':
      return DataType.Asset;
    case 'rich_text':
      return DataType.RichText;
    case 'json':
      return DataType.Json;
    default:
      throw new Error(`Unknown data type: ${dbType}`);
  }
};

// Map GraphQL enum values to database enum values
const mapDataTypeToDb = (graphqlType: DataType): string => {
  switch (graphqlType) {
    case DataType.Text:
      return 'text';
    case DataType.TypstText:
      return 'typst_text';
    case DataType.Boolean:
      return 'boolean';
    case DataType.Number:
      return 'number';
    case DataType.DateTime:
      return 'date_time';
    case DataType.Relation:
      return 'relation';
    case DataType.Object:
      return 'object';
    case DataType.TextList:
      return 'text_list';
    case DataType.NumberList:
      return 'number_list';
    case DataType.Asset:
      return 'asset';
    case DataType.RichText:
      return 'rich_text';
    case DataType.Json:
      return 'json';
    default:
      throw new Error(`Unknown data type: ${graphqlType}`);
  }
};

export const collectionMutations: Pick<MutationResolvers, 'createCollection'> = {
  async createCollection(_parent, { input }, context) {
    // Require authentication and permission to create collections
    requireAuth(context);
    requirePermission(context, 'collections', 'create');
    const userId = context.session!.user.id;
  
    try {
      // Create the collection first
      const [collection] = await db.insert(collectionsTable).values({
        createdBy: userId,
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        icon: input.icon || null,
        color: input.color || null,
        defaultLocale: (input.defaultLocale as any) || 'en',
        supportedLocales: input.supportedLocales || ['en'],
        isLocalized: input.isLocalized,
      }).returning();

      if (!collection) {
        throw new Error('Failed to create collection');
      }

      // Create the fields for the collection
      if (input.fields && input.fields.length > 0) {
        const fieldsData = input.fields.map(field => ({
          collectionId: collection.id,
          name: field.name,
          label: field.label || null,
          dataType: mapDataTypeToDb(field.dataType) as any,
          isRequired: field.isRequired ?? false,
          isUnique: field.isUnique ?? false,
        }));

        await db.insert(fieldsTable).values(fieldsData);
      }

      // Fetch the fields for the collection
      const fields = await db.select().from(fieldsTable).where(eq(fieldsTable.collectionId, collection.id));

      return {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        fields: fields.map(field => ({
          id: field.id,
          name: field.name,
          label: field.label,
          dataType: mapDbTypeToGraphQL(field.dataType),
          isRequired: field.isRequired,
          isUnique: field.isUnique,
        })),
        entries: [], // Empty entries array for new collection
        createdBy: collection.createdBy,
        createdAt: collection.createdAt?.toISOString(),
        updatedAt: collection.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw new Error('Failed to create collection');
    }
  }
};