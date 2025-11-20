import { GraphQLError } from 'graphql';
import { builder } from '../../builder.ts';
import { db } from '../../../db/index.ts';
import { rolesTable, rolePoliciesTable, abacPoliciesTable } from '../../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { RoleType } from './role.type.ts';
import { requireAuth } from '../../../graphql-context.ts';

// ============================================================================
// Input Types
// ============================================================================

const CreateRoleInput = builder.inputType('CreateRoleInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    policyIds: t.idList({ required: false }),
  }),
});

const UpdateRoleInput = builder.inputType('UpdateRoleInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

const AssignPolicyToRoleInput = builder.inputType('AssignPolicyToRoleInput', {
  fields: (t) => ({
    roleId: t.id({ required: true }),
    policyId: t.id({ required: true }),
    expiresAt: t.string({ required: false }), // ISO date string
    reason: t.string({ required: false }),
  }),
});

// ============================================================================
// Role Mutations Type
// ============================================================================

export const RoleMutations = builder.objectRef<Record<PropertyKey, never>>('RoleMutations');

RoleMutations.implement({
  fields: (t) => ({
    create: t.field({
      type: RoleType,
      description: 'Create a new role',
      args: {
        input: t.arg({ type: CreateRoleInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        const user = requireAuth(context);
        
        // Check permission to create roles (part of user management)
        await context.requirePermission('users', 'create');
        
        // Create role
        const [newRole] = await db.insert(rolesTable).values({
          name: args.input.name,
          description: args.input.description ?? null,
        }).returning();

        // Assign policies if provided
        if (args.input.policyIds && args.input.policyIds.length > 0) {
          await db.insert(rolePoliciesTable).values(
            args.input.policyIds.map((policyId) => ({
              roleId: newRole.id,
              policyId,
              assignedBy: user.id,
            }))
          );
        }
        
        return {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          creationTime: newRole.creationTime,
          lastEditTime: newRole.lastEditTime,
        };
      },
    }),
    
    update: t.field({
      type: RoleType,
      description: 'Update a role',
      args: {
        input: t.arg({ type: UpdateRoleInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update roles
        await context.requirePermission('users', 'update');
        
        // Build update values
        const updateValues: Record<string, unknown> = {
          lastEditTime: new Date(),
        };
        
        if (args.input.name !== undefined) updateValues.name = args.input.name;
        if (args.input.description !== undefined) updateValues.description = args.input.description;
        
        // Update role
        const [updatedRole] = await db
          .update(rolesTable)
          .set(updateValues)
          .where(eq(rolesTable.id, args.input.id))
          .returning();
        
        if (!updatedRole) {
          throw new GraphQLError('Role not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        return {
          id: updatedRole.id,
          name: updatedRole.name,
          description: updatedRole.description,
          creationTime: updatedRole.creationTime,
          lastEditTime: updatedRole.lastEditTime,
        };
      },
    }),
    
    delete: t.field({
      type: 'Boolean',
      description: 'Delete a role',
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to delete roles
        await context.requirePermission('users', 'delete');
        
        // Delete role (cascade will handle user and policy assignments)
        await db.delete(rolesTable).where(eq(rolesTable.id, args.id));
        
        return true;
      },
    }),
    
    assignPolicy: t.field({
      type: 'Boolean',
      description: 'Assign a policy to a role',
      args: {
        input: t.arg({ type: AssignPolicyToRoleInput, required: true }),
      },
      resolve: async (_parent, args, context) => {
        const user = requireAuth(context);
        
        // Check permission to update roles
        await context.requirePermission('users', 'update');
        
        // Verify role and policy exist
        const [role] = await db
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.id, args.input.roleId))
          .limit(1);
        
        if (!role) {
          throw new GraphQLError('Role not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const [policy] = await db
          .select()
          .from(abacPoliciesTable)
          .where(eq(abacPoliciesTable.id, args.input.policyId))
          .limit(1);
        
        if (!policy) {
          throw new GraphQLError('Policy not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if assignment already exists
        const existing = await db
          .select()
          .from(rolePoliciesTable)
          .where(
            and(
              eq(rolePoliciesTable.roleId, args.input.roleId),
              eq(rolePoliciesTable.policyId, args.input.policyId)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          throw new GraphQLError('Policy already assigned to role', {
            extensions: { code: 'CONFLICT' },
          });
        }
        
        // Assign policy
        await db.insert(rolePoliciesTable).values({
          roleId: args.input.roleId,
          policyId: args.input.policyId,
          assignedBy: user.id,
          expiresAt: args.input.expiresAt ? new Date(args.input.expiresAt) : null,
          reason: args.input.reason ?? null,
        });
        
        return true;
      },
    }),
    
    unassignPolicy: t.field({
      type: 'Boolean',
      description: 'Remove a policy from a role',
      args: {
        roleId: t.arg.id({ required: true }),
        policyId: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAuth(context);
        
        // Check permission to update roles
        await context.requirePermission('users', 'update');
        
        // Remove policy assignment
        await db
          .delete(rolePoliciesTable)
          .where(
            and(
              eq(rolePoliciesTable.roleId, args.roleId),
              eq(rolePoliciesTable.policyId, args.policyId)
            )
          );
        
        return true;
      },
    }),
  }),
});

// ============================================================================
// Wire up RoleMutations to root Mutation type
// ============================================================================

builder.mutationField('roles', (t) =>
  t.field({
    type: RoleMutations,
    resolve: () => ({}),
  })
);
