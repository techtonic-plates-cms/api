import { Redis as _Redis } from 'ioredis'
import { createRedisCache as _createRedisCache } from '@envelop/response-cache-redis'
import { useResponseCache as _useResponseCache } from '@graphql-yoga/plugin-response-cache'
import SchemaBuilder from "@pothos/core";
import type { GraphQLContext } from '../graphql-context.ts';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    Upload: {
      Input: unknown;
      Output: never;
    };
  };
  Objects: {
    Collection: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };
    Field: {
      id: string;
      name: string;
      label: string | null;
      dataType: string;
      collectionId: string;
    };
    Entry: {
      id: string;
      name: string;
      collectionId: string;
      status: string;
    };
  };
  Interfaces: {
    FieldValue: {
      fieldId: string;
    };
  };
}>({});

builder.queryType();
builder.mutationType();

