# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GraphQL API server built with Apollo Server, Express, and Drizzle ORM. It provides a comprehensive content management system with advanced attribute-based access control (ABAC) permissions. The system supports collections, entries with typed field values, user management, roles, and granular policies.

## Development Commands

### Primary Commands
- `bun run dev` - Start development server with hot reload and GraphQL type generation
- `bun run start` - Start production server
- `bun run build` - Build TypeScript (type checking only)
- `bun run compile` - Run GraphQL codegen and TypeScript type checking

### Database Operations
- `bun run generate:migration` - Generate new Drizzle migration
- `bun run migrate` - Apply database migrations

### GraphQL Operations
- `bun run generate:graph` - Generate GraphQL types from schema (runs automatically in dev/build)

## Architecture Overview

### GraphQL Schema Structure
The API uses a single `src/schema.graphql` file that defines:
- **Collections**: Content containers with customizable field schemas
- **Entries**: Content items within collections with typed field values
- **Fields**: Schema definitions for collection structure (text, typst_text, boolean, number, date_time, relation, asset, rich_text, json, etc.)
- **Users**: User accounts with status management
- **Roles**: Permission groupings
- **Policies**: ABAC policies with rules for fine-grained access control

### Database Schema (Drizzle ORM)
Located in `src/db/schema.ts`. Key architectural decisions:
- **ABAC Permission System**: Comprehensive attribute-based access control with policies, rules, and evaluation caching
- **Type-Safe Field Values**: Separate tables for each data type (entry_texts, entry_booleans, entry_numbers, etc.)
- **Resource Ownership Tracking**: Dynamic permission assignments based on resource ownership
- **Audit Logging**: Complete audit trail for permission evaluations

### Resolver Organization
Resolvers are organized hierarchically in `src/resolvers/`:
- `queries/` - Read operations (collection, user management queries)
- `mutations/` - Write operations organized by domain:
  - `content/` - Collection and entry management
  - `admin/` - Administrative operations (users, roles, policies)
  - `self.ts` - User account self-management

### Code Generation
- GraphQL types are auto-generated to `src/.graphql/resolvers-types.ts` via GraphQL Code Generator
- Configuration in `codegen.yml` ensures type safety across resolvers
- Context type (`AppContext`) includes session data and ABAC evaluator

### Authentication & Sessions
- JWT-based authentication via `/auth` REST endpoints
- Session middleware provides user context and ABAC policy evaluator
- GraphQL context includes session data for resolver access control

### Key Dependencies
- **Apollo Server**: GraphQL server implementation
- **Drizzle ORM**: Type-safe database queries with PostgreSQL
- **Express**: REST API for authentication endpoints
- **Bun**: Runtime and package manager
- **Redis**: Session storage and caching
- **MinIO**: Object storage for assets

## Important Patterns

### Field Value Storage
Each field type has a dedicated database table for type safety and query optimization. When working with entries, use the appropriate table based on the field's `dataType`.

### Permission Checking
The ABAC system evaluates permissions based on:
- User attributes (id, roles, status)
- Resource attributes (collection, entry, field properties)
- Environmental context (time, IP, session)
- Action types (create, read, update, delete, publish, etc.)

### Error Handling
Resolvers should throw appropriate GraphQL errors for permission denied, not found, and validation failures.

### Type Safety
Always run `bun run compile` before committing to ensure GraphQL types are current and TypeScript compilation succeeds.
