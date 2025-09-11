import type { GraphQLResolveInfo } from 'graphql';
import type { MyContext } from '../index';
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
};

export type Asset = {
  __typename?: 'Asset';
  alt?: Maybe<Scalars['String']['output']>;
  caption?: Maybe<Scalars['String']['output']>;
  fileSize: Scalars['Int']['output'];
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type AssetFilter = {
  alt?: InputMaybe<TextFilter>;
  caption?: InputMaybe<TextFilter>;
  fileSize?: InputMaybe<NumberFilter>;
  filename?: InputMaybe<TextFilter>;
  mimeType?: InputMaybe<TextFilter>;
};

export type Book = {
  __typename?: 'Book';
  author?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
};

export type BooleanValue = {
  __typename?: 'BooleanValue';
  value?: Maybe<Scalars['Boolean']['output']>;
};

export type Collection = {
  __typename?: 'Collection';
  description?: Maybe<Scalars['String']['output']>;
  entries: Array<Entry>;
  fields: Array<Field>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};


export type CollectionEntriesArgs = {
  filter?: InputMaybe<EntryFilter>;
};

export enum DataType {
  Asset = 'ASSET',
  Boolean = 'BOOLEAN',
  DateTime = 'DATE_TIME',
  Json = 'JSON',
  Number = 'NUMBER',
  NumberList = 'NUMBER_LIST',
  Object = 'OBJECT',
  Relation = 'RELATION',
  RichText = 'RICH_TEXT',
  Text = 'TEXT',
  TextList = 'TEXT_LIST',
  TypstText = 'TYPST_TEXT'
}

export type DateTime = {
  __typename?: 'DateTime';
  value?: Maybe<Scalars['String']['output']>;
};

export type DateTimeFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
};

export type Entry = {
  __typename?: 'Entry';
  createdAt: Scalars['String']['output'];
  field?: Maybe<FieldValue>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};


export type EntryFieldArgs = {
  filter?: InputMaybe<FieldFilter>;
  name: Scalars['String']['input'];
};

