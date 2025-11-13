import { boolean, integer, pgEnum, pgTable, timestamp, uuid, varchar, text, primaryKey, foreignKey, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE", "BANNED"]);
export const scopeTypeEnum = pgEnum("scope_type", ["GLOBAL", "COLLECTION_SPECIFIC", "ENTRY_SPECIFIC", "FIELD_SPECIFIC"]);

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),
    creationTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastLoginTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEditTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    status: userStatusEnum().notNull().default('ACTIVE'),
});

// Permission Actions - granular actions for fine-grained control
export const permissionActionEnum = pgEnum("permission_actions", [
    // CRUD operations
    "create", "read", "update", "delete",
    // Publishing workflow
    "publish", "unpublish", "schedule", 
    // Status management
    "archive", "restore", "draft",
    // User management
    "ban", "unban", "activate", "deactivate",
    // Asset operations
    "upload", "download", "transform",
    // Collection management
    "configure_fields", "manage_schema"
]);

// Base resource types
export const baseResourceEnum = pgEnum("base_resources", ["users", "collections", "entries", "assets", "fields"]);

// Permission effect - whether permission grants or denies access
export const permissionEffectEnum = pgEnum("permission_effect", ["ALLOW", "DENY"]);

// Database-native ABAC: Type-safe attribute paths
export const attributePathEnum = pgEnum("attribute_path", [
    // Subject (user) attributes
    "subject.id",
    "subject.role", 
    "subject.status",
    "subject.createdAt",
    
    // Resource attributes - Collections
    "resource.collection.id",
    "resource.collection.slug",
    "resource.collection.createdBy",
    "resource.collection.isLocalized",
    
    // Resource attributes - Entries  
    "resource.entry.id",
    "resource.entry.status",
    "resource.entry.createdBy", 
    "resource.entry.collectionId",
    "resource.entry.locale",
    "resource.entry.publishedAt",
    
    // Resource attributes - Fields
    "resource.field.id", 
    "resource.field.name",
    "resource.field.dataType",
    "resource.field.sensitivityLevel",
    "resource.field.isPii",
    "resource.field.isPublic",
    "resource.field.collectionId",
    
    // Resource attributes - Assets
    "resource.asset.id",
    "resource.asset.uploadedBy",
    "resource.asset.mimeType",
    "resource.asset.fileSize",
    
    // Environmental/Context attributes
    "environment.currentTime",
    "environment.ipAddress", 
    "environment.userAgent",
    
    // Action attributes
    "action.type"
]);

export const operatorEnum = pgEnum("operator", [
    "eq",              // equals
    "ne",              // not equals  
    "in",              // in array
    "not_in",          // not in array
    "gt",              // greater than
    "gte",             // greater than or equal
    "lt",              // less than
    "lte",             // less than or equal
    "contains",        // string/array contains
    "starts_with",     // string starts with
    "ends_with",       // string ends with
    "is_null",         // is null
    "is_not_null",     // is not null
    "regex"            // regex match
]);

export const valueTypeEnum = pgEnum("value_type", [
    "string",
    "number", 
    "boolean",
    "uuid",
    "datetime",
    "array"
]);

export const logicalOperatorEnum = pgEnum("logical_operator", ["AND", "OR"]);

// Roles for grouping permissions
export const rolesTable = pgTable("roles", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 1024 }),
    creationTime: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEditTime: timestamp({ mode: "date" }).notNull().defaultNow(),
});

// ABAC Policies - The main policy definition table
export const abacPoliciesTable = pgTable("abac_policies", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text(),
    
    // Policy metadata
    effect: permissionEffectEnum().notNull(), // ALLOW or DENY
    priority: integer().notNull().default(100), // Higher number = higher priority for conflict resolution
    isActive: boolean().notNull().default(true),
    
    // What this policy applies to
    resourceType: baseResourceEnum().notNull(), // collections, entries, fields, assets
    actionType: permissionActionEnum().notNull(), // create, read, update, delete, etc.
    
    // Policy evaluation logic connector (how rules within this policy are combined)
    ruleConnector: logicalOperatorEnum().notNull().default('AND'), // All rules must match (AND) or any rule (OR)
    
    // Metadata
    createdBy: uuid().notNull().references(() => usersTable.id),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    lastEvaluatedAt: timestamp({ mode: "date" }),
}, (table) => ({
    resourceActionIndex: index().on(table.resourceType, table.actionType),
    priorityIndex: index().on(table.priority),
    activeIndex: index().on(table.isActive),
    nameIndex: index().on(table.name),
}));

