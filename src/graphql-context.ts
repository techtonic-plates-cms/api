import { Plugin } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { verifyAccessToken, TokenPayload } from './auth.ts';
import { getSession } from './session.ts';
import { checkPermission as checkPerm, requirePermission as requirePerm, type PermissionContext, type ResourceType, type ActionType } from './abac.ts';

export interface GraphQLContext {
  user?: {
    id: string;
    name: string;
    sessionId: string;
  };
  isAuthenticated: boolean;
  checkPermission: (resource: ResourceType, action: ActionType, resourceData?: Record<string, unknown>) => Promise<boolean>;
  requirePermission: (resource: ResourceType, action: ActionType, resourceData?: Record<string, unknown>) => Promise<void>;
}

/**
 * GraphQL Yoga plugin to handle JWT authentication with Redis sessions
 */
export function useAuth(): Plugin<GraphQLContext> {
  return {
    async onContextBuilding({ context, extendContext }) {
      const request = context.request as Request;
      const authorization = request.headers.get('authorization');
      
      if (!authorization) {
        // No auth header - allow request but mark as unauthenticated
        extendContext({ 
          isAuthenticated: false,
          checkPermission: () => Promise.resolve(false),
          requirePermission: () => Promise.reject(new GraphQLError('Authentication required', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            },
          })),
        });
        return;
      }

      // Extract token from "Bearer <token>"
      const [scheme, token] = authorization.split(' ');
      
      if (scheme !== 'Bearer' || !token) {
        extendContext({ 
          isAuthenticated: false,
          checkPermission: () => Promise.resolve(false),
          requirePermission: () => Promise.reject(new GraphQLError('Authentication required', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            },
          })),
        });
        return;
      }

      try {
        // Verify JWT token
        const payload: TokenPayload = await verifyAccessToken(token);
        
        // The subject is now the session ID
        const sessionId = payload.sub;
        
        // Get session from Redis
        const session = await getSession(sessionId);

        if (!session) {
          // Session doesn't exist or has expired
          extendContext({ 
            isAuthenticated: false,
            checkPermission: () => Promise.resolve(false),
            requirePermission: () => Promise.reject(new GraphQLError('Authentication required', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              },
            })),
          });
          return;
        }

        // Add user to context with permission helpers
        extendContext({
          user: {
            id: session.userId,
            name: session.userName,
            sessionId,
          },
          isAuthenticated: true,
          checkPermission: (resource: ResourceType, action: ActionType, resourceData?: Record<string, unknown>) => {
            const ctx: PermissionContext = {
              userId: session.userId,
              resource: {
                type: resource,
                ...resourceData,
              },
              action,
            };
            return checkPerm(ctx);
          },
          requirePermission: (resource: ResourceType, action: ActionType, resourceData?: Record<string, unknown>) => {
            const ctx: PermissionContext = {
              userId: session.userId,
              resource: {
                type: resource,
                ...resourceData,
              },
              action,
            };
            return requirePerm(ctx);
          },
        });
      } catch (error) {
        // Invalid or expired token
        console.error('JWT verification failed:', error);
        extendContext({ 
          isAuthenticated: false,
          checkPermission: () => Promise.resolve(false),
          requirePermission: () => Promise.reject(new GraphQLError('Authentication required', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            },
          })),
        });
      }
    },
  };
}

/**
 * Helper to require authentication in resolvers
 */
export function requireAuth(context: GraphQLContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return context.user;
}
