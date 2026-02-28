# AGENTS.md - Agent Coding Guidelines

This file contains essential information for agentic coding assistants working on this codebase.

## Build & Development Commands

```bash
# Start dev server with hot reload
deno task dev

# Database migrations (Drizzle Kit)
deno task drizzle-kit generate      # Generate migration from schema changes
deno task drizzle-kit migrate        # Apply pending migrations
deno task drizzle-kit push           # Push schema changes directly (dev only)
deno task drizzle-kit studio         # Open Drizzle Studio UI
deno task drizzle-kit introspect     # Introspect existing database

# Type checking
deno check src/main.ts               # Type check the codebase
```

**Note**: No test framework is currently configured. When adding tests, check for a test setup before creating test files.

## Tech Stack Overview

- **Runtime**: Deno 2 (NOT Node.js - never use `npm` or `node` commands)
- **API**: GraphQL Yoga with Pothos (code-first schema builder)
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Sessions**: Redis (ioredis)
- **Auth**: JWT tokens with Redis-backed sessions
- **Permissions**: Attribute-Based Access Control (ABAC)

## Import Conventions

```typescript
// Local imports MUST include .ts extension
import { foo } from './bar.ts';
import { builder } from '../builder.ts';

// Use import aliases defined in deno.json
import { db } from '$db/index.ts';
import { redis } from '$redis';
import { builder } from '$builder';
import type { GraphQLContext } from '$graphql-context';

// npm packages use npm: specifier (versions in deno.json)
import { GraphQLError } from 'graphql';
import SchemaBuilder from '@pothos/core';
```

## File Naming Conventions

**GraphQL Schema Files** (suffix-based pattern):
```
entity/
├── entity.type.ts          # Pothos type definitions
├── entity.queries.ts       # Query field definitions
├── entity.mutations.ts     # Mutation field definitions
├── entity-feature.resolver.ts  # Specialized resolvers (kebab-case)
└── feature.input.ts        # Input types for mutations/queries
```

**Root-level files**: Use kebab-case
- `graphql-context.ts` (not `graphqlContext.ts`)
- Core services: single words (`auth.ts`, `session.ts`, `redis.ts`, `abac.ts`, `s3.ts`)

**Examples from codebase**:
- `collection/collection.type.ts` - Collection GraphQL type
- `collection/collection.queries.ts` - Collection query fields
- `collection/collection.mutations.ts` - Collection mutation fields
- `entry/entry-field.resolver.ts` - Entry field value resolver
- `field/filters.input.ts` - Filter input types

## Code Style Guidelines

### TypeScript & Types
- Always type Pothos builder with `GraphQLContext` from `graphql-context.ts`
- Define types before queries/mutations to avoid circular imports
- Use `t.exposeString('id')` for ID fields when you want them as String, `t.exposeID('id')` for GraphQL ID type
- Database columns are snake_case, TypeScript properties are camelCase (Drizzle auto-converts)

### Pothos Schema Pattern
```typescript
// 1. Define type in entity.type.ts
export const EntityType = builder.objectRef<{ id: string; name: string }>('Entity');

EntityType.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    name: t.exposeString('name', { nullable: false }),
  }),
});

// 2. Add queries in entity.queries.ts
builder.queryField('entity', (t) =>
  t.field({
    type: EntityType,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_parent, args, context) => {
      requireAuth(context);
      await context.requirePermission('entities', 'read', { id: args.id });
      // ...
    },
  })
);

// 3. Add mutations in entity.mutations.ts
builder.mutationField('createEntity', (t) =>
  t.field({
    type: EntityType,
    args: { input: t.arg({ type: CreateEntityInput, required: true }) },
    resolve: async (_parent, args, context) => {
      requireAuth(context);
      await context.requirePermission('entities', 'create');
      // ...
    },
  })
);
```

### Permission & Auth Patterns
```typescript
// Always require auth first in protected resolvers
requireAuth(context);

// Check permission (returns boolean)
const canRead = await context.checkPermission('collections', 'read', {
  id: collection.id,
  ownerId: collection.createdBy,
});

// Require permission (throws GraphQLError if denied)
await context.requirePermission('users', 'create');
await context.requirePermission('entries', 'update', { id: entryId });
```

**Resource types**: `users`, `collections`, `entries`, `assets`, `fields`
**Actions**: `create`, `read`, `update`, `delete`, `publish`, `unpublish`, `schedule`, `archive`, `restore`, `draft`, `ban`, `unban`, `activate`, `deactivate`, `upload`, `download`, `transform`, `configure_fields`, `manage_schema`

### Error Handling
```typescript
// Use GraphQLError with proper extensions
throw new GraphQLError('Authentication required', {
  extensions: {
    code: 'UNAUTHENTICATED',
    http: { status: 401 },
  },
});

throw new GraphQLError('Permission denied', {
  extensions: {
    code: 'FORBIDDEN',
    http: { status: 403 },
    resource: 'collections',
    action: 'delete',
  },
});
```

### Database Patterns
```typescript
// UUID generation with Drizzle
import { defaultRandom } from 'drizzle-orm/pg-core';
id: uuid().primaryKey().defaultRandom(),

// Query building with Drizzle
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.status, 'ACTIVE'))
  .limit(10);

// Use type assertions when building dynamic queries
if (args.filter) {
  queryBuilder = queryBuilder.where(eq(table.status, args.filter)) as typeof queryBuilder;
}
```

### Schema Registration
**IMPORTANT**: After creating new schema modules, import them in `src/schema/index.ts` for side-effect registration:
```typescript
// src/schema/index.ts
import './auth/auth.type.ts';
import './auth/auth.queries.ts';
import './auth/auth.mutations.ts';
// ... add new imports here
```

## Architecture Notes

### Session Management
- Access tokens: 15min TTL (JWT `sub` contains **session ID**, not user ID)
- Refresh tokens: 7 day TTL
- Sessions stored in Redis, verified on each request
- Always resolve user via Redis using sessionId, not directly from JWT

### ABAC Permission System
- Evaluation: DENY policies first, then ALLOW policies (higher priority wins)
- Default: deny if no policies match
- Policies assigned to Roles (which users have) or directly to Users
- Field-level permissions: Check `sensitivityLevel`, `isPii`, `isPublic`, `isEncrypted` flags

### Database Schema
- All schema definitions in `src/db/schema.ts`
- Centralized enums: `userStatusEnum`, `permissionActionEnum`, `baseResourceEnum`, etc.
- Use `eq()`, `and()`, `or()`, `inArray()` from `drizzle-orm` for query building
- For time-based queries, use `gt()`, `lt()`, `gte()`, `lte()` from Drizzle

## Common Pitfalls

1. **Don't use Node.js APIs** - This is Deno. Use `@std/*` for standard library, Web APIs for fetch/headers/etc.
2. **Don't forget .ts extensions** - All local imports need explicit `.ts` extensions
3. **Session IDs vs User IDs** - JWT `sub` is the session ID, resolve to user via Redis
4. **Always check permissions** - Never skip ABAC checks in resolvers
5. **Import new schema files** - Add imports to `src/schema/index.ts` after creating new GraphQL types/queries/mutations
6. **Use defaultRandom() for UUIDs** - Not `gen_random_uuid()`

## Environment Setup

Required `.dev.env` variables:
```
DATABASE_URL=postgresql://techtonic:techtonicz@localhost:5432/techtonic
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=techtonicz
JWT_SECRET=your-secret-key-here
ADMIN_NAME=admin
ADMIN_PASSWORD=admin123
```

Start services: `docker compose -f compose.dev.yaml up -d`
