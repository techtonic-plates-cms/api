import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolvers } from './graphql/resolvers';

// Define and export the context interface for type generation
export interface MyContext {
    // Add any shared context properties here
    // For example: user authentication, dataSources, etc.
}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = readFileSync('./src/schema.graphql', { encoding: 'utf-8' });


// Set up Express app for REST API
export const app = express();

// Apply CORS and JSON middleware
app.use(cors());
app.use(express.json());
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
});

// Start Apollo GraphQL server
await server.start();

// Apply Apollo GraphQL middleware to Express
app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({
        // Add any context properties here
        // For example: token: req.headers.authorization
    })
}));

// Start the combined server
const port = 4000;
app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/`);
    console.log(`📊 GraphQL server ready at: http://localhost:${port}/graphql`);
});