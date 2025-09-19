import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { AppContext } from '../index';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

/**
 * Account management operations for the authenticated user.
 * Provides a clean, organized way to manage user account settings.
 */
export type AccountMutations = {
  __typename?: 'AccountMutations';
  /** Change account password */
  changePassword: Scalars['Boolean']['output'];
  /** Deactivate this account */
  deactivate: Scalars['Boolean']['output'];
  /** Update profile information (username, etc.) */
  updateProfile: User;
};


/**
 * Account management operations for the authenticated user.
 * Provides a clean, organized way to manage user account settings.
 */
export type AccountMutationsChangePasswordArgs = {
  input: ChangeMyPasswordInput;
};


/**
 * Account management operations for the authenticated user.
 * Provides a clean, organized way to manage user account settings.
 */
export type AccountMutationsDeactivateArgs = {
  confirmUsername: Scalars['String']['input'];
};


/**
 * Account management operations for the authenticated user.
 * Provides a clean, organized way to manage user account settings.
 */
export type AccountMutationsUpdateProfileArgs = {
  input: UpdateMyProfileInput;
};

/** Types of actions that can be performed on resources. */
export enum ActionType {
  Activate = 'activate',
  Archive = 'archive',
  Ban = 'ban',
  ConfigureFields = 'configure_fields',
  Create = 'create',
  Deactivate = 'deactivate',
  Delete = 'delete',
  Download = 'download',
  Draft = 'draft',
  ManageSchema = 'manage_schema',
  Publish = 'publish',
  Read = 'read',
  Restore = 'restore',
  Schedule = 'schedule',
  Transform = 'transform',
  Unban = 'unban',
  Unpublish = 'unpublish',
  Update = 'update',
  Upload = 'upload'
}

/**
 * Administrative operations for managing users, roles, and policies.
 * Requires administrative privileges to access these operations.
 */
export type AdminMutations = {
  __typename?: 'AdminMutations';
  /** Access policy management operations */
  policies: PolicyManagementMutations;
  /** Access role management operations */
  roles: RoleManagementMutations;
  /** Access user management operations */
  users: UserManagementMutations;
};

/**
 * File asset with metadata and storage information.
 * Represents uploaded files like images, documents, videos, etc.
 */
export type Asset = {
  __typename?: 'Asset';
  /** Alternative text for accessibility */
  alt?: Maybe<Scalars['String']['output']>;
  /** Optional caption or description */
  caption?: Maybe<Scalars['String']['output']>;
  /** File size in bytes */
  fileSize: Scalars['Int']['output'];
  /** Original filename when uploaded */
  filename: Scalars['String']['output'];
  /** Unique identifier for the asset */
  id: Scalars['ID']['output'];
  /** MIME type of the file (e.g., image/jpeg, application/pdf) */
  mimeType: Scalars['String']['output'];
  /** Storage path or URL to the file */
  path: Scalars['String']['output'];
};

/** Input for ASSET field values. */
export type AssetFieldInput = {
  /** UUID of the asset to reference */
  assetId: Scalars['ID']['input'];
};

/**
 * Filtering options for asset field values.
 * Allows filtering on asset metadata properties.
 */
export type AssetFilter = {
  /** Filter by alt text */
  alt?: InputMaybe<TextFilter>;
  /** Filter by caption */
  caption?: InputMaybe<TextFilter>;
  /** Filter by file size in bytes */
  fileSize?: InputMaybe<NumberFilter>;
  /** Filter by filename */
  filename?: InputMaybe<TextFilter>;
  /** Filter by MIME type */
  mimeType?: InputMaybe<TextFilter>;
};

/** Result of policy assignment operation. */
export type AssignPolicyResult = {
  __typename?: 'AssignPolicyResult';
  /** Success or error message */
  message: Scalars['String']['output'];
  /** Success status */
  success: Scalars['Boolean']['output'];
};

/** Result of role assignment operation. */
export type AssignRoleResult = {
  __typename?: 'AssignRoleResult';
  /** Success message */
  message: Scalars['String']['output'];
  /** The assigned role */
  role: Role;
  /** The updated user */
  user: User;
};

/** Input for BOOLEAN field values. */
export type BooleanFieldInput = {
  /** Boolean value */
  value: Scalars['Boolean']['input'];
};

