# api

A GraphQL API server with role-based access control and content management capabilities.

## Setup

To install dependencies:

```bash
bun install
```

## Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `MINIO_URL` - MinIO object storage URL
- `MINIO_USER` - MinIO access key
- `MINIO_PASSWORD` - MinIO secret key
- `REDIS_URL` - Redis connection string
- `REDIS_PASSWORD` - Redis password
- `ADMIN_USERNAME` - Default admin username (optional, defaults to "admin")
- `ADMIN_PASSWORD` - Default admin password (optional, defaults to "admin123")

## Database Setup

Run database migrations:

```bash
bun run migrate
```

## Running the Server

To run in development mode:

```bash
bun run dev
```

To run in production:

```bash
bun run start
```

## Admin User

On first startup, the service automatically creates an admin user if one doesn't exist:

- **Username**: `admin` (or value from `ADMIN_USERNAME` env var)
- **Password**: `admin123` (or value from `ADMIN_PASSWORD` env var)
- **Role**: Full administrative access to all resources

⚠️ **Important**: Change the default admin password after first login!

## GraphQL Endpoint

The GraphQL playground is available at: `http://localhost:4000/graphql`

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build TypeScript
- `bun run compile` - Type check and generate GraphQL types
- `bun run generate:graph` - Generate GraphQL types from schema
- `bun run generate:migration` - Generate database migration
- `bun run migrate` - Run database migrations

This project was created using `bun init` in bun v1.2.21. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
