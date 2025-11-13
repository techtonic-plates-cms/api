# Copilot Instructions for Techtonic API# Copilot Instructions for this API



## Architecture Overview## Project Snapshot

- Deno 2 runtime with TypeScript entrypoint `src/main.ts` creating a GraphQL Yoga server.

This is a **headless CMS API** built with:- GraphQL schema assembled via Pothos in `src/schema/builder.ts`; each module (e.g. `src/schema/collections.ts`) mutates the shared `builder` on import and `src/schema/index.ts` exports `builder.toSchema()`.

- **Deno** runtime (not Node.js - use `deno.json` tasks, not `package.json` scripts)- Data layer uses Drizzle ORM against Postgres with schema definitions centralised in `src/db/schema.ts` and connection factory in `src/db/index.ts` (snake_case columns, UUID ids).

- **GraphQL Yoga** for the GraphQL server- Redis client lives in `src/redis.ts`; future cache plugins (`@graphql-yoga/plugin-response-cache` + Redis) are prewired in imports but not yet instantiated.

- **Pothos GraphQL** for code-first schema building

- **Drizzle ORM** for PostgreSQL database management## Local Environment & Services

- **Redis** (via ioredis) for session management- `deno task dev` launches the GraphQL server with file watching and `-A` permissions; requires populated `.dev.env`.

- **JOSE** for JWT token handling- `compose.dev.yaml` provisions Postgres, Redis, MinIO, and Redis Insight; default credentials are inlined, override through `.dev.env` or `docker compose --env-file`.

- The dev container image installs the global `drizzle-kit`; the repo expects Deno-compatible npm modules resolved via `deno.json` imports (note explicit `.ts` extensions on local paths).

The system implements an **Attribute-Based Access Control (ABAC)** permission system with granular field-level security.

## Database & Migrations

## Project Structure- Update Drizzle models only in `src/db/schema.ts`; keep enums/tables colocated so `drizzle-kit` can introspect.

- Run migrations or generate SQL via `deno task drizzle-kit <command>` (same CLI flags as `drizzle-kit` npm, e.g. `deno task drizzle-kit generate`).

```- `src/db/index.ts` reads `DATABASE_URL`; ensure Postgres container exposes it (see `.dev.env`).

src/

├── main.ts              # Entry point: REST auth endpoints + GraphQL server## GraphQL Schema Patterns

├── auth.ts              # JWT generation/verification with session management- Declare new object types and fields through the global `builder`; define shared types/helpers near schema modules to avoid circular imports.

├── session.ts           # Redis session storage (TTL: 15min access, 7d refresh)- Add query/mutation subscriptions by calling `builder.queryField`, `builder.mutationField`, etc., and ensure the module is imported from `src/schema/index.ts` for side-effect registration.

├── redis.ts             # Redis client configuration- Use typed data loaders or Drizzle queries inside resolvers; leverage enums from `src/db/schema.ts` to avoid mismatched literals.

├── abac.ts              # ABAC permission evaluation engine- Keep resolver return types aligned with Yoga expectations (async functions returning plain data) and respect the `String`/`ID` etc. case defined in Pothos configs.

├── graphql-context.ts   # GraphQL context with auth + permission helpers

├── db/## Operational Notes

│   ├── schema.ts        # Drizzle schema: users, ABAC tables, CMS collections- Redis connection defaults to localhost:6379 with optional password; update `REDIS_*` env vars when targeting the compose service (password `techtonicz`).

│   └── index.ts         # DB client export- Server logs the Yoga URL on start; hot reload is automatic under `deno task dev`.

└── schema/- When adding npm dependencies, prefer `deno add` or editing `deno.json` imports to bind a stable version.

    ├── builder.ts       # Pothos builder with GraphQL context typing- Type-check or lint ad hoc via `deno check src/main.ts`; there is currently no dedicated test suite.

    ├── index.ts         # Schema aggregation
    ├── auth.ts          # Auth-related queries/mutations
    └── collections/     # CMS entity types, queries, mutations
```

## Core Workflows

### Running the Server

```bash
deno task dev              # Start with watch mode
deno task drizzle-kit      # Run Drizzle Kit commands
```

**Default Admin User** is auto-created on startup:
- Username: `admin` (or `ADMIN_NAME` env var)
- Password: `admin123` (or `ADMIN_PASSWORD` env var)
- Has full ABAC permissions via admin role

### Authentication Flow

Uses **Redis-backed sessions**, not stateless JWTs:
1. `POST /auth/login` → Returns `accessToken` (15min, contains sessionId) + `refreshToken` (7d)
2. Access token's `sub` is the **session ID**, verified against Redis in `graphql-context.ts`
3. `POST /auth/refresh` → Exchange refresh token for new access token
4. `POST /auth/logout` → Deletes current session
5. `POST /auth/logout-all` → Deletes all user sessions

**GraphQL requests**: Add `Authorization: Bearer <accessToken>` header. Context provides `context.user` and permission helpers.

### ABAC Permission System

**Permission checking happens in resolvers** via `context.checkPermission()` or `context.requirePermission()`:

```typescript
// Check permission (returns boolean)
const canRead = await context.checkPermission('collections', 'read', {
  id: collection.id,
  ownerId: collection.createdBy,
});

// Require permission (throws if denied)
await context.requirePermission('users', 'create');
```

**Resource types**: `users`, `collections`, `entries`, `assets`, `fields`  
**Actions**: `create`, `read`, `update`, `delete`, `publish`, `configure_fields`, etc.

**ABAC data model** (`src/db/schema.ts`):
- **Policies** define ALLOW/DENY rules for resource+action combinations
- **Policy Rules** contain attribute-based conditions (e.g., `subject.role eq "admin"`)
- Policies assigned to **Roles** (which users have) or directly to **Users**
- **Priority** matters: Higher priority wins, DENY beats ALLOW

Evaluation logic in `src/abac.ts`:
1. Get user's policies (from roles + direct assignments)
2. Filter by resource type + action
3. Evaluate DENY policies first (immediate rejection)
4. Then ALLOW policies (first match wins)
5. No match = deny

## Database & Schema Patterns

### Drizzle Conventions

- **snake_case columns** in database (via `casing: 'snake_case'` in `drizzle.config.ts`)
- **camelCase** in TypeScript (Drizzle auto-converts)
- Run migrations: `deno task drizzle-kit generate` → `deno task drizzle-kit migrate`

### CMS Data Model

**Collections** are content schemas (like "Blog Posts" or "Products")  
**Fields** define collection structure with data types: `text`, `number`, `boolean`, `date_time`, `relation`, `asset`, `rich_text`, `json`, etc.  
**Entries** are content instances with values stored in type-specific tables:
- `entry_texts`, `entry_booleans`, `entry_numbers`, `entry_datetimes`
- `entry_relations` (for entry-to-entry links)
- `entry_rich_texts` (HTML/Markdown)
- `entry_json_data` (complex objects, lists)
- `entry_assets` (file references)

**Field-level permissions**: Fields have `sensitivityLevel`, `isPii`, `isPublic`, `isEncrypted` flags checked during ABAC evaluation.

## GraphQL Schema Patterns

### Pothos Builder Usage

Define types separately from queries/mutations:

```typescript
// 1. Define object ref in *.type.ts
export const CollectionType = builder.objectRef<{
  id: string;
  name: string;
}>('Collection');

CollectionType.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    // ... field-level permission filtering in resolvers
  }),
});

// 2. Add queries in *.queries.ts
builder.queryField('collection', (t) =>
  t.field({
    type: CollectionType,
    resolve: async (_parent, args, context) => {
      requireAuth(context); // Throws if unauthenticated
      await context.requirePermission('collections', 'read', { id, ownerId });
      // ...
    },
  })
);
```

### Context Helpers

- `requireAuth(context)` - Throws if not authenticated
- `context.checkPermission(resource, action, data?)` - Returns boolean
- `context.requirePermission(resource, action, data?)` - Throws if denied
- `context.user` - `{ id, name, sessionId }` when authenticated

## Environment & Infrastructure

**Dev container** provides Postgres + Redis + MinIO via Docker Compose.

**Required env vars** (see `compose.dev.yaml`):
- `DATABASE_URL` - Postgres connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET` - For token signing
- `ADMIN_NAME`, `ADMIN_PASSWORD` - Default admin credentials

## Key Conventions

### File Naming

The codebase follows a **suffix-based naming convention** for GraphQL schema files:

```
entity/
├── entity.type.ts          # Pothos type definitions
├── entity.queries.ts       # Query field definitions
├── entity.mutations.ts     # Mutation field definitions
├── entity-feature.resolver.ts  # Specialized resolvers (kebab-case)
└── feature.input.ts        # Input types for mutations/queries
```

**Examples from the codebase:**
- `collection/collection.type.ts` - Collection GraphQL type
- `collection/collection.queries.ts` - Collection query fields
- `collection/collection.mutations.ts` - Collection mutation fields
- `entry/entry-field.resolver.ts` - Entry field value resolver
- `field/field-value.types.ts` - Field value type definitions
- `field/filters.input.ts` - Filter input types

**Root-level files** use simple kebab-case:
- `graphql-context.ts` (not `graphqlContext.ts`)
- Core services use single words: `auth.ts`, `session.ts`, `redis.ts`, `abac.ts`

### Code Conventions

- **Import paths**: Use `.ts` extensions and `./` for relative imports
- **Deno imports**: Import npm packages via `npm:` specifier (defined in `deno.json`)
- **No Node.js APIs**: Use Deno standard library (`@std/*`) and Web APIs
- **GraphQL context typing**: Always type Pothos builder with `GraphQLContext` from `graphql-context.ts`
- **Permission checks**: Never skip ABAC checks in resolvers - always verify read/write access
- **Session lifecycle**: Access tokens are short-lived (15min), refresh tokens extend sessions (7d)

## Common Pitfalls

- Don't use `npm` or `node` commands - this is a Deno project
- Session IDs are in JWT `sub`, not user IDs - always resolve via Redis
- ABAC denies by default - ensure policies exist for new resources/actions
- Field visibility requires separate permission checks beyond collection access
- Drizzle uses `defaultRandom()` for UUIDs, not `gen_random_uuid()`