// ABAC Policy Rules - The individual conditions within each policy
export const abacPolicyRulesTable = pgTable("abac_policy_rules", {
    id: uuid().primaryKey().defaultRandom(),
    policyId: uuid().notNull().references(() => abacPoliciesTable.id, { onDelete: "cascade" }),
    
    // The condition definition
    attributePath: attributePathEnum().notNull(), // What attribute to check (e.g., "subject.role")
    operator: operatorEnum().notNull(), // How to compare (eq, in, gt, etc.)
    expectedValue: text().notNull(), // What value to compare against (stored as JSON)
    valueType: valueTypeEnum().notNull(), // Type of the expected value for proper parsing
    
    // Rule metadata
    description: varchar({ length: 512 }),
    isActive: boolean().notNull().default(true),
    order: integer().notNull().default(0), // Order of evaluation within the policy
    
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
}, (table) => ({
    policyRuleIndex: index().on(table.policyId, table.order),
    attributeIndex: index().on(table.attributePath),
    activeRulesIndex: index().on(table.policyId, table.isActive),
}));

// User-Role assignments
export const userRolesTable = pgTable("user_roles", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    roleId: uuid().notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
}, (table) => ({
    uniqueUserRole: unique().on(table.userId, table.roleId),
}));

// ABAC Role-Policy assignments
export const rolePoliciesTable = pgTable("role_policies", {
    id: uuid().primaryKey().defaultRandom(),
    roleId: uuid().notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
    policyId: uuid().notNull().references(() => abacPoliciesTable.id, { onDelete: "cascade" }),
    assignedBy: uuid().notNull().references(() => usersTable.id),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
    reason: varchar({ length: 512 }), // Why this policy was assigned to this role
}, (table) => ({
    rolePolicyIndex: index().on(table.roleId, table.policyId),
    expirationIndex: index().on(table.expiresAt),
    uniqueRolePolicy: unique().on(table.roleId, table.policyId),
}));

// ABAC Direct user-policy assignments (for exceptions or specific grants)
export const userPoliciesTable = pgTable("user_policies", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    policyId: uuid().notNull().references(() => abacPoliciesTable.id, { onDelete: "cascade" }),
    assignedBy: uuid().notNull().references(() => usersTable.id),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
    reason: varchar({ length: 512 }), // Audit trail - why this exception was made
}, (table) => ({
    userPolicyIndex: index().on(table.userId, table.policyId),
    expirationIndex: index().on(table.expiresAt),
    uniqueUserPolicy: unique().on(table.userId, table.policyId),
}));


// Resource ownership tracking for dynamic permissions
export const resourceOwnershipsTable = pgTable("resource_ownerships", {
    id: uuid().primaryKey().defaultRandom(),
    resourceType: baseResourceEnum().notNull(),
    resourceId: uuid().notNull(), // Generic resource ID
    ownerId: uuid().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    ownershipType: varchar({ length: 50 }).notNull().default('CREATOR'), // CREATOR, ASSIGNED, INHERITED
    assignedBy: uuid().references(() => usersTable.id),
    assignedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }),
}, (table) => ({
    resourceOwnerIndex: index().on(table.resourceType, table.resourceId, table.ownerId),
    ownerResourceIndex: index().on(table.ownerId, table.resourceType),
    expirationIndex: index().on(table.expiresAt),
}));

// ABAC Policy evaluation cache for performance optimization
export const abacEvaluationCacheTable = pgTable("abac_evaluation_cache", {
    id: uuid().primaryKey().defaultRandom(),
    
    // Request context
    userId: uuid().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    resourceType: baseResourceEnum().notNull(),
    resourceId: uuid().notNull(),
    actionType: permissionActionEnum().notNull(),
    fieldId: uuid().references(() => fieldsTable.id, { onDelete: "cascade" }), // For field-specific checks
    
    // Evaluation result
    decision: permissionEffectEnum().notNull(), // Final ALLOW/DENY decision
    matchingPolicyIds: uuid().array().notNull(), // Which policies matched
    evaluationTimeMs: integer().notNull(), // How long evaluation took
    
    // Cache metadata
    computedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: "date" }).notNull(), // Cache TTL
    contextChecksum: varchar({ length: 64 }).notNull(), // Hash of request context for cache invalidation
    policyVersions: text().notNull(), // JSON of policy versions when cached
}, (table) => ({
    userResourceActionIndex: index().on(table.userId, table.resourceType, table.resourceId, table.actionType),
    fieldEvaluationIndex: index().on(table.userId, table.fieldId, table.actionType),
    expirationIndex: index().on(table.expiresAt),
    contextChecksumIndex: index().on(table.contextChecksum),
    decisionIndex: index().on(table.decision),
}));

