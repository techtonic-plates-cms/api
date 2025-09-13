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

/**
 * Root mutation type that defines all available write operations.
 * Clients use these mutations to create, update, and delete data.
 */
export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new collection with the provided schema definition */
  createCollection: Collection;
  /** Create a new entry in a collection with field values */
  createEntry: Entry;
};


/**
 * Root mutation type that defines all available write operations.
 * Clients use these mutations to create, update, and delete data.
 */
export type MutationCreateCollectionArgs = {
  input: CreateCollectionInput;
};


/**
 * Root mutation type that defines all available write operations.
 * Clients use these mutations to create, update, and delete data.
 */
export type MutationCreateEntryArgs = {
  input: CreateEntryInput;
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

/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type Query = {
  __typename?: 'Query';
  /** Retrieve a specific collection by its name */
  collection?: Maybe<Collection>;
};


/**
 * Root query type that defines all available read operations.
 * Clients use these queries to fetch data from the API.
 */
export type QueryCollectionArgs = {
  name: Scalars['String']['input'];
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
  Asset: ResolverTypeWrapper<Asset>;
  AssetFieldInput: AssetFieldInput;
  AssetFilter: AssetFilter;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BooleanFieldInput: BooleanFieldInput;
  BooleanFilter: BooleanFilter;
  BooleanValue: ResolverTypeWrapper<BooleanValue>;
  Collection: ResolverTypeWrapper<Omit<Collection, 'entries'> & { entries: Array<ResolversTypes['Entry']> }>;
  CreateCollectionInput: CreateCollectionInput;
  CreateEntryFieldInput: CreateEntryFieldInput;
  CreateEntryFieldValueInput: CreateEntryFieldValueInput;
  CreateEntryInput: CreateEntryInput;
  CreateFieldInput: CreateFieldInput;
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
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NumberFieldInput: NumberFieldInput;
  NumberFilter: NumberFilter;
  NumberListFieldInput: NumberListFieldInput;
  NumberValue: ResolverTypeWrapper<NumberValue>;
  ObjectFieldInput: ObjectFieldInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Relation: ResolverTypeWrapper<Omit<Relation, 'entry'> & { entry?: Maybe<ResolversTypes['Entry']> }>;
  RelationFieldInput: RelationFieldInput;
  RelationFilter: RelationFilter;
  RichText: ResolverTypeWrapper<RichText>;
  RichTextFieldInput: RichTextFieldInput;
  RichTextFilter: RichTextFilter;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Text: ResolverTypeWrapper<Text>;
  TextFieldInput: TextFieldInput;
  TextFilter: TextFilter;
  TextListFieldInput: TextListFieldInput;
  TypstText: ResolverTypeWrapper<TypstText>;
  TypstTextFieldInput: TypstTextFieldInput;
  TypstTextFilter: TypstTextFilter;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Asset: Asset;
  AssetFieldInput: AssetFieldInput;
  AssetFilter: AssetFilter;
  Boolean: Scalars['Boolean']['output'];
  BooleanFieldInput: BooleanFieldInput;
  BooleanFilter: BooleanFilter;
  BooleanValue: BooleanValue;
  Collection: Omit<Collection, 'entries'> & { entries: Array<ResolversParentTypes['Entry']> };
  CreateCollectionInput: CreateCollectionInput;
  CreateEntryFieldInput: CreateEntryFieldInput;
  CreateEntryFieldValueInput: CreateEntryFieldValueInput;
  CreateEntryInput: CreateEntryInput;
  CreateFieldInput: CreateFieldInput;
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
  Query: Record<PropertyKey, never>;
  Relation: Omit<Relation, 'entry'> & { entry?: Maybe<ResolversParentTypes['Entry']> };
  RelationFieldInput: RelationFieldInput;
  RelationFilter: RelationFilter;
  RichText: RichText;
  RichTextFieldInput: RichTextFieldInput;
  RichTextFilter: RichTextFilter;
  String: Scalars['String']['output'];
  Text: Text;
  TextFieldInput: TextFieldInput;
  TextFilter: TextFilter;
  TextListFieldInput: TextListFieldInput;
  TypstText: TypstText;
  TypstTextFieldInput: TypstTextFieldInput;
  TypstTextFilter: TypstTextFilter;
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
  createCollection?: Resolver<ResolversTypes['Collection'], ParentType, ContextType, RequireFields<MutationCreateCollectionArgs, 'input'>>;
  createEntry?: Resolver<ResolversTypes['Entry'], ParentType, ContextType, RequireFields<MutationCreateEntryArgs, 'input'>>;
}>;

export type NumberValueResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['NumberValue'] = ResolversParentTypes['NumberValue']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  collection?: Resolver<Maybe<ResolversTypes['Collection']>, ParentType, ContextType, RequireFields<QueryCollectionArgs, 'name'>>;
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

export type TextResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['Text'] = ResolversParentTypes['Text']> = ResolversObject<{
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TypstTextResolvers<ContextType = AppContext, ParentType extends ResolversParentTypes['TypstText'] = ResolversParentTypes['TypstText']> = ResolversObject<{
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rendered?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = AppContext> = ResolversObject<{
  Asset?: AssetResolvers<ContextType>;
  BooleanValue?: BooleanValueResolvers<ContextType>;
  Collection?: CollectionResolvers<ContextType>;
  DateTime?: DateTimeResolvers<ContextType>;
  Entry?: EntryResolvers<ContextType>;
  Field?: FieldResolvers<ContextType>;
  FieldValue?: FieldValueResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Json?: JsonResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NumberValue?: NumberValueResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Relation?: RelationResolvers<ContextType>;
  RichText?: RichTextResolvers<ContextType>;
  Text?: TextResolvers<ContextType>;
  TypstText?: TypstTextResolvers<ContextType>;
}>;

