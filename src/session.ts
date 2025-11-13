import { redis } from './redis.ts';

export interface SessionData {
  userId: string;
  userName: string;
  createdAt: number;
  expiresAt: number;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  createdAt: number;
}

const SESSION_PREFIX = 'session:';
const REFRESH_TOKEN_PREFIX = 'refresh:';
const USER_SESSIONS_PREFIX = 'user:sessions:';

// Session TTL: 15 minutes (matches access token)
const SESSION_TTL = 60 * 15;

// Refresh token TTL: 7 days
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7;

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new session in Redis
 */
export async function createSession(userId: string, userName: string): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();
  
  const sessionData: SessionData = {
    userId,
    userName,
    createdAt: now,
    expiresAt: now + (SESSION_TTL * 1000),
  };

  // Store session with TTL
  await redis.setex(
    `${SESSION_PREFIX}${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  );

  // Add session to user's active sessions set
  await redis.sadd(`${USER_SESSIONS_PREFIX}${userId}`, sessionId);
  await redis.expire(`${USER_SESSIONS_PREFIX}${userId}`, REFRESH_TOKEN_TTL);

  return sessionId;
}

/**
 * Get session data from Redis
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  
  if (!data) {
    return null;
  }

  return JSON.parse(data) as SessionData;
}

/**
 * Refresh/extend a session's TTL
 */
export async function refreshSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  
  if (!session) {
    return false;
  }

  const now = Date.now();
  session.expiresAt = now + (SESSION_TTL * 1000);

  await redis.setex(
    `${SESSION_PREFIX}${sessionId}`,
    SESSION_TTL,
    JSON.stringify(session)
  );

  return true;
}

/**
 * Delete a session from Redis
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  
  if (session) {
    // Remove from user's active sessions
    await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
  }

  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

/**
 * Store refresh token in Redis
 */
export async function createRefreshToken(userId: string, sessionId: string): Promise<string> {
  const refreshTokenId = generateSessionId();
  const now = Date.now();

  const tokenData: RefreshTokenData = {
    userId,
    sessionId,
    createdAt: now,
  };

  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${refreshTokenId}`,
    REFRESH_TOKEN_TTL,
    JSON.stringify(tokenData)
  );

  return refreshTokenId;
}

/**
 * Get refresh token data from Redis
 */
export async function getRefreshToken(refreshTokenId: string): Promise<RefreshTokenData | null> {
  const data = await redis.get(`${REFRESH_TOKEN_PREFIX}${refreshTokenId}`);
  
  if (!data) {
    return null;
  }

  return JSON.parse(data) as RefreshTokenData;
}

/**
 * Delete a refresh token from Redis
 */
export async function deleteRefreshToken(refreshTokenId: string): Promise<void> {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshTokenId}`);
}

/**
 * Delete all sessions for a user (logout all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  
  for (const sessionId of sessionIds) {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
  }

  await redis.del(`${USER_SESSIONS_PREFIX}${userId}`);
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  const sessions: SessionData[] = [];

  for (const sessionId of sessionIds) {
    const session = await getSession(sessionId);
    if (session) {
      sessions.push(session);
    }
  }

  return sessions;
}
