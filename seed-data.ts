import 'dotenv/config';
import { db } from './src/db/index.js';
import { 
  collectionsTable, 
  fieldsTable, 
  entriesTable,
  entryTextsTable,
  entryAssetsTable,
  assets,
  usersTable
} from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function seedData() {
  console.log('🌱 Seeding database...');

  try {
    // Create a user first
    const [user] = await db.insert(usersTable).values({
      name: 'Admin User',
      passwordHash: 'hashed_password_here',
    }).returning();

    console.log('✅ Created user:', user!.id);

    // Create a test collection
    const [collection] = await db.insert(collectionsTable).values({
      createdBy: user!.id,
      name: 'test',
      slug: 'test-collection',
      description: 'A test collection for demonstrating the GraphQL API',
    }).returning();

    console.log('✅ Created collection:', collection!.name);

    // Create fields for the collection
    const [textField] = await db.insert(fieldsTable).values({
      collectionId: collection!.id,
      name: 'fieldName',
      label: 'Field Name',
      dataType: 'text',
      isRequired: false,
      isUnique: false,
    }).returning();

    const [assetField] = await db.insert(fieldsTable).values({
      collectionId: collection!.id,
      name: 'test2',
      label: 'Test Asset Field',
      dataType: 'asset',
      isRequired: false,
      isUnique: false,
    }).returning();

    console.log('✅ Created fields:', textField!.name, assetField!.name);

    // Create sample entries
    const [entry1] = await db.insert(entriesTable).values({
      createdBy: user!.id,
      collectionId: collection!.id,
      name: 'Test Entry 1',
      slug: 'test-entry-1',
      status: 'PUBLISHED',
    }).returning();

    const [entry2] = await db.insert(entriesTable).values({
      createdBy: user!.id,
      collectionId: collection!.id,
      name: 'Test Entry 2',
      slug: 'test-entry-2',
      status: 'PUBLISHED',
    }).returning();

    console.log('✅ Created entries:', entry1!.name, entry2!.name);

    // Add text field values
    await db.insert(entryTextsTable).values([
      {
        entryId: entry1!.id,
        fieldId: textField!.id,
        value: 'test', // This matches the filter in your query
      },
      {
        entryId: entry2!.id,
        fieldId: textField!.id,
        value: 'other value',
      },
    ]);

    console.log('✅ Created text field values');

    // Create a sample asset
    const [asset] = await db.insert(assets).values({
      filename: 'sample.jpg',
      originalFilename: 'sample.jpg',
      mimeType: 'image/jpeg',
      fileSize: 123456,
      url: 'https://example.com/sample.jpg',
      uploadedBy: user!.id,
      alt: 'Sample image',
      caption: 'This is a sample image',
    }).returning();

    // Link asset to entries
    await db.insert(entryAssetsTable).values([
      {
        entryId: entry1!.id,
        fieldId: assetField!.id,
        assetId: asset!.id,
        sortOrder: 0,
      },
      {
        entryId: entry2!.id,
        fieldId: assetField!.id,
        assetId: asset!.id,
        sortOrder: 0,
      },
    ]);

    console.log('✅ Created asset and linked to entries');
    console.log('🎉 Database seeded successfully!');
    
    console.log('\n📝 You can now test this GraphQL query:');
    console.log(`
query {
  collection(name: "test") {
    entries {
      field(name: "fieldName", filter: {eq: "test"}) {
        ... on Text {
          text
        }
      }
      field(name: "test2") {
        ... on Asset {
          url
        }
      }
    }
  }
}
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seeding
seedData();
