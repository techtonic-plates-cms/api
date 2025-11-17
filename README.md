# Techtonic API

A headless CMS API built with Deno, GraphQL, and PostgreSQL, featuring attribute-based access control (ABAC) and flexible content modeling.

## Tech Stack

- **Runtime:** Deno 2 with TypeScript
- **API:** GraphQL Yoga
- **Schema:** Pothos GraphQL (code-first)
- **Database:** PostgreSQL with Drizzle ORM
- **Cache/Sessions:** Redis (ioredis)
- **Auth:** JWT tokens with Redis-backed sessions
- **Storage:** MinIO (S3-compatible)

## Features

- **Headless CMS** with dynamic collections, fields, and entries
- **Attribute-Based Access Control (ABAC)** for granular permissions
- **Field-level security** with sensitivity levels, PII flags, and encryption support
- **Session management** with Redis (15min access tokens, 7d refresh tokens)
- **Multiple field types:** text, number, boolean, datetime, relation, asset, rich text, JSON

## Quick Start

### Prerequisites

- Deno 2.x installed
- Docker and Docker Compose (for dev services)

### Setup

1. **Start dev services** (Postgres, Redis, MinIO):
   ```bash
   docker compose -f compose.dev.yaml up -d
   ```

2. **Configure environment** (create `.dev.env` if needed):
   ```env
   DATABASE_URL=postgresql://techtonic:techtonicz@localhost:5432/techtonic
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=techtonicz
   JWT_SECRET=your-secret-key
   ADMIN_NAME=admin
   ADMIN_PASSWORD=admin123
   ```

3. **Run migrations**:
   ```bash
   deno task drizzle-kit generate
   deno task drizzle-kit migrate
   ```

4. **Start the server**:
   ```bash
   deno task dev
   ```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`.

### Default Admin User

On first startup, an admin user is created:
- **Username:** `admin` (or `ADMIN_NAME` from env)
- **Password:** `admin123` (or `ADMIN_PASSWORD` from env)
- Full ABAC permissions via admin role

## Authentication

1. **Login** via REST endpoint:
   ```bash
   POST /auth/login
   { "username": "admin", "password": "admin123" }
   ```
   Returns `accessToken` and `refreshToken`.

2. **Use access token** in GraphQL requests:
   ```
   Authorization: Bearer <accessToken>
   ```

3. **Refresh token** when access token expires:
   ```bash
   POST /auth/refresh
   { "refreshToken": "<refreshToken>" }
   ```

## Project Structure

```
src/
├── main.ts              # Entry point (REST auth + GraphQL server)
├── auth.ts              # JWT generation/verification
├── session.ts           # Redis session storage
├── abac.ts              # ABAC permission evaluation
├── graphql-context.ts   # GraphQL context with auth helpers
├── db/
│   ├── schema.ts        # Drizzle schema (snake_case columns)
│   └── index.ts         # DB client
└── schema/
    ├── builder.ts       # Pothos builder
    ├── index.ts         # Schema aggregation
    ├── auth/            # Auth queries/mutations
    ├── collections/     # CMS entities (collections, entries, fields)
    └── asset/           # Asset management
```

## ABAC Permission System

The API uses attribute-based access control with:
- **Resource types:** `users`, `collections`, `entries`, `assets`, `fields`
- **Actions:** `create`, `read`, `update`, `delete`, `publish`, `configure_fields`
- **Policies** with ALLOW/DENY rules and attribute conditions
- **Roles** that bundle policies
- **Priority-based evaluation** (DENY trumps ALLOW)

Permission checks in resolvers:
```typescript
// Check permission (boolean)
await context.checkPermission('collections', 'read', { id, ownerId });

// Require permission (throws if denied)
await context.requirePermission('entries', 'create');
```

## Development Tasks

```bash
deno task dev              # Start with watch mode
deno task drizzle-kit      # Run Drizzle Kit commands
```

## CMS Data Model

- **Collections** define content schemas (e.g., "Blog Posts", "Products")
- **Fields** define structure with typed values (text, number, relation, etc.)
- **Entries** are content instances with values stored in type-specific tables
- Field-level permissions via `sensitivityLevel`, `isPii`, `isPublic`, `isEncrypted`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `JWT_SECRET` | JWT signing secret | **Required** |
| `ADMIN_NAME` | Default admin username | `admin` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |

## License

[Add your license here]