/** Filtering options for boolean field values. */
export type BooleanFilter = {
  /** Exactly equal to (true or false) */
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  /** Not equal to */
  ne?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean value container for true/false fields. */
export type BooleanValue = {
  __typename?: 'BooleanValue';
  /** The boolean value */
  value?: Maybe<Scalars['Boolean']['output']>;
};

/** Input for changing current user's password. */
export type ChangeMyPasswordInput = {
  /** Current password for verification */
  currentPassword: Scalars['String']['input'];
  /** New password */
  newPassword: Scalars['String']['input'];
};

/**
 * A content collection that groups related entries together with a defined schema.
 * Collections serve as containers for structured data with customizable fields.
 */
export type Collection = {
  __typename?: 'Collection';
  /** ISO 8601 timestamp when the collection was created */
  createdAt?: Maybe<Scalars['String']['output']>;
  /** Username or ID of the user who created this collection */
  createdBy?: Maybe<Scalars['String']['output']>;
  /** Optional description explaining the purpose of this collection */
  description?: Maybe<Scalars['String']['output']>;
  /** All entries belonging to this collection, with optional filtering */
  entries: Array<Entry>;
  /** Schema definition - list of fields that define the structure of entries in this collection */
  fields: Array<Field>;
  /** Unique identifier for the collection */
  id: Scalars['ID']['output'];
  /** Human-readable name of the collection */
  name: Scalars['String']['output'];
  /** URL-friendly identifier used for routing and references */
  slug: Scalars['String']['output'];
  /** ISO 8601 timestamp when the collection was last modified */
  updatedAt?: Maybe<Scalars['String']['output']>;
};


/**
 * A content collection that groups related entries together with a defined schema.
 * Collections serve as containers for structured data with customizable fields.
 */
export type CollectionEntriesArgs = {
  filter?: InputMaybe<EntryFilter>;
};

/**
 * Content management operations for collections and entries.
 * Handles all content creation, modification, and organization.
 */
export type ContentMutations = {
  __typename?: 'ContentMutations';
  /** Create a new collection with schema definition */
  createCollection: Collection;
  /** Create a new entry in a collection */
  createEntry: Entry;
};


/**
 * Content management operations for collections and entries.
 * Handles all content creation, modification, and organization.
 */
export type ContentMutationsCreateCollectionArgs = {
  input: CreateCollectionInput;
};


/**
 * Content management operations for collections and entries.
 * Handles all content creation, modification, and organization.
 */
export type ContentMutationsCreateEntryArgs = {
  input: CreateEntryInput;
};

/**
 * Input for creating a new collection with its field definitions.
 * Defines the collection metadata and schema structure.
 */
export type CreateCollectionInput = {
  /** Optional color code for UI theming */
  color?: InputMaybe<Scalars['String']['input']>;
  /** Default locale for content (defaults to 'en') */
  defaultLocale?: InputMaybe<Scalars['String']['input']>;
  /** Optional description explaining the collection's purpose */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Field definitions that define the collection's schema */
  fields: Array<CreateFieldInput>;
  /** Optional icon identifier for UI display */
  icon?: InputMaybe<Scalars['String']['input']>;
  /** Whether this collection supports multiple languages (defaults to false) */
  isLocalized?: Scalars['Boolean']['input'];
  /** Human-readable name for the collection */
  name: Scalars['String']['input'];
  /** URL-friendly identifier for the collection */
  slug: Scalars['String']['input'];
  /** List of supported locales for internationalization (defaults to ['en']) */
  supportedLocales?: InputMaybe<Array<Scalars['String']['input']>>;
};

/**
 * Represents a field value for creating an entry.
 * The field name must correspond to a field defined in the collection schema.
 * The value input must match the field's DataType.
 */
export type CreateEntryFieldInput = {
  /** Name of the field as defined in the collection schema */
  field: Scalars['String']['input'];
  /** Typed value input that must match the field's DataType */
  value: CreateEntryFieldValueInput;
};

/**
 * Union of all possible field value input types.
 * Use the input type that matches your field's DataType.
 */
export type CreateEntryFieldValueInput =
  /** Value for ASSET fields */
  { asset: AssetFieldInput; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for BOOLEAN fields */
  { asset?: never; boolean: BooleanFieldInput; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for DATE_TIME fields */
  { asset?: never; boolean?: never; dateTime: DateTimeFieldInput; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for JSON fields */
  { asset?: never; boolean?: never; dateTime?: never; json: JsonFieldInput; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for NUMBER fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number: NumberFieldInput; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for NUMBER_LIST fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList: NumberListFieldInput; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for OBJECT fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object: ObjectFieldInput; relation?: never; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for RELATION fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation: RelationFieldInput; richText?: never; text?: never; textList?: never; typstText?: never; }
  |  /** Value for RICH_TEXT fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText: RichTextFieldInput; text?: never; textList?: never; typstText?: never; }
  |  /** Value for TEXT fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text: TextFieldInput; textList?: never; typstText?: never; }
  |  /** Value for TEXT_LIST fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList: TextListFieldInput; typstText?: never; }
  |  /** Value for TYPST_TEXT fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; numberList?: never; object?: never; relation?: never; richText?: never; text?: never; textList?: never; typstText: TypstTextFieldInput; };

/**
 * Input for creating a new entry in a collection.
 * Defines the entry metadata and field values.
 */
export type CreateEntryInput = {
  /** Name of the collection this entry belongs to */
  collectionName: Scalars['String']['input'];
  /** Default locale for this entry group (defaults to 'en') */
  defaultLocale?: InputMaybe<Scalars['String']['input']>;
  /** Field values for this entry */
  fields: Array<CreateEntryFieldInput>;
  /** Locale for this entry (defaults to 'en') */
  locale?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable name or title of the entry */
  name: Scalars['String']['input'];
  /** Optional URL-friendly identifier for the entry */
  slug?: InputMaybe<Scalars['String']['input']>;
  /** Entry status (defaults to 'DRAFT') */
  status?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Input for creating a new field within a collection.
 * Defines the structure and constraints for the field.
 */
export type CreateFieldInput = {
  /** Data type that this field will store */
  dataType: DataType;
  /** Whether the field must have a value (defaults to false) */
  isRequired?: Scalars['Boolean']['input'];
  /** Whether field values must be unique across entries (defaults to false) */
  isUnique?: Scalars['Boolean']['input'];
  /** Human-readable display label */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Technical name for the field (used in API calls) */
  name: Scalars['String']['input'];
};

/** Input for creating a new ABAC policy. */
export type CreatePolicyInput = {
  /** Type of action this policy controls */
  actionType: ActionType;
  /** Description of what this policy controls */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Whether the policy allows or denies access */
  effect: PolicyEffect;
  /** Name for the new policy */
  name: Scalars['String']['input'];
  /** Priority for conflict resolution */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** Type of resource this policy applies to */
  resourceType: ResourceType;
  /** How rules are combined (defaults to AND) */
  ruleConnector?: InputMaybe<LogicalOperator>;
  /** Rules that define the conditions */
  rules: Array<CreatePolicyRuleInput>;
};

/** Input for creating a policy rule. */
export type CreatePolicyRuleInput = {
  /** Attribute path to check */
  attributePath: Scalars['String']['input'];
  /** Description of the rule */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Expected value for comparison */
  expectedValue: Scalars['String']['input'];
  /** Comparison operator */
  operator: RuleOperator;
  /** Order of evaluation (defaults to 0) */
  order?: InputMaybe<Scalars['Int']['input']>;
  /** Type of the expected value */
  valueType: ValueType;
};

/** Input for creating a new role. */
export type CreateRoleInput = {
  /** Description of the role's purpose */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Name for the new role */
  name: Scalars['String']['input'];
};

/** Input for creating a new user. */
export type CreateUserInput = {
  /** Username for the new user */
  name: Scalars['String']['input'];
  /** Password for the new user (will be hashed) */
  password: Scalars['String']['input'];
  /** Initial status for the user account */
  status?: InputMaybe<UserStatus>;
};

/** Result of user creation operation. */
export type CreateUserResult = {
  __typename?: 'CreateUserResult';
  /** Success message */
  message: Scalars['String']['output'];
  /** The created user */
  user: User;
};

/**
 * Supported data types for collection fields.
 * Each type defines how data is stored, validated, and queried.
 */
export enum DataType {
  /** File upload with metadata */
  Asset = 'ASSET',
  /** True/false boolean value */
  Boolean = 'BOOLEAN',
  /** ISO 8601 date and time string */
  DateTime = 'DATE_TIME',
  /** Arbitrary JSON data with type information */
  Json = 'JSON',
  /** Numeric integer value */
  Number = 'NUMBER',
  /** Array of numeric values */
  NumberList = 'NUMBER_LIST',
  /** Complex nested object structure */
  Object = 'OBJECT',
  /** Reference to another entry in the system */
  Relation = 'RELATION',
  /** Formatted text with markup (HTML, Markdown, etc.) */
  RichText = 'RICH_TEXT',
  /** Plain text content */
  Text = 'TEXT',
  /** Array of text strings */
  TextList = 'TEXT_LIST',
  /** Typst markup text with raw and rendered versions */
  TypstText = 'TYPST_TEXT'
}

/** Date and time value container. */
export type DateTime = {
  __typename?: 'DateTime';
  /** ISO 8601 formatted date/time string */
  value?: Maybe<Scalars['String']['output']>;
};

/** Input for DATE_TIME field values. */
export type DateTimeFieldInput = {
  /** ISO 8601 formatted date/time string */
  value: Scalars['String']['input'];
};

/**
 * Filtering options for date/time field values.
 * All dates should be provided as ISO 8601 strings.
 */
export type DateTimeFilter = {
  /** Exactly equal to this date/time */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** After this date/time */
  gt?: InputMaybe<Scalars['String']['input']>;
  /** On or after this date/time */
  gte?: InputMaybe<Scalars['String']['input']>;
  /** Before this date/time */
  lt?: InputMaybe<Scalars['String']['input']>;
  /** On or before this date/time */
  lte?: InputMaybe<Scalars['String']['input']>;
  /** Not equal to this date/time */
  ne?: InputMaybe<Scalars['String']['input']>;
};

/**
 * A single record or content item within a collection.
 * Entries contain the actual data values that conform to their collection's schema.
 */
export type Entry = {
  __typename?: 'Entry';
  /** ISO 8601 timestamp when the entry was created */
  createdAt: Scalars['String']['output'];
  /** Retrieve the value of a specific field by name, with optional filtering */
  field?: Maybe<FieldValue>;
  /** Unique identifier for the entry */
  id: Scalars['ID']['output'];
  /** Human-readable name or title of the entry */
  name: Scalars['String']['output'];
  /** Optional URL-friendly identifier for the entry */
  slug?: Maybe<Scalars['String']['output']>;
  /** Current status of the entry (e.g., draft, published, archived) */
  status: Scalars['String']['output'];
  /** ISO 8601 timestamp when the entry was last modified */
  updatedAt: Scalars['String']['output'];
};


/**
 * A single record or content item within a collection.
 * Entries contain the actual data values that conform to their collection's schema.
 */
export type EntryFieldArgs = {
  filter?: InputMaybe<FieldFilter>;
  name: Scalars['String']['input'];
};

/**
 * Filtering options for entries within a collection.
 * Allows filtering by basic entry properties.
 */
export type EntryFilter = {
  /** Filter by entry name (exact match) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Filter by entry status */
  status?: InputMaybe<Scalars['String']['input']>;
};

/**
 * A field definition that specifies the structure and constraints for data in a collection.
 * Fields define what types of data can be stored and how they should be validated.
 */
export type Field = {
  __typename?: 'Field';
  /** The data type that this field accepts */
  dataType: DataType;
  /** Unique identifier for the field */
  id: Scalars['ID']['output'];
  /** Whether this field must have a value when creating or updating entries */
  isRequired: Scalars['Boolean']['output'];
  /** Whether values for this field must be unique across all entries in the collection */
  isUnique: Scalars['Boolean']['output'];
  /** Human-readable display label for the field */
  label?: Maybe<Scalars['String']['output']>;
  /** Technical name of the field, used for data storage and API access */
  name: Scalars['String']['output'];
};

/**
 * Unified filter input that can contain filters for any field type.
 * Only the filter matching the field's data type will be applied.
 */
export type FieldFilter =
  /** Filter for asset fields */
  { asset: AssetFilter; boolean?: never; dateTime?: never; json?: never; number?: never; relation?: never; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for boolean fields */
  { asset?: never; boolean: BooleanFilter; dateTime?: never; json?: never; number?: never; relation?: never; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for date/time fields */
  { asset?: never; boolean?: never; dateTime: DateTimeFilter; json?: never; number?: never; relation?: never; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for JSON fields */
  { asset?: never; boolean?: never; dateTime?: never; json: JsonFilter; number?: never; relation?: never; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for number fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number: NumberFilter; relation?: never; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for relation fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; relation: RelationFilter; richText?: never; text?: never; typstText?: never; }
  |  /** Filter for rich text fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; relation?: never; richText: RichTextFilter; text?: never; typstText?: never; }
  |  /** Filter for text fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; relation?: never; richText?: never; text: TextFilter; typstText?: never; }
  |  /** Filter for Typst text fields */
  { asset?: never; boolean?: never; dateTime?: never; json?: never; number?: never; relation?: never; richText?: never; text?: never; typstText: TypstTextFilter; };

/**
 * Union of all possible field value types.
 * The actual type returned depends on the field's DataType definition.
 */
export type FieldValue = Asset | BooleanValue | DateTime | Json | NumberValue | Relation | RichText | Text | TypstText;

/**
 * JSON data container with type information.
 * Stores arbitrary structured data as JSON strings.
 */
export type Json = {
  __typename?: 'Json';
  /** JSON-encoded string representation of the data */
  value: Scalars['String']['output'];
  /** Type information about the JSON structure */
  valueType: Scalars['String']['output'];
};

/** Input for JSON field values. */
export type JsonFieldInput = {
  /** Arbitrary JSON data */
  value: Scalars['JSON']['input'];
};

/**
 * Filtering options for JSON field values.
 * Currently supports filtering by value type, with room for expansion.
 */
export type JsonFilter = {
  /** Filter by the type of JSON structure stored */
  valueType?: InputMaybe<TextFilter>;
};

/** Logical operators for combining policy rules. */
export enum LogicalOperator {
  And = 'AND',
  Or = 'OR'
}

/**
 * Root mutation type that defines all available write operations.
 * Organized into logical groups for better discoverability and maintainability.
 */
export type Mutation = {
  __typename?: 'Mutation';
  /** Account self-management operations for authenticated users */
  account: AccountMutations;
  /** Administrative operations (requires admin privileges) */
  admin: AdminMutations;
  /** Content management operations (collections, entries) */
  content: ContentMutations;
};

/** Input for NUMBER field values. */
export type NumberFieldInput = {
  /** Integer value */
  value: Scalars['Int']['input'];
};

/**
 * Filtering options for numeric field values.
 * Supports comparison and range operations.
 */
export type NumberFilter = {
  /** Exactly equal to */
  eq?: InputMaybe<Scalars['Int']['input']>;
  /** Greater than */
  gt?: InputMaybe<Scalars['Int']['input']>;
  /** Greater than or equal to */
  gte?: InputMaybe<Scalars['Int']['input']>;
  /** Value is in the provided list */
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** Less than */
  lt?: InputMaybe<Scalars['Int']['input']>;
  /** Less than or equal to */
  lte?: InputMaybe<Scalars['Int']['input']>;
  /** Not equal to */
  ne?: InputMaybe<Scalars['Int']['input']>;
  /** Value is not in the provided list */
  notIn?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Input for NUMBER_LIST field values. */
export type NumberListFieldInput = {
  /** Array of integer values */
  value: Array<Scalars['Int']['input']>;
};

/** Numeric value container for integer fields. */
export type NumberValue = {
  __typename?: 'NumberValue';
  /** The numeric value */
  value?: Maybe<Scalars['Int']['output']>;
};

/** Input for OBJECT field values. */
export type ObjectFieldInput = {
  /** JSON-encoded string representation of the object */
  value: Scalars['JSON']['input'];
};

/** Represents an ABAC policy that defines access rules. */
export type Policy = {
  __typename?: 'Policy';
  /** Type of action this policy controls */
  actionType: ActionType;
  /** When the policy was created */
  createdAt: Scalars['String']['output'];
  /** User who created this policy */
  createdBy: User;
  /** Description of what this policy controls */
  description?: Maybe<Scalars['String']['output']>;
  /** Whether the policy allows or denies access */
  effect: PolicyEffect;
  /** Unique identifier for the policy */
  id: Scalars['ID']['output'];
  /** Whether the policy is currently active */
  isActive: Scalars['Boolean']['output'];
  /** Name of the policy */
  name: Scalars['String']['output'];
  /** Priority for conflict resolution (higher number = higher priority) */
  priority: Scalars['Int']['output'];
  /** Type of resource this policy applies to */
  resourceType: ResourceType;
  /** How rules within this policy are combined */
  ruleConnector: LogicalOperator;
  /** Rules that define the conditions for this policy */
  rules: Array<PolicyRule>;
  /** When the policy was last updated */
  updatedAt: Scalars['String']['output'];
};

/** Policy effect determines whether access is granted or denied. */
export enum PolicyEffect {
  Allow = 'ALLOW',
  Deny = 'DENY'
}

/** Policy management operations for administrators. */
export type PolicyManagementMutations = {
  __typename?: 'PolicyManagementMutations';
  /** Add a rule to an existing policy */
  addRule: PolicyRule;
  /** Assign a policy directly to a user */
  assignToUser: AssignPolicyResult;
  /** Create a new ABAC policy */
  create: Policy;
  /** Delete a policy */
  delete: Scalars['Boolean']['output'];
  /** Remove a direct policy assignment from a user */
  removeFromUser: Scalars['Boolean']['output'];
  /** Remove a rule from a policy */
  removeRule: Scalars['Boolean']['output'];
  /** Update policy information */
  update: Policy;
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsAddRuleArgs = {
  policyId: Scalars['ID']['input'];
  rule: CreatePolicyRuleInput;
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsAssignToUserArgs = {
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  policyId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsCreateArgs = {
  input: CreatePolicyInput;
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsDeleteArgs = {
  id: Scalars['ID']['input'];
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsRemoveFromUserArgs = {
  policyId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsRemoveRuleArgs = {
  policyId: Scalars['ID']['input'];
  ruleId: Scalars['ID']['input'];
};


/** Policy management operations for administrators. */
export type PolicyManagementMutationsUpdateArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePolicyInput;
};

/** Individual rule within a policy that checks specific conditions. */
export type PolicyRule = {
  __typename?: 'PolicyRule';
  /** Attribute path this rule checks */
  attributePath: Scalars['String']['output'];
  /** When the rule was created */
  createdAt: Scalars['String']['output'];
  /** Description of what this rule checks */
  description?: Maybe<Scalars['String']['output']>;
  /** Expected value for comparison */
  expectedValue: Scalars['String']['output'];
  /** Unique identifier for the rule */
  id: Scalars['ID']['output'];
  /** Whether the rule is active */
  isActive: Scalars['Boolean']['output'];
  /** Comparison operator */
  operator: RuleOperator;
  /** Order of evaluation within the policy */
  order: Scalars['Int']['output'];
  /** Type of the expected value */
  valueType: ValueType;
};

/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type Query = {
  __typename?: 'Query';
  /** Retrieve a specific collection by its name */
  collection?: Maybe<Collection>;
  /** Get current authenticated user */
  me?: Maybe<User>;
  /** List all policies (requires admin permissions) */
  policies: Array<Policy>;
  /** Get a specific policy by ID */
  policy?: Maybe<Policy>;
  /** Get a specific role by ID */
  role?: Maybe<Role>;
  /** List all roles */
  roles: Array<Role>;
  /** Get a specific user by ID */
  user?: Maybe<User>;
  /** List all users (requires admin permissions) */
  users: Array<User>;
};


/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type QueryCollectionArgs = {
  name: Scalars['String']['input'];
};


/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type QueryPolicyArgs = {
  id: Scalars['ID']['input'];
};


/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type QueryRoleArgs = {
  id: Scalars['ID']['input'];
};


/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

/**
 * Reference to another entry in the system.
 * Enables relationships between different content items.
 */
export type Relation = {
  __typename?: 'Relation';
  /** The referenced entry */
  entry?: Maybe<Entry>;
};

/** Input for RELATION field values. */
export type RelationFieldInput = {
  /** UUID of the entry to reference */
  entryId: Scalars['ID']['input'];
};

/**
 * Filtering options for relation field values.
 * Allows filtering by properties of the referenced entry.
 */
export type RelationFilter = {
  /** Filter by the ID of the referenced entry */
  entryId?: InputMaybe<Scalars['String']['input']>;
  /** Filter by the name of the referenced entry */
  entryName?: InputMaybe<TextFilter>;
  /** Filter by the status of the referenced entry */
  entryStatus?: InputMaybe<Scalars['String']['input']>;
};

/** Types of resources that can be controlled by policies. */
export enum ResourceType {
  Assets = 'assets',
  Collections = 'collections',
  Entries = 'entries',
  Fields = 'fields',
  Users = 'users'
}

/**
 * Rich text content with formatting and markup support.
 * Supports various formats like HTML, Markdown, etc.
 */
export type RichText = {
  __typename?: 'RichText';
  /** Format type (html, markdown, etc.) */
  format: Scalars['String']['output'];
  /** Raw source content with markup */
  raw: Scalars['String']['output'];
  /** Rendered HTML or formatted output */
  rendered: Scalars['String']['output'];
};

/** Input for RICH_TEXT field values. */
export type RichTextFieldInput = {
  /** Format type (defaults to 'markdown') */
  format?: InputMaybe<Scalars['String']['input']>;
  /** Raw source content with markup */
  raw: Scalars['String']['input'];
  /** Rendered HTML or formatted output */
  rendered: Scalars['String']['input'];
};

/**
 * Filtering options for rich text field values.
 * Allows filtering on both raw and rendered content.
 */
export type RichTextFilter = {
  /** Filter by format type */
  format?: InputMaybe<TextFilter>;
  /** Filter by raw source content */
  raw?: InputMaybe<TextFilter>;
  /** Filter by rendered HTML content */
  rendered?: InputMaybe<TextFilter>;
};

/** Represents a role that groups permissions together. */
export type Role = {
  __typename?: 'Role';
  /** When the role was created */
  creationTime: Scalars['String']['output'];
  /** Description explaining the role's purpose */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the role */
  id: Scalars['ID']['output'];
  /** When the role was last modified */
  lastEditTime: Scalars['String']['output'];
  /** Name of the role */
  name: Scalars['String']['output'];
  /** Policies assigned to this role */
  policies: Array<Policy>;
};

/** Role management operations for administrators. */
export type RoleManagementMutations = {
  __typename?: 'RoleManagementMutations';
  /** Assign a policy to a role */
  assignPolicy: AssignPolicyResult;
  /** Create a new role */
  create: Role;
  /** Delete a role */
  delete: Scalars['Boolean']['output'];
  /** Remove a policy from a role */
  removePolicy: Scalars['Boolean']['output'];
  /** Update role information */
  update: Role;
};


/** Role management operations for administrators. */
export type RoleManagementMutationsAssignPolicyArgs = {
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  policyId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};


/** Role management operations for administrators. */
export type RoleManagementMutationsCreateArgs = {
  input: CreateRoleInput;
};


/** Role management operations for administrators. */
export type RoleManagementMutationsDeleteArgs = {
  id: Scalars['ID']['input'];
};


/** Role management operations for administrators. */
export type RoleManagementMutationsRemovePolicyArgs = {
  policyId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


/** Role management operations for administrators. */
export type RoleManagementMutationsUpdateArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRoleInput;
};

/** Operators for comparing values in policy rules. */
export enum RuleOperator {
  Contains = 'contains',
  EndsWith = 'ends_with',
  Eq = 'eq',
  Gt = 'gt',
  Gte = 'gte',
  In = 'in',
  IsNotNull = 'is_not_null',
  IsNull = 'is_null',
  Lt = 'lt',
  Lte = 'lte',
  Ne = 'ne',
  NotIn = 'not_in',
  Regex = 'regex',
  StartsWith = 'starts_with'
}

/** Plain text field value container. */
export type Text = {
  __typename?: 'Text';
  /** The text content */
  text?: Maybe<Scalars['String']['output']>;
};

/** Input for TEXT field values. */
export type TextFieldInput = {
  /** Plain text string value */
  value: Scalars['String']['input'];
};

/**
 * Filtering options for text field values.
 * Supports various string matching operations.
 */
export type TextFilter = {
  /** Contains substring */
  contains?: InputMaybe<Scalars['String']['input']>;
  /** Ends with suffix */
  endsWith?: InputMaybe<Scalars['String']['input']>;
  /** Exact match */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Value is in the provided list */
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Not equal to */
  ne?: InputMaybe<Scalars['String']['input']>;
  /** Value is not in the provided list */
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Starts with prefix */
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Input for TEXT_LIST field values. */
export type TextListFieldInput = {
  /** Array of text strings */
  value: Array<Scalars['String']['input']>;
};

/**
 * Typst markup text with both raw source and rendered output.
 * Typst is a modern typesetting language for scientific documents.
 */
export type TypstText = {
  __typename?: 'TypstText';
  /** Raw Typst markup source code */
  raw: Scalars['String']['output'];
  /** Rendered output (HTML, PDF, or other format) */
  rendered: Scalars['String']['output'];
};

/** Input for TYPST_TEXT field values. */
export type TypstTextFieldInput = {
  /** Raw Typst markup source code */
  raw: Scalars['String']['input'];
  /** Rendered output (HTML, PDF, or other format) */
  rendered: Scalars['String']['input'];
};

/**
 * Filtering options for Typst text field values.
 * Allows filtering on both source and rendered content.
 */
export type TypstTextFilter = {
  /** Filter by raw Typst source code */
  raw?: InputMaybe<TextFilter>;
  /** Filter by rendered output content */
  rendered?: InputMaybe<TextFilter>;
};

/** Input for updating current user's profile. */
export type UpdateMyProfileInput = {
  /** New username */
  name: Scalars['String']['input'];
};

/** Input for updating policy information. */
export type UpdatePolicyInput = {
  /** New description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** New effect */
  effect?: InputMaybe<PolicyEffect>;
  /** New active status */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** New name for the policy */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New priority */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** New rule connector */
  ruleConnector?: InputMaybe<LogicalOperator>;
};

/** Input for updating role information. */
export type UpdateRoleInput = {
  /** New description for the role */
  description?: InputMaybe<Scalars['String']['input']>;
  /** New name for the role */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating user information. */
export type UpdateUserInput = {
  /** New username (optional) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New password (optional, will be hashed) */
  password?: InputMaybe<Scalars['String']['input']>;
  /** New status (optional) */
  status?: InputMaybe<UserStatus>;
};

/** Represents a user in the CMS system. */
export type User = {
  __typename?: 'User';
  /** When the user account was created */
  creationTime: Scalars['String']['output'];
  /** Unique identifier for the user */
  id: Scalars['ID']['output'];
  /** When the user account was last modified */
  lastEditTime: Scalars['String']['output'];
  /** When the user last logged in */
  lastLoginTime: Scalars['String']['output'];
  /** Username for the user */
  name: Scalars['String']['output'];
  /** Direct policies assigned to this user */
  policies: Array<Policy>;
  /** Roles assigned to this user */
  roles: Array<Role>;
  /** Current status of the user account */
  status: UserStatus;
};

/** User management operations for administrators. */
export type UserManagementMutations = {
  __typename?: 'UserManagementMutations';
  /** Assign a role to a user */
  assignRole: AssignRoleResult;
  /** Change user status (activate, deactivate, ban) */
  changeStatus: User;
  /** Create a new user account */
  create: CreateUserResult;
  /** Delete a user account */
  delete: Scalars['Boolean']['output'];
  /** Remove a role from a user */
  removeRole: Scalars['Boolean']['output'];
  /** Update user information */
  update: User;
};


/** User management operations for administrators. */
export type UserManagementMutationsAssignRoleArgs = {
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


/** User management operations for administrators. */
export type UserManagementMutationsChangeStatusArgs = {
  id: Scalars['ID']['input'];
  status: UserStatus;
};


/** User management operations for administrators. */
export type UserManagementMutationsCreateArgs = {
  input: CreateUserInput;
};


/** User management operations for administrators. */
export type UserManagementMutationsDeleteArgs = {
  id: Scalars['ID']['input'];
};


/** User management operations for administrators. */
export type UserManagementMutationsRemoveRoleArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


/** User management operations for administrators. */
export type UserManagementMutationsUpdateArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};

/** User account status options. */
export enum UserStatus {
  Active = 'ACTIVE',
  Banned = 'BANNED',
  Inactive = 'INACTIVE'
}

/** Value types for policy rule comparisons. */
export enum ValueType {
  Array = 'array',
  Boolean = 'boolean',
  Datetime = 'datetime',
  Number = 'number',
  String = 'string',
  Uuid = 'uuid'
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  FieldValue:
    | ( Asset )
    | ( BooleanValue )
    | ( DateTime )
    | ( Json )
    | ( NumberValue )
    | ( Omit<Relation, 'entry'> & { entry?: Maybe<_RefType['Entry']> } )
    | ( RichText )
    | ( Text )
    | ( TypstText )
  ;
}>;


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AccountMutations: ResolverTypeWrapper<AccountMutations>;
  ActionType: ActionType;
  AdminMutations: ResolverTypeWrapper<AdminMutations>;
  Asset: ResolverTypeWrapper<Asset>;
  AssetFieldInput: AssetFieldInput;
  AssetFilter: AssetFilter;
  AssignPolicyResult: ResolverTypeWrapper<AssignPolicyResult>;
  AssignRoleResult: ResolverTypeWrapper<AssignRoleResult>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BooleanFieldInput: BooleanFieldInput;
  BooleanFilter: BooleanFilter;
  BooleanValue: ResolverTypeWrapper<BooleanValue>;
  ChangeMyPasswordInput: ChangeMyPasswordInput;
  Collection: ResolverTypeWrapper<Omit<Collection, 'entries'> & { entries: Array<ResolversTypes['Entry']> }>;
  ContentMutations: ResolverTypeWrapper<Omit<ContentMutations, 'createCollection' | 'createEntry'> & { createCollection: ResolversTypes['Collection'], createEntry: ResolversTypes['Entry'] }>;
  CreateCollectionInput: CreateCollectionInput;
  CreateEntryFieldInput: CreateEntryFieldInput;
  CreateEntryFieldValueInput: CreateEntryFieldValueInput;
  CreateEntryInput: CreateEntryInput;
  CreateFieldInput: CreateFieldInput;
  CreatePolicyInput: CreatePolicyInput;
  CreatePolicyRuleInput: CreatePolicyRuleInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  CreateUserResult: ResolverTypeWrapper<CreateUserResult>;
  DataType: DataType;
  DateTime: ResolverTypeWrapper<DateTime>;
  DateTimeFieldInput: DateTimeFieldInput;
  DateTimeFilter: DateTimeFilter;
  Entry: ResolverTypeWrapper<Omit<Entry, 'field'> & { field?: Maybe<ResolversTypes['FieldValue']> }>;
  EntryFilter: EntryFilter;
  Field: ResolverTypeWrapper<Field>;
  FieldFilter: FieldFilter;
  FieldValue: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['FieldValue']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Json: ResolverTypeWrapper<Json>;
  JsonFieldInput: JsonFieldInput;
  JsonFilter: JsonFilter;
  LogicalOperator: LogicalOperator;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NumberFieldInput: NumberFieldInput;
  NumberFilter: NumberFilter;
  NumberListFieldInput: NumberListFieldInput;
  NumberValue: ResolverTypeWrapper<NumberValue>;
  ObjectFieldInput: ObjectFieldInput;
  Policy: ResolverTypeWrapper<Policy>;
  PolicyEffect: PolicyEffect;
  PolicyManagementMutations: ResolverTypeWrapper<PolicyManagementMutations>;
  PolicyRule: ResolverTypeWrapper<PolicyRule>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Relation: ResolverTypeWrapper<Omit<Relation, 'entry'> & { entry?: Maybe<ResolversTypes['Entry']> }>;
  RelationFieldInput: RelationFieldInput;
  RelationFilter: RelationFilter;
  ResourceType: ResourceType;
  RichText: ResolverTypeWrapper<RichText>;
  RichTextFieldInput: RichTextFieldInput;
  RichTextFilter: RichTextFilter;
  Role: ResolverTypeWrapper<Role>;
  RoleManagementMutations: ResolverTypeWrapper<RoleManagementMutations>;
  RuleOperator: RuleOperator;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Text: ResolverTypeWrapper<Text>;
  TextFieldInput: TextFieldInput;
  TextFilter: TextFilter;
  TextListFieldInput: TextListFieldInput;
  TypstText: ResolverTypeWrapper<TypstText>;
  TypstTextFieldInput: TypstTextFieldInput;
  TypstTextFilter: TypstTextFilter;
  UpdateMyProfileInput: UpdateMyProfileInput;
  UpdatePolicyInput: UpdatePolicyInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserManagementMutations: ResolverTypeWrapper<UserManagementMutations>;
  UserStatus: UserStatus;
  ValueType: ValueType;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AccountMutations: AccountMutations;
  AdminMutations: AdminMutations;
  Asset: Asset;
  AssetFieldInput: AssetFieldInput;
  AssetFilter: AssetFilter;
  AssignPolicyResult: AssignPolicyResult;
  AssignRoleResult: AssignRoleResult;
  Boolean: Scalars['Boolean']['output'];
  BooleanFieldInput: BooleanFieldInput;
  BooleanFilter: BooleanFilter;
  BooleanValue: BooleanValue;
  ChangeMyPasswordInput: ChangeMyPasswordInput;
  Collection: Omit<Collection, 'entries'> & { entries: Array<ResolversParentTypes['Entry']> };
  ContentMutations: Omit<ContentMutations, 'createCollection' | 'createEntry'> & { createCollection: ResolversParentTypes['Collection'], createEntry: ResolversParentTypes['Entry'] };
  CreateCollectionInput: CreateCollectionInput;
  CreateEntryFieldInput: CreateEntryFieldInput;
  CreateEntryFieldValueInput: CreateEntryFieldValueInput;
  CreateEntryInput: CreateEntryInput;
  CreateFieldInput: CreateFieldInput;
  CreatePolicyInput: CreatePolicyInput;
  CreatePolicyRuleInput: CreatePolicyRuleInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  CreateUserResult: CreateUserResult;
  DateTime: DateTime;
  DateTimeFieldInput: DateTimeFieldInput;
  DateTimeFilter: DateTimeFilter;
  Entry: Omit<Entry, 'field'> & { field?: Maybe<ResolversParentTypes['FieldValue']> };
  EntryFilter: EntryFilter;
  Field: Field;
  FieldFilter: FieldFilter;
  FieldValue: ResolversUnionTypes<ResolversParentTypes>['FieldValue'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Json: Json;
  JsonFieldInput: JsonFieldInput;
  JsonFilter: JsonFilter;
  Mutation: Record<PropertyKey, never>;
  NumberFieldInput: NumberFieldInput;
  NumberFilter: NumberFilter;
  NumberListFieldInput: NumberListFieldInput;
  NumberValue: NumberValue;
  ObjectFieldInput: ObjectFieldInput;
  Policy: Policy;
  PolicyManagementMutations: PolicyManagementMutations;
  PolicyRule: PolicyRule;
  Query: Record<PropertyKey, never>;
  Relation: Omit<Relation, 'entry'> & { entry?: Maybe<ResolversParentTypes['Entry']> };
  RelationFieldInput: RelationFieldInput;
  RelationFilter: RelationFilter;
  RichText: RichText;
  RichTextFieldInput: RichTextFieldInput;
  RichTextFilter: RichTextFilter;
  Role: Role;
  RoleManagementMutations: RoleManagementMutations;
  String: Scalars['String']['output'];
  Text: Text;
  TextFieldInput: TextFieldInput;
  TextFilter: TextFilter;
  TextListFieldInput: TextListFieldInput;
  TypstText: TypstText;
  TypstTextFieldInput: TypstTextFieldInput;
  TypstTextFilter: TypstTextFilter;
  UpdateMyProfileInput: UpdateMyProfileInput;
  UpdatePolicyInput: UpdatePolicyInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: User;
  UserManagementMutations: UserManagementMutations;
}>;

export type AccountMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['AccountMutations'] = ResolversParentTypes['AccountMutations']> = ResolversObject<{
  changePassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<AccountMutationsChangePasswordArgs, 'input'>>;
  deactivate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<AccountMutationsDeactivateArgs, 'confirmUsername'>>;
  updateProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<AccountMutationsUpdateProfileArgs, 'input'>>;
}>;

export type AdminMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['AdminMutations'] = ResolversParentTypes['AdminMutations']> = ResolversObject<{
  policies?: Resolver<ResolversTypes['PolicyManagementMutations'], ParentType, ContextType>;
  roles?: Resolver<ResolversTypes['RoleManagementMutations'], ParentType, ContextType>;
  users?: Resolver<ResolversTypes['UserManagementMutations'], ParentType, ContextType>;
}>;

export type AssetResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Asset'] = ResolversParentTypes['Asset']> = ResolversObject<{
  alt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mimeType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignPolicyResultResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['AssignPolicyResult'] = ResolversParentTypes['AssignPolicyResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type AssignRoleResultResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['AssignRoleResult'] = ResolversParentTypes['AssignRoleResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type BooleanValueResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['BooleanValue'] = ResolversParentTypes['BooleanValue']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CollectionResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Collection'] = ResolversParentTypes['Collection']> = ResolversObject<{
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entries?: Resolver<Array<ResolversTypes['Entry']>, ParentType, ContextType, Partial<CollectionEntriesArgs>>;
  fields?: Resolver<Array<ResolversTypes['Field']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ContentMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['ContentMutations'] = ResolversParentTypes['ContentMutations']> = ResolversObject<{
  createCollection?: Resolver<ResolversTypes['Collection'], ParentType, ContextType, RequireFields<ContentMutationsCreateCollectionArgs, 'input'>>;
  createEntry?: Resolver<ResolversTypes['Entry'], ParentType, ContextType, RequireFields<ContentMutationsCreateEntryArgs, 'input'>>;
}>;

export type CreateUserResultResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['CreateUserResult'] = ResolversParentTypes['CreateUserResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type DateTimeResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['DateTime'] = ResolversParentTypes['DateTime']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EntryResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Entry'] = ResolversParentTypes['Entry']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  field?: Resolver<Maybe<ResolversTypes['FieldValue']>, ParentType, ContextType, RequireFields<EntryFieldArgs, 'name'>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type FieldResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Field'] = ResolversParentTypes['Field']> = ResolversObject<{
  dataType?: Resolver<ResolversTypes['DataType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUnique?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type FieldValueResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['FieldValue'] = ResolversParentTypes['FieldValue']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Asset' | 'BooleanValue' | 'DateTime' | 'Json' | 'NumberValue' | 'Relation' | 'RichText' | 'Text' | 'TypstText', ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JsonResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Json'] = ResolversParentTypes['Json']> = ResolversObject<{
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  valueType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  account?: Resolver<ResolversTypes['AccountMutations'], ParentType, ContextType>;
  admin?: Resolver<ResolversTypes['AdminMutations'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['ContentMutations'], ParentType, ContextType>;
}>;

export type NumberValueResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['NumberValue'] = ResolversParentTypes['NumberValue']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PolicyResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Policy'] = ResolversParentTypes['Policy']> = ResolversObject<{
  actionType?: Resolver<ResolversTypes['ActionType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  effect?: Resolver<ResolversTypes['PolicyEffect'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['ResourceType'], ParentType, ContextType>;
  ruleConnector?: Resolver<ResolversTypes['LogicalOperator'], ParentType, ContextType>;
  rules?: Resolver<Array<ResolversTypes['PolicyRule']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type PolicyManagementMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['PolicyManagementMutations'] = ResolversParentTypes['PolicyManagementMutations']> = ResolversObject<{
  addRule?: Resolver<ResolversTypes['PolicyRule'], ParentType, ContextType, RequireFields<PolicyManagementMutationsAddRuleArgs, 'policyId' | 'rule'>>;
  assignToUser?: Resolver<ResolversTypes['AssignPolicyResult'], ParentType, ContextType, RequireFields<PolicyManagementMutationsAssignToUserArgs, 'policyId' | 'reason' | 'userId'>>;
  create?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<PolicyManagementMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<PolicyManagementMutationsDeleteArgs, 'id'>>;
  removeFromUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<PolicyManagementMutationsRemoveFromUserArgs, 'policyId' | 'userId'>>;
  removeRule?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<PolicyManagementMutationsRemoveRuleArgs, 'policyId' | 'ruleId'>>;
  update?: Resolver<ResolversTypes['Policy'], ParentType, ContextType, RequireFields<PolicyManagementMutationsUpdateArgs, 'id' | 'input'>>;
}>;

export type PolicyRuleResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['PolicyRule'] = ResolversParentTypes['PolicyRule']> = ResolversObject<{
  attributePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expectedValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  operator?: Resolver<ResolversTypes['RuleOperator'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  valueType?: Resolver<ResolversTypes['ValueType'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  collection?: Resolver<Maybe<ResolversTypes['Collection']>, ParentType, ContextType, RequireFields<QueryCollectionArgs, 'name'>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  policies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  policy?: Resolver<Maybe<ResolversTypes['Policy']>, ParentType, ContextType, RequireFields<QueryPolicyArgs, 'id'>>;
  role?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<QueryRoleArgs, 'id'>>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
}>;

export type RelationResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Relation'] = ResolversParentTypes['Relation']> = ResolversObject<{
  entry?: Resolver<Maybe<ResolversTypes['Entry']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RichTextResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['RichText'] = ResolversParentTypes['RichText']> = ResolversObject<{
  format?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rendered?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RoleResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = ResolversObject<{
  creationTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastEditTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  policies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
}>;

export type RoleManagementMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['RoleManagementMutations'] = ResolversParentTypes['RoleManagementMutations']> = ResolversObject<{
  assignPolicy?: Resolver<ResolversTypes['AssignPolicyResult'], ParentType, ContextType, RequireFields<RoleManagementMutationsAssignPolicyArgs, 'policyId' | 'roleId'>>;
  create?: Resolver<ResolversTypes['Role'], ParentType, ContextType, RequireFields<RoleManagementMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RoleManagementMutationsDeleteArgs, 'id'>>;
  removePolicy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RoleManagementMutationsRemovePolicyArgs, 'policyId' | 'roleId'>>;
  update?: Resolver<ResolversTypes['Role'], ParentType, ContextType, RequireFields<RoleManagementMutationsUpdateArgs, 'id' | 'input'>>;
}>;

export type TextResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Text'] = ResolversParentTypes['Text']> = ResolversObject<{
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TypstTextResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['TypstText'] = ResolversParentTypes['TypstText']> = ResolversObject<{
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rendered?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  creationTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastEditTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastLoginTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  policies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserStatus'], ParentType, ContextType>;
}>;

export type UserManagementMutationsResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['UserManagementMutations'] = ResolversParentTypes['UserManagementMutations']> = ResolversObject<{
  assignRole?: Resolver<ResolversTypes['AssignRoleResult'], ParentType, ContextType, RequireFields<UserManagementMutationsAssignRoleArgs, 'roleId' | 'userId'>>;
  changeStatus?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<UserManagementMutationsChangeStatusArgs, 'id' | 'status'>>;
  create?: Resolver<ResolversTypes['CreateUserResult'], ParentType, ContextType, RequireFields<UserManagementMutationsCreateArgs, 'input'>>;
  delete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<UserManagementMutationsDeleteArgs, 'id'>>;
  removeRole?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<UserManagementMutationsRemoveRoleArgs, 'roleId' | 'userId'>>;
  update?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<UserManagementMutationsUpdateArgs, 'id' | 'input'>>;
}>;

export type Resolvers<ContextType = AppContext> = ResolversObject<{
  AccountMutations?: AccountMutationsResolvers<ContextType>;
  AdminMutations?: AdminMutationsResolvers<ContextType>;
  Asset?: AssetResolvers<ContextType>;
  AssignPolicyResult?: AssignPolicyResultResolvers<ContextType>;
  AssignRoleResult?: AssignRoleResultResolvers<ContextType>;
  BooleanValue?: BooleanValueResolvers<ContextType>;
  Collection?: CollectionResolvers<ContextType>;
  ContentMutations?: ContentMutationsResolvers<ContextType>;
  CreateUserResult?: CreateUserResultResolvers<ContextType>;
  DateTime?: DateTimeResolvers<ContextType>;
  Entry?: EntryResolvers<ContextType>;
  Field?: FieldResolvers<ContextType>;
  FieldValue?: FieldValueResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Json?: JsonResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NumberValue?: NumberValueResolvers<ContextType>;
  Policy?: PolicyResolvers<ContextType>;
  PolicyManagementMutations?: PolicyManagementMutationsResolvers<ContextType>;
  PolicyRule?: PolicyRuleResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Relation?: RelationResolvers<ContextType>;
  RichText?: RichTextResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  RoleManagementMutations?: RoleManagementMutationsResolvers<ContextType>;
  Text?: TextResolvers<ContextType>;
  TypstText?: TypstTextResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserManagementMutations?: UserManagementMutationsResolvers<ContextType>;
}>;