export type EntryFilter = {
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type Field = {
  __typename?: 'Field';
  dataType: DataType;
  id: Scalars['ID']['output'];
  isRequired: Scalars['Boolean']['output'];
  isUnique: Scalars['Boolean']['output'];
  label?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type FieldFilter = {
  asset?: InputMaybe<AssetFilter>;
  boolean?: InputMaybe<BooleanFilter>;
  dateTime?: InputMaybe<DateTimeFilter>;
  json?: InputMaybe<JsonFilter>;
  number?: InputMaybe<NumberFilter>;
  richText?: InputMaybe<RichTextFilter>;
  text?: InputMaybe<TextFilter>;
};

export type FieldValue = Asset | BooleanValue | DateTime | Json | NumberValue | RichText | Text;

export type Json = {
  __typename?: 'Json';
  value: Scalars['String']['output'];
  valueType: Scalars['String']['output'];
};

export type JsonFilter = {
  valueType?: InputMaybe<TextFilter>;
};

export type NumberFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  notIn?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type NumberValue = {
  __typename?: 'NumberValue';
  value?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  books?: Maybe<Array<Maybe<Book>>>;
  collection?: Maybe<Collection>;
  collections: Array<Collection>;
};


export type QueryCollectionArgs = {
  name: Scalars['String']['input'];
};

export type RichText = {
  __typename?: 'RichText';
  format: Scalars['String']['output'];
  raw: Scalars['String']['output'];
  rendered: Scalars['String']['output'];
};

export type RichTextFilter = {
  format?: InputMaybe<TextFilter>;
  raw?: InputMaybe<TextFilter>;
  rendered?: InputMaybe<TextFilter>;
};

export type Text = {
  __typename?: 'Text';
  text?: Maybe<Scalars['String']['output']>;
};

export type TextFilter = {
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  ne?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
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
    | ( RichText )
    | ( Text )
  ;
}>;


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Asset: ResolverTypeWrapper<Asset>;
  AssetFilter: AssetFilter;
  Book: ResolverTypeWrapper<Book>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BooleanFilter: BooleanFilter;
  BooleanValue: ResolverTypeWrapper<BooleanValue>;
  Collection: ResolverTypeWrapper<Omit<Collection, 'entries'> & { entries: Array<ResolversTypes['Entry']> }>;
  DataType: DataType;
  DateTime: ResolverTypeWrapper<DateTime>;
  DateTimeFilter: DateTimeFilter;
  Entry: ResolverTypeWrapper<Omit<Entry, 'field'> & { field?: Maybe<ResolversTypes['FieldValue']> }>;
  EntryFilter: EntryFilter;
  Field: ResolverTypeWrapper<Field>;
  FieldFilter: FieldFilter;
  FieldValue: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['FieldValue']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Json: ResolverTypeWrapper<Json>;
  JsonFilter: JsonFilter;
  NumberFilter: NumberFilter;
  NumberValue: ResolverTypeWrapper<NumberValue>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RichText: ResolverTypeWrapper<RichText>;
  RichTextFilter: RichTextFilter;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Text: ResolverTypeWrapper<Text>;
  TextFilter: TextFilter;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Asset: Asset;
  AssetFilter: AssetFilter;
  Book: Book;
  Boolean: Scalars['Boolean']['output'];
  BooleanFilter: BooleanFilter;
  BooleanValue: BooleanValue;
  Collection: Omit<Collection, 'entries'> & { entries: Array<ResolversParentTypes['Entry']> };
  DateTime: DateTime;
  DateTimeFilter: DateTimeFilter;
  Entry: Omit<Entry, 'field'> & { field?: Maybe<ResolversParentTypes['FieldValue']> };
  EntryFilter: EntryFilter;
  Field: Field;
  FieldFilter: FieldFilter;
  FieldValue: ResolversUnionTypes<ResolversParentTypes>['FieldValue'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Json: Json;
  JsonFilter: JsonFilter;
  NumberFilter: NumberFilter;
  NumberValue: NumberValue;
  Query: Record<PropertyKey, never>;
  RichText: RichText;
  RichTextFilter: RichTextFilter;
  String: Scalars['String']['output'];
  Text: Text;
  TextFilter: TextFilter;
}>;

export type AssetResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Asset'] = ResolversParentTypes['Asset']> = ResolversObject<{
  alt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mimeType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BookResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Book'] = ResolversParentTypes['Book']> = ResolversObject<{
  author?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type BooleanValueResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['BooleanValue'] = ResolversParentTypes['BooleanValue']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CollectionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Collection'] = ResolversParentTypes['Collection']> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entries?: Resolver<Array<ResolversTypes['Entry']>, ParentType, ContextType, Partial<CollectionEntriesArgs>>;
  fields?: Resolver<Array<ResolversTypes['Field']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type DateTimeResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['DateTime'] = ResolversParentTypes['DateTime']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EntryResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Entry'] = ResolversParentTypes['Entry']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  field?: Resolver<Maybe<ResolversTypes['FieldValue']>, ParentType, ContextType, RequireFields<EntryFieldArgs, 'name'>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type FieldResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Field'] = ResolversParentTypes['Field']> = ResolversObject<{
  dataType?: Resolver<ResolversTypes['DataType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUnique?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type FieldValueResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['FieldValue'] = ResolversParentTypes['FieldValue']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Asset' | 'BooleanValue' | 'DateTime' | 'Json' | 'NumberValue' | 'RichText' | 'Text', ParentType, ContextType>;
}>;

export type JsonResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Json'] = ResolversParentTypes['Json']> = ResolversObject<{
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  valueType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NumberValueResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['NumberValue'] = ResolversParentTypes['NumberValue']> = ResolversObject<{
  value?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  books?: Resolver<Maybe<Array<Maybe<ResolversTypes['Book']>>>, ParentType, ContextType>;
  collection?: Resolver<Maybe<ResolversTypes['Collection']>, ParentType, ContextType, RequireFields<QueryCollectionArgs, 'name'>>;
  collections?: Resolver<Array<ResolversTypes['Collection']>, ParentType, ContextType>;
}>;

export type RichTextResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['RichText'] = ResolversParentTypes['RichText']> = ResolversObject<{
  format?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rendered?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TextResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Text'] = ResolversParentTypes['Text']> = ResolversObject<{
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MyContext> = ResolversObject<{
  Asset?: AssetResolvers<ContextType>;
  Book?: BookResolvers<ContextType>;
  BooleanValue?: BooleanValueResolvers<ContextType>;
  Collection?: CollectionResolvers<ContextType>;
  DateTime?: DateTimeResolvers<ContextType>;
  Entry?: EntryResolvers<ContextType>;
  Field?: FieldResolvers<ContextType>;
  FieldValue?: FieldValueResolvers<ContextType>;
  Json?: JsonResolvers<ContextType>;
  NumberValue?: NumberValueResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RichText?: RichTextResolvers<ContextType>;
  Text?: TextResolvers<ContextType>;
}>;

