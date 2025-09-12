import { db } from '../db/index.js';
import { 
  usersTable, 
  rolesTable, 
  permissionsTable, 
  userRolesTable, 
  rolePermissionsTable 
} from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import * as argon2 from 'argon2';

/**
 * Creates an admin user with full permissions if one doesn't already exist
 */
export async function ensureAdminUser() {
  console.log('🔍 Checking for admin user...');

  try {
    // Check if any users exist with admin role
    const existingAdminRole = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, 'admin'))
      .limit(1);

    let adminRole;
    
    if (existingAdminRole.length === 0) {
      // Create admin role if it doesn't exist
      console.log('📝 Creating admin role...');
      const [newAdminRole] = await db
        .insert(rolesTable)
        .values({
          name: 'admin',
          description: 'Full administrative access to all resources',
        })
        .returning();
      adminRole = newAdminRole!;
      console.log('✅ Created admin role');
    } else {
      adminRole = existingAdminRole[0]!;
      console.log('✅ Admin role already exists');
    }

    // Check if any users are assigned to the admin role
    const existingAdminUsers = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.roleId, adminRole.id))
      .limit(1);

    if (existingAdminUsers.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin permissions if they don't exist
    await ensureAdminPermissions(adminRole.id);

    // Generate default admin credentials
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    
    console.log('🔐 Creating admin user...');
    const passwordHash = await argon2.hash(defaultPassword);

    // Create admin user
    const [adminUser] = await db
      .insert(usersTable)
      .values({
        name: defaultUsername,
        passwordHash,
        status: 'ACTIVE',
      })
      .returning();

    console.log('✅ Created admin user:', adminUser!.name);

    // Assign admin role to the user
    await db
      .insert(userRolesTable)
      .values({
        userId: adminUser!.id,
        roleId: adminRole.id,
      });

    console.log('✅ Assigned admin role to user');
    console.log('🎉 Admin setup complete!');
    console.log(`📋 Username: ${defaultUsername}`);
    console.log(`🔑 Password: ${defaultPassword}`);
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  }
}

/**
 * Creates all necessary admin permissions and assigns them to the admin role
 */
async function ensureAdminPermissions(adminRoleId: string) {
  console.log('🔧 Setting up admin permissions...');

  const resources = ['users', 'collections', 'entries', 'assets'] as const;
  const actions = ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'restore', 'ban', 'unban'] as const;

  const permissionsToCreate = [];
  
  for (const resource of resources) {
    for (const action of actions) {
      // Check if permission already exists
      const existingPermission = await db
        .select()
        .from(permissionsTable)
        .where(
          and(
            eq(permissionsTable.resource, resource),
            eq(permissionsTable.action, action),
            eq(permissionsTable.scopeType, 'GLOBAL')
          )
        )
        .limit(1);

      if (existingPermission.length === 0) {
        permissionsToCreate.push({
          resource,
          action,
          scopeType: 'GLOBAL' as const,
          description: `${action} access to ${resource}`,
        });
      }
    }
  }

  if (permissionsToCreate.length > 0) {
    console.log(`📝 Creating ${permissionsToCreate.length} permissions...`);
    const createdPermissions = await db
      .insert(permissionsTable)
      .values(permissionsToCreate)
      .returning();

    // Assign all permissions to admin role
    const rolePermissions = createdPermissions.map(permission => ({
      roleId: adminRoleId,
      permissionId: permission.id,
    }));

    await db
      .insert(rolePermissionsTable)
      .values(rolePermissions);

    console.log('✅ Created and assigned permissions to admin role');
  } else {
    console.log('✅ Admin permissions already exist');
    
    // Check if admin role has all permissions assigned
    const allPermissions = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.scopeType, 'GLOBAL'));

    const assignedPermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, adminRoleId));

    const missingPermissions = allPermissions.filter(
      permission => !assignedPermissions.some(
        assigned => assigned.permissionId === permission.id
      )
    );

    if (missingPermissions.length > 0) {
      console.log(`📝 Assigning ${missingPermissions.length} missing permissions to admin role...`);
      const rolePermissions = missingPermissions.map(permission => ({
        roleId: adminRoleId,
        permissionId: permission.id,
      }));

      await db
        .insert(rolePermissionsTable)
        .values(rolePermissions);

      console.log('✅ Assigned missing permissions to admin role');
    }
  }
}
