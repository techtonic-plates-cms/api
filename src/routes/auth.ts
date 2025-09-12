import { Router } from 'express';
import { hash, verify } from 'argon2';
import { db } from '../db/index';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateTokenPair, verifyRefreshToken, verifyAccessToken } from '../utils/jwt';
import { sessionManager } from '../middleware';

const router = Router();

interface LoginRequest {
  name: string;
  password: string;
}

interface RefreshRequest {
  refreshToken: string;
}

router.post('/login', async (req, res) => {
  try {
    const { name, password }: LoginRequest = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, name))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    await db
      .update(usersTable)
      .set({ lastLoginTime: new Date() })
      .where(eq(usersTable.id, user.id));

    const sessionId = await sessionManager.createSession(user.id);

    const tokens = generateTokenPair({
      userId: user.id,
      name: user.name,
    });

    // Create session
    res.json({
      user: {
        id: user.id,
        name: user.name,
        status: user.status,
        creationTime: user.creationTime,
        lastLoginTime: new Date(),
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken }: RefreshRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }



    // Create new session
    const sessionId = await sessionManager.createSession(user.id);
    const tokens = generateTokenPair({
      userId: user.id,
      name: user.name,

    });
    res.json({
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (sessionId) {
      await sessionManager.destroySession(sessionId);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout-all', async (req, res) => {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (sessionId) {
      const sessionData = await sessionManager.getSession(sessionId);
      if (sessionData) {
        await sessionManager.destroyAllUserSessions(sessionData.user.id);
      }
    }

    res.json({ message: 'Logged out from all sessions successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getSessionIdFromRequest(req: any): string | null {
  // Try Authorization header first (Bearer token) - verify JWT and extract sessionId
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyAccessToken(token);
    if (payload && payload.userId) {
      return payload.userId;
    }
  }

  // Try session cookie (direct session ID)
  const sessionCookie = req.cookies?.session;
  if (sessionCookie) {
    return sessionCookie;
  }

  // Try custom session header (direct session ID)
  const sessionHeader = req.headers['x-session-id'];
  if (sessionHeader && typeof sessionHeader === 'string') {
    return sessionHeader;
  }

  return null;
}

export { router as authRouter };