import { requireAuth } from "$graphql-context";
import { builder } from '../builder.ts';
import { User } from './auth.type.ts';

// ============================================================================
// Queries
// ============================================================================

// Query to get current authenticated user
builder.queryField('me', (t) =>
  t.field({
    type: User,
    nullable: true,
    description: 'Get the currently authenticated user',
    resolve: (_parent, _args, context) => {
      requireAuth(context);
      
      if (!context.isAuthenticated || !context.user) {
        return null;
      }
      return context.user;
    },
  })
);
