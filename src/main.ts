import { createYoga } from 'graphql-yoga';
import { schema } from './schema/index.ts';
import { db } from './db/index.ts';
import { usersTable, rolesTable, userRolesTable, abacPoliciesTable, rolePoliciesTable, assetsTable } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyAccessToken } from './auth.ts';
import { useAuth, GraphQLContext } from './graphql-context.ts';
import { downloadFromS3 } from './s3.ts';
import { checkPermission } from './abac.ts';
import { getSession } from './session.ts';

/**
 * Create admin role with full permissions if it doesn't exist
 */
async function ensureAdminRole(adminUserId: string) {
  try {
    // Check if admin role exists
    const existingRoles = await db.select().from(rolesTable).where(eq(rolesTable.name, 'admin'));
    let adminRole = existingRoles[0];

    if (!adminRole) {
      // Create admin role
      const [newRole] = await db.insert(rolesTable).values({
        name: 'admin',
        description: 'Administrator role with full system access',
      }).returning();
      
      adminRole = newRole;
      console.log('✓ Admin role created');
      
      // Create ALLOW policies for all resources and actions
      const resources = ['users', 'collections', 'entries', 'assets', 'fields'] as const;
      const actions = [
        'create', 'read', 'update', 'delete',
        'publish', 'unpublish', 'schedule',
        'archive', 'restore', 'draft',
        'ban', 'unban', 'activate', 'deactivate',
        'upload', 'download', 'transform',
        'configure_fields', 'manage_schema'
      ] as const;

      for (const resource of resources) {
        for (const action of actions) {
          // Create a policy for each resource-action combination
          const [policy] = await db.insert(abacPoliciesTable).values({
            name: `admin-${resource}-${action}`,
            description: `Admin full access to ${action} on ${resource}`,
            effect: 'ALLOW',
            priority: 1000, // High priority
            isActive: true,
            resourceType: resource,
            actionType: action,
            ruleConnector: 'AND',
            createdBy: adminUserId,
          }).returning();

          // Assign policy to admin role
          await db.insert(rolePoliciesTable).values({
            roleId: adminRole.id,
            policyId: policy.id,
            assignedBy: adminUserId,
            reason: 'Default admin role permissions',
          });
        }
      }
      
      console.log('✓ Admin policies created and assigned');
    }

    return adminRole;
  } catch (error) {
    console.error('Error ensuring admin role:', error);
    throw error;
  }
}

/**
 * Create a default admin user if it doesn't exist
 */
async function ensureDefaultAdmin() {
  const adminName = Deno.env.get("ADMIN_NAME") || "admin";
  const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "admin123";

  try {
    // Check if admin user already exists
    const existingAdmins = await db.select().from(usersTable).where(eq(usersTable.name, adminName));
    let adminUser = existingAdmins[0];
    
    if (!adminUser) {
      // Create admin user
      const passwordHash = await hashPassword(adminPassword);
      
      const [newUser] = await db.insert(usersTable).values({
        name: adminName,
        passwordHash: passwordHash,
        status: 'ACTIVE',
      }).returning();
      
      adminUser = newUser;
      console.log(`✓ Default admin user created: ${adminName}`);
      console.log(`  Password: ${adminPassword}`);
      console.log(`  ⚠️  Please change the password after first login!`);
    } else {
      console.log(`✓ Admin user '${adminName}' already exists`);
    }

    // Ensure admin role exists and has all permissions
    const adminRole = await ensureAdminRole(adminUser.id);

    // Check if user already has admin role
    const existingUserRoles = await db.select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, adminUser.id));

    const hasAdminRole = existingUserRoles.some(ur => ur.roleId === adminRole.id);

    if (!hasAdminRole) {
      // Assign admin role to admin user
      await db.insert(userRolesTable).values({
        userId: adminUser.id,
        roleId: adminRole.id,
      });
      console.log('✓ Admin role assigned to admin user');
    }
  } catch (error) {
    console.error('Error ensuring default admin user:', error);
  }
}

/**
 * Handle asset proxy requests
 * Streams assets from S3 through the API with proper authentication and ABAC checks
 */
async function handleAssetProxy(req: Request, assetId: string): Promise<Response> {
  try {
    // Fetch asset metadata from database
    const [asset] = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .limit(1);

    if (!asset) {
      return new Response('Asset not found', { status: 404 });
    }

    // Extract and verify auth token if present
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = await verifyAccessToken(token);
        
        // Verify session exists
        const session = await getSession(payload.sub); // sub is sessionId
        if (session) {
          userId = session.userId;
        }
      } catch (error) {
        console.warn('Invalid auth token in asset request:', error);
        // Continue - user might not be authenticated
      }
    }

        // Check ABAC permission
    let hasPermission = false;
    if (userId) {
      // Authenticated user - check specific permission
      hasPermission = await checkPermission({
        userId,
        resource: {
          type: 'assets',
          id: asset.id,
          ownerId: asset.uploadedBy,
        },
        action: 'read',
      });
    } else {
      // Unauthenticated - only allow if asset is marked as public
      hasPermission = asset.isPublic === true;
    }

    if (!hasPermission) {
      return new Response('Forbidden', { status: 403 });
    }

    // Stream asset from S3
    const stream = await downloadFromS3({ key: asset.path });
    
    if (!stream) {
      return new Response('Asset file not found in storage', { status: 404 });
    }

    // Return asset with proper headers
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Disposition': `inline; filename="${asset.filename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'X-Asset-Id': asset.id,
      },
    });
  } catch (error) {
    console.error('Error handling asset proxy request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function main() {
  // Ensure admin user exists before starting server
  await ensureDefaultAdmin();

  const yoga = createYoga<GraphQLContext>({
    schema,
    plugins: [useAuth()],
    multipart: true, // Enable multipart file uploads
  });

  Deno.serve(
    {port: 3000, hostname: '0.0.0.0'},
    async (req) => {
    const url = new URL(req.url);
    
    // Asset proxy route: GET /assets/:id
    const assetMatch = url.pathname.match(/^\/assets\/([a-f0-9-]+)$/);
    if (assetMatch && req.method === 'GET') {
      const assetId = assetMatch[1];
      return await handleAssetProxy(req, assetId);
    }

    // All other requests go to GraphQL
    return yoga.fetch(req);
  });

  console.log(`Server is running at http://localhost:3000/`);
  console.log(`GraphQL endpoint: http://localhost:3000/graphql`);
  console.log(`Asset proxy endpoint: http://localhost:3000/assets/:id`);
}

if (import.meta.main) {
  await main();
}
