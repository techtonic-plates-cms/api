import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import type { Request } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolvers } from './resolvers';
import { authRouter } from './routes/auth';
import { sessionMiddleware } from './middleware';
import type { SessionData } from './session/types';
import type { AbacPolicyEvaluator } from './session/permissions';
import { ensureAdminUser } from './utils/admin-setup';

// Define and export the context interface for type generation
export interface AppContext {
    session?: SessionData;
    abacEvaluator?: AbacPolicyEvaluator;
    req: Request;
}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = readFileSync('./src/schema.graphql', { encoding: 'utf-8' });

await ensureAdminUser();

// Set up Express app for REST API
export const app = express();

// Apply CORS and JSON middleware
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

// Add authentication routes
app.use('/auth', authRouter);

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
});

// Start Apollo GraphQL server
await server.start();

// Apply Apollo GraphQL middleware to Express
app.use('/graphql', cors<cors.CorsRequest>(), express.json(), sessionMiddleware, expressMiddleware(server, {
    context: async ({ req }) => {
        console.log('GraphQL context - Authorization header:', req.headers.authorization);
        console.log('GraphQL context - Session:', req.session ? 'Present' : 'Undefined');
        console.log('GraphQL context - ABAC Evaluator:', req.abacEvaluator ? 'Present' : 'Undefined');
        return {
            session: req.session,
            abacEvaluator: req.abacEvaluator,
            req
        };
    }
}));

// Start the combined server
const port = 4000;
app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/`);
    console.log(`📊 GraphQL server ready at: http://localhost:${port}/graphql`);
});