import { builder } from '../../builder.ts';
import { FieldValueInterface } from '../field/field-value.types.ts';
import { FieldValueFilterInput } from '../field/filters.input.ts';
import { resolveEntryField } from './entry-field.resolver.ts';
import { db } from '../../../db/index.ts';
import { collectionsTable, usersTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { User } from '../../auth/auth.type.ts';

// ============================================================================
// Entry Type
// ============================================================================

export const EntryType = builder.objectRef<{
  id: string;
  name: string;
  collectionId: string;
  status: string;
  slug?: string | null;
  locale?: string;
  defaultLocale?: string;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date | null;
  createdBy?: string;
}>('Entry');

EntryType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    collectionId: t.exposeString('collectionId'),
    status: t.exposeString('status'),
    slug: t.exposeString('slug', { nullable: true }),
    locale: t.exposeString('locale', { nullable: true }),
    defaultLocale: t.exposeString('defaultLocale', { nullable: true }),
    createdAt: t.string({
      nullable: true,
      resolve: (parent) => parent.createdAt?.toISOString(),
    }),
    updatedAt: t.string({
      nullable: true,
      resolve: (parent) => parent.updatedAt?.toISOString(),
    }),
    publishedAt: t.string({
      nullable: true,
      resolve: (parent) => parent.publishedAt?.toISOString(),
    }),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    collection: t.field({
      type: 'Collection',
      nullable: true,
      resolve: async (parent) => {
        const collections = await db
          .select()
          .from(collectionsTable)
          .where(eq(collectionsTable.id, parent.collectionId))
          .limit(1);
        
        if (collections.length === 0) return null;
        
        const collection = collections[0];
        return {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
        };
      },
    }),
    createdByUser: t.field({
      type: User,
      nullable: true,
      resolve: async (parent) => {
        if (!parent.createdBy) return null;
        
        const users = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, parent.createdBy))
          .limit(1);
        
        if (users.length === 0) return null;
        
        const user = users[0];
        return {
          id: user.id,
          name: user.name,
        };
      },
    }),
    field: t.field({
      type: FieldValueInterface,
      nullable: true,
      args: {
        name: t.arg.string({ required: true }),
        filter: t.arg({ type: FieldValueFilterInput, required: false }),
      },
      resolve: resolveEntryField,
    }),
  }),
});
