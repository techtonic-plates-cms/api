import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { fieldsTable, entriesTable, usersTable } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { FieldType } from '../field/field.type.ts';
import { EntryType } from '../entry/entry.type.ts';
import { User } from '../../auth/auth.type.ts';

// ============================================================================
// Collection Type
// ============================================================================

export const CollectionType = builder.objectRef<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdBy?: string;
}>('Collection');

CollectionType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    createdBy: t.exposeString('createdBy', { nullable: true }),
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
    fields: t.field({
      type: [FieldType],
      resolve: async (parent, _args, context) => {
        const fields = await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.collectionId, parent.id));
        
        // Filter fields based on field-level permissions
        const accessibleFields = [];
        for (const f of fields) {
          const canRead = await context.checkPermission('fields', 'read', {
            id: f.id,
            name: f.name,
            dataType: f.dataType,
            sensitivityLevel: f.sensitivityLevel,
            isPii: f.isPii,
            isPublic: f.isPublic,
            collectionId: f.collectionId,
          });
          
          if (canRead) {
            accessibleFields.push({
              id: f.id,
              name: f.name,
              label: f.label,
              dataType: f.dataType,
              collectionId: f.collectionId,
            });
          }
        }
        
        return accessibleFields;
      },
    }),
    entries: t.field({
      type: [EntryType],
      resolve: async (parent) => {
        const entries = await db
          .select()
          .from(entriesTable)
          .where(eq(entriesTable.collectionId, parent.id));
        
        return entries.map((e) => ({
          id: e.id,
          name: e.name,
          collectionId: e.collectionId,
          status: e.status,
        }));
      },
    }),
  }),
});