// ABAC Policy evaluation audit log for compliance and debugging
export const abacAuditTable = pgTable("abac_audit", {
    id: uuid().primaryKey().defaultRandom(),
    
    // Request details
    userId: uuid().notNull().references(() => usersTable.id),
    requestedAction: permissionActionEnum().notNull(),
    resourceType: baseResourceEnum().notNull(),
    resourceId: uuid().notNull(),
    fieldId: uuid().references(() => fieldsTable.id), // For field-specific requests
    
    // Evaluation details
    decision: permissionEffectEnum().notNull(), // Final decision
    evaluatedPolicyIds: uuid().array().notNull(), // All policies that were evaluated
    matchingPolicyIds: uuid().array().notNull(), // Policies that matched conditions
    decisionReason: text().notNull(), // Human-readable explanation of why decision was made
    evaluationTimeMs: integer().notNull(), // Performance tracking
    
    // Context
    requestContext: text().notNull(), // JSON of all attributes used in evaluation
    ipAddress: varchar({ length: 45 }),
    userAgent: varchar({ length: 512 }),
    sessionId: varchar({ length: 255 }),
    
    // Metadata
    timestamp: timestamp({ mode: "date" }).notNull().defaultNow(),
}, (table) => ({
    userTimestampIndex: index().on(table.userId, table.timestamp),
    resourceAuditIndex: index().on(table.resourceType, table.resourceId, table.timestamp),
    decisionIndex: index().on(table.decision, table.timestamp),
    timestampIndex: index().on(table.timestamp),
    performanceIndex: index().on(table.evaluationTimeMs),
}));

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

// Fields table with enhanced permission support
export const fieldsTable = pgTable("fields", {
    id: uuid().primaryKey().defaultRandom(),
    collectionId: uuid().notNull().references(() => collectionsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    label: varchar({ length: 255 }), // Display label for UI
    description: text(), // Field description for documentation
    dataType: dataTypesEnum().notNull(),
    isRequired: boolean().notNull().default(false),
    isUnique: boolean().notNull().default(false),
    
    // Permission-related settings
    isPublic: boolean().notNull().default(true), // Whether field is publicly readable
    isPii: boolean().notNull().default(false), // Contains personally identifiable information
    isEncrypted: boolean().notNull().default(false), // Should be encrypted at rest
    sensitivityLevel: varchar({ length: 20 }).notNull().default('PUBLIC'), // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    
    // Validation and constraints
    validationRules: text(), // JSON schema for validation
    defaultValue: text(), // Default value as JSON
    helpText: varchar({ length: 1024 }), // Help text for editors
    
    createdBy: uuid().notNull().references(() => usersTable.id),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
}, (table) => ({
    collectionFieldIndex: index().on(table.collectionId, table.name),
    sensitivityIndex: index().on(table.sensitivityLevel),
    piiIndex: index().on(table.isPii),
    uniqueFieldName: unique().on(table.collectionId, table.name),
}));

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
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});

// Entry text values table
export const entryTextsTable = pgTable("entry_texts", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: text(),
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});

// Entry boolean values table
export const entryBooleansTable = pgTable("entry_booleans", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: boolean(),
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});

// Entry number values table
export const entryNumbersTable = pgTable("entry_numbers", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: integer(),
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});

// Entry datetime values table
export const entryDateTimesTable = pgTable("entry_datetimes", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: timestamp({ mode: "date" }),
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
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
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});

// Entry JSON values table (for complex objects, arrays, etc.)
export const entryJsonDataTable = pgTable("entry_json_data", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    value: text().notNull(), // JSON stored as text
    valueType: varchar({ length: 50 }).notNull(), // 'object', 'text_list', 'number_list', 'json'
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
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
    isPublic: boolean().notNull().default(false), // Whether asset is publicly accessible without auth
});

// Entry asset values table (for file/media references)
export const entryAssetsTable = pgTable("entry_assets", {
    entryId: uuid().notNull().references(() => entriesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldId: uuid().notNull().references(() => fieldsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    assetId: uuid().notNull().references(() => assetsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sortOrder: integer().notNull().default(0), // For multiple assets per field
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    searchHash: varchar({ length: 64 }), // Hash for searching encrypted values
});


