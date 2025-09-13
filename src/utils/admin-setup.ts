import { db } from '../db/index.js';
import { 
  usersTable, 
  rolesTable, 
  abacPoliciesTable, 
  abacPolicyRulesTable,
  userRolesTable, 
  rolePoliciesTable 
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

    // Create admin ABAC policies if they don't exist
    await ensureAdminPolicies(adminRole.id);

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
 * Creates admin ABAC policies that grant full access to all resources
 */
async function ensureAdminPolicies(adminRoleId: string) {
  console.log('🔧 Setting up admin ABAC policies...');

  // Get a user to attribute as the policy creator (we'll use the first user or create a system user)
  let systemUserId: string;
  
  const systemUsers = await db
    .select()
    .from(usersTable)
    .limit(1);
    
  if (systemUsers.length > 0) {
    systemUserId = systemUsers[0]!.id;
  } else {
    // Create a system user for policy attribution
    const passwordHash = await argon2.hash('system-generated');
    const [systemUser] = await db
      .insert(usersTable)
      .values({
        name: 'system',
        passwordHash,
        status: 'ACTIVE',
      })
      .returning();
    systemUserId = systemUser!.id;
  }

  const resources = ['users', 'collections', 'entries', 'assets', 'fields'] as const;
  const actions = [
    'create', 'read', 'update', 'delete', 
    'publish', 'unpublish', 'archive', 'restore', 
    'ban', 'unban', 'upload', 'download', 'transform',
    'configure_fields', 'manage_schema'
  ] as const;

  const policiesToCreate = [];
  
  for (const resource of resources) {
    for (const action of actions) {
      const policyName = `admin-${resource}-${action}`;
      
      // Check if policy already exists
      const existingPolicy = await db
        .select()
        .from(abacPoliciesTable)
        .where(eq(abacPoliciesTable.name, policyName))
        .limit(1);

      if (existingPolicy.length === 0) {
        policiesToCreate.push({
          name: policyName,
          description: `Admin policy: ${action} access to ${resource}`,
          effect: 'ALLOW' as const,
          priority: 1000, // High priority for admin policies
          resourceType: resource,
          actionType: action,
          ruleConnector: 'AND' as const,
          isActive: true,
          createdBy: systemUserId,
        });
      }
    }
  }

  if (policiesToCreate.length > 0) {
    console.log(`📝 Creating ${policiesToCreate.length} ABAC policies...`);
    const createdPolicies = await db
      .insert(abacPoliciesTable)
      .values(policiesToCreate)
      .returning();

    // Create a rule for each policy that matches admin role
    const policyRules = createdPolicies.map(policy => ({
      policyId: policy.id,
      attributePath: 'subject.role' as const,
      operator: 'contains' as const,
      expectedValue: JSON.stringify('admin'),
      valueType: 'string' as const,
      description: 'Policy applies to users with admin role',
      isActive: true,
      order: 0,
    }));

    await db
      .insert(abacPolicyRulesTable)
      .values(policyRules);

    // Assign all policies to admin role
    const rolePolicyAssignments = createdPolicies.map(policy => ({
      roleId: adminRoleId,
      policyId: policy.id,
      assignedBy: systemUserId,
      reason: 'Default admin policy assignment',
    }));

    await db
      .insert(rolePoliciesTable)
      .values(rolePolicyAssignments);

    console.log('✅ Created and assigned ABAC policies to admin role');
  } else {
    console.log('✅ Admin ABAC policies already exist');
    
    // Check if admin role has policies assigned
    const assignedPolicies = await db
      .select()
      .from(rolePoliciesTable)
      .where(eq(rolePoliciesTable.roleId, adminRoleId));

    if (assignedPolicies.length === 0) {
      console.log('📝 Assigning existing policies to admin role...');
      
      // Get all admin policies
      const adminPolicies = await db
        .select()
        .from(abacPoliciesTable)
        .where(eq(abacPoliciesTable.name, 'admin-%'));

      if (adminPolicies.length > 0) {
        const rolePolicyAssignments = adminPolicies.map(policy => ({
          roleId: adminRoleId,
          policyId: policy.id,
          assignedBy: systemUserId,
          reason: 'Default admin policy assignment',
        }));

        await db
          .insert(rolePoliciesTable)
          .values(rolePolicyAssignments);

        console.log('✅ Assigned existing policies to admin role');
      }
    }
  }
}
