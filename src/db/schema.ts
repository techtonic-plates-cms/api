import { boolean, integer, pgEnum, pgTable, timestamp, uuid, varchar, text, primaryKey, foreignKey, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE", "BANNED"]);
export const scopeTypeEnum = pgEnum("scope_type", ["GLOBAL", "RESOURCE_SPECIFIC", "FIELD_SPECIFIC"]);

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),
    creationTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastLoginTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEditTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    status: userStatusEnum().notNull().default('ACTIVE'),
});

// Permission Actions (e.g., 'read', 'write', 'delete', 'execute')
export const permissionActionEnum = pgEnum("permission_actions", ["create", "read", "update", "delete", "publish", "unpublish", "archive", "restore", "ban", "unban"]);

// Permission Resources (e.g., 'users', 'posts', 'comments', 'api.users.profile')
export const permissionResourceEnum = pgEnum("permission_resources", ["users", "collections", "entries", "assets"]);

// Roles for grouping permissions
export const rolesTable = pgTable("roles", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 1024 }),
    creationTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEditTime: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Permissions with scopes - the core of your permission system
export const permissionsTable = pgTable("permissions", {
    id: uuid().primaryKey().defaultRandom(),
    scopeType: scopeTypeEnum().notNull().default('GLOBAL'),
    resource: permissionResourceEnum().notNull(), 
    action: permissionActionEnum().notNull(),
    fieldScope: text().array(),
    description: varchar({ length: 1024 }),
    creationTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEditTime: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// User-Role assignments
export const userRolesTable = pgTable("user_roles", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull(),
    roleId: uuid().notNull(),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
});

// Role-Permission assignments
export const rolePermissionsTable = pgTable("role_permissions", {
    id: uuid().primaryKey().defaultRandom(),
    roleId: uuid().notNull(),
    permissionId: uuid().notNull(),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Direct user permissions (for exceptions or specific grants)
export const userPermissionsTable = pgTable("user_permissions", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull(),
    permissionId: uuid().notNull(),
    granted: boolean().notNull().default(true), // true = grant, false = deny (for exceptions)
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
});

// Collection visibility and entry status enums
export const entryStatusEnum = pgEnum("entry_status", ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"]);
export const localeEnum = pgEnum("locale", ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar", "ru"]);

// Data types enum for fields - organized by storage strategy
export const dataTypesEnum = pgEnum("data_types", [
    // Simple types - dedicated tables
    "text", 
    "typst_text", 
    "boolean", 
    "number", 
    "date_time", 
    "relation",
    
    // Complex types - JSON storage
    "object",
    "text_list", 
    "number_list",
    
    // Special types
    "asset", // File/media references
    "rich_text", // HTML/markdown content
    "json" // Free-form JSON data
]);

// Collections table
export const collectionsTable = pgTable("collections", {
    id: uuid().primaryKey().defaultRandom(),
    createdBy: uuid().notNull().references(() => usersTable.id),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(), // URL-friendly identifier
    description: text(), // Rich description of the collection
    icon: varchar({ length: 100 }), // Icon identifier
    color: varchar({ length: 7 }), // Hex color code
    defaultLocale: localeEnum().notNull().default('en'), // Default language for this collection
    supportedLocales: varchar({ length: 255 }).array().notNull().default(['en']), // Supported languages
    isLocalized: boolean().notNull().default(false), // Whether this collection supports multiple languages
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Fields table
export const fieldsTable = pgTable("fields", {
    id: uuid().primaryKey().defaultRandom(),
    collectionId: uuid().notNull().references(() => collectionsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    label: varchar({ length: 255 }), // Display label for UI
    dataType: dataTypesEnum().notNull(),
    isRequired: boolean().notNull().default(false),
    isUnique: boolean().notNull().default(false),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Entries table
export const entriesTable = pgTable("entries", {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    publishedAt: timestamp({ mode: "date" }), // When it was published
    createdBy: uuid().notNull().references(() => usersTable.id),
    collectionId: uuid().notNull().references(() => collectionsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }), // URL-friendly identifier for the entry
    status: entryStatusEnum().notNull().default('DRAFT'),
    locale: localeEnum().notNull().default('en'), // Language of this entry version
    defaultLocale: localeEnum().notNull().default('en'), // Default language for this entry group
});

// Entry relation values table
export const entryRelationsTable = pgTable("entry_relations", {
    fromEntryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    toEntryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Entry typst text values table
export const entryTypstTextsTable = pgTable("entry_typst_texts", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    raw: text().notNull(),
    rendered: text().notNull(),
});

// Entry text values table
export const entryTextsTable = pgTable("entry_texts", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: text(),
});

// Entry boolean values table
export const entryBooleansTable = pgTable("entry_booleans", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: boolean(),
});

// Entry number values table
export const entryNumbersTable = pgTable("entry_numbers", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: integer(),
});

// Entry datetime values table
export const entryDateTimesTable = pgTable("entry_datetimes", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: timestamp({ mode: "date" }),
});

// Entry object values table - DEPRECATED: Use entryJsonValuesTable instead
// export const entryObjectValuesTable = pgTable("entry_object_values", {
//     entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
//     value: text(), // JSON stored as text
// });

// Entry text list values table - DEPRECATED: Use entryJsonValuesTable instead  
// export const entryTextListValuesTable = pgTable("entry_text_list_values", {
//     entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
//     value: text().array(),
// });

// Entry number list values table - DEPRECATED: Use entryJsonValuesTable instead
// export const entryNumberListValuesTable = pgTable("entry_number_list_values", {
//     entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
//     value: integer().array(),
// });

// Entry rich text values table (for HTML/Markdown)
export const entryRichTextsTable = pgTable("entry_rich_texts", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    raw: text().notNull(), // Raw markdown/HTML
    rendered: text().notNull(), // Processed HTML
    format: varchar({ length: 20 }).notNull().default('markdown'), // 'markdown', 'html', 'prosemirror'
});

// Entry JSON values table (for complex objects, arrays, etc.)
export const entryJsonDataTable = pgTable("entry_json_data", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: text().notNull(), // JSON stored as text
    valueType: varchar({ length: 50 }).notNull(), // 'object', 'text_list', 'number_list', 'json'
});

// Assets table for file/media management
export const assetsTable = pgTable("assets", {
    id: uuid().primaryKey().defaultRandom(),
    filename: varchar({ length: 255 }).notNull(),
    mimeType: varchar({ length: 100 }).notNull(),
    fileSize: integer().notNull(),
    path: varchar({ length: 1024 }).notNull(),
    uploadedBy: uuid().notNull().references(() => usersTable.id),
    uploadedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    alt: varchar({ length: 500 }), // Alt text for accessibility
    caption: text(), // Caption/description
});

// Entry asset values table (for file/media references)
export const entryAssetsTable = pgTable("entry_assets", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    assetId: uuid().notNull().references(() => assetsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sortOrder: integer().notNull().default(0), // For multiple assets per field
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// Entry JSON values table (for complex objects, arrays, etc.)
export const entryJsonData = pgTable("entry_json_data", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: text().notNull(), // JSON stored as text
    valueType: varchar({ length: 50 }).notNull(), // 'object', 'text_list', 'number_list', 'json'
});

// Assets table for file/media management
export const assets = pgTable("assets", {
    id: uuid().primaryKey().defaultRandom(),
    filename: varchar({ length: 255 }).notNull(),
    originalFilename: varchar({ length: 255 }).notNull(),
    mimeType: varchar({ length: 100 }).notNull(),
    fileSize: integer().notNull(),
    width: integer(), // For images
    height: integer(), // For images
    duration: integer(), // For videos/audio in seconds
    url: varchar({ length: 1024 }).notNull(),
    thumbnailUrl: varchar({ length: 1024 }),
    uploadedBy: uuid().notNull().references(() => usersTable.id),
    uploadedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    alt: varchar({ length: 500 }), // Alt text for accessibility
    caption: text(), // Caption/description
});

// Entry asset values table (for file/media references)
export const entryAssets = pgTable("entry_assets", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    assetId: uuid().notNull().references(() => assets.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sortOrder: integer().notNull().default(0), // For multiple assets per field
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

