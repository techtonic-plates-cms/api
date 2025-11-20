import { GraphQLError } from 'graphql';
import { builder } from '../builder.ts';
import { requireAuth } from '../../graphql-context.ts';
import { db } from '../../db/index.ts';
import { usersTable } from '../../db/schema.ts';
import { verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../auth.ts';
import { LoginPayload, RefreshPayload, LogoutPayload } from './auth.type.ts';
import { getRefreshToken, deleteSession, deleteAllUserSessions, getSession } from '../../session.ts';
import { eq } from 'drizzle-orm';

// ============================================================================
// Auth Mutations
// ============================================================================

// Login mutation - authenticate user and return tokens
builder.mutationField('login', (t) =>
  t.field({
    type: LoginPayload,
    description: 'Authenticate user with name and password',
    args: {
      name: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    nullable: false,
    resolve: async (_parent, args, _context) => {
      const { name, password } = args;

      // Find user by name
      const users = await db.select().from(usersTable).where(eq(usersTable.name, name));
      const user = users[0];

      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid credentials', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }

      // Check user status
      if (user.status !== 'ACTIVE') {
        throw new GraphQLError('User account is not active', {
          extensions: {
            code: 'FORBIDDEN',
            http: { status: 403 },
            userStatus: user.status,
          },
        });
      }

      // Generate tokens with Redis session
      const { token: accessToken, sessionId } = await generateAccessToken(user.id, user.name);
      const refreshToken = await generateRefreshToken(user.id, sessionId);

      // Update last login time
      await db.update(usersTable)
        .set({ lastLoginTime: new Date() })
        .where(eq(usersTable.id, user.id));

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          status: user.status,
        },
      };
    },
  })
);

// Refresh mutation - exchange refresh token for new access token
builder.mutationField('refresh', (t) =>
  t.field({
    type: RefreshPayload,
    description: 'Exchange refresh token for a new access token',
    args: {
      refreshToken: t.arg.string({ required: true }),
    },
    nullable: false,
    resolve: async (_parent, args, _context) => {
      const { refreshToken } = args;

      try {
        // Verify JWT refresh token
        const payload = await verifyRefreshToken(refreshToken);
        const refreshTokenId = payload.sub;

        // Get refresh token data from Redis
        const refreshTokenData = await getRefreshToken(refreshTokenId);

        if (!refreshTokenData) {
          throw new GraphQLError('Invalid or expired refresh token', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            },
          });
        }

        // Get user from database
        const users = await db.select().from(usersTable).where(eq(usersTable.id, refreshTokenData.userId));
        const user = users[0];

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: {
              code: 'NOT_FOUND',
              http: { status: 404 },
            },
          });
        }

        // Check user status
        if (user.status !== 'ACTIVE') {
          throw new GraphQLError('User account is not active', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
              userStatus: user.status,
            },
          });
        }

        // Generate new access token (creates new session)
        const { token: accessToken } = await generateAccessToken(user.id, user.name);

        return {
          accessToken,
        };
      } catch (error) {
        // If it's already a GraphQLError, rethrow it
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        // Handle JWT verification errors
        throw new GraphQLError('Invalid or expired refresh token', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }
    },
  })
);

// Logout mutation - invalidate current session
builder.mutationField('logout', (t) =>
  t.field({
    type: LogoutPayload,
    description: 'Logout and invalidate the current session',
    resolve: async (_parent, _args, context) => {
      // Require authentication
      requireAuth(context);

      if (!context.user?.sessionId) {
        throw new GraphQLError('No active session', {
          extensions: {
            code: 'BAD_REQUEST',
            http: { status: 400 },
          },
        });
      }

      // Delete session from Redis
      await deleteSession(context.user.sessionId);

      return {
        message: 'Logged out successfully',
      };
    },
  })
);

// Logout all sessions mutation - invalidate all user sessions
builder.mutationField('logoutAll', (t) =>
  t.field({
    type: LogoutPayload,
    description: 'Logout from all sessions',
    resolve: async (_parent, _args, context) => {
      // Require authentication
      requireAuth(context);

      if (!context.user?.sessionId) {
        throw new GraphQLError('No active session', {
          extensions: {
            code: 'BAD_REQUEST',
            http: { status: 400 },
          },
        });
      }

      // Get session to find user ID
      const session = await getSession(context.user.sessionId);

      if (!session) {
        throw new GraphQLError('Invalid session', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }

      // Delete all user sessions from Redis
      await deleteAllUserSessions(session.userId);

      return {
        message: 'All sessions logged out successfully',
      };
    },
  })
);
