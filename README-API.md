## GraphQL API Test

Now you can test the GraphQL API with the exact query structure you wanted:

```graphql
query {
  collection(name: "test") {
    entries {
      field(name: "fieldName", filter: {eq: "test"}) {
        ... on Text {
          text
        }
      }
      field(name: "test2") {
        ... on Asset {
          url
        }
      }
    }
  }
}
```

### How it works:

1. **Collection Query**: `collection(name: "test")` - Gets the collection by name
2. **Entries**: `entries` - Returns all entries in the collection (can be filtered by name/status)
3. **Field with Filter**: `field(name: "fieldName", filter: {eq: "test"})` - Gets the field value and applies filtering at the field level
4. **Field without Filter**: `field(name: "test2")` - Gets the field value without any filtering

### Key Features:

- **Type-safe resolvers** with proper TypeScript types from GraphQL Codegen
- **Field-level filtering** - Each field in an entry can be individually filtered
- **Union types** for different field value types (Text, Asset, Boolean, Number, DateTime, RichText, Json)
- **Flexible filtering** - Supports eq, ne, gt, gte, lt, lte, contains, startsWith, endsWith
- **Database schema** that supports multiple data types with dedicated tables for each type

### To run the API:

1. Set up your database with the migrations: `bun run migrate`
2. Seed the database with test data: `bun run seed-data.ts`
3. Start the server: `bun run dev`
4. Access GraphQL playground at: `http://localhost:4000/graphql`

The field filtering happens at the individual field level within each entry, so if a field filter doesn't match, that specific field will return `null` while other fields in the same entry will still return their values.
