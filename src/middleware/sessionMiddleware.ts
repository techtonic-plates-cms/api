import type { Request, Response, NextFunction } from 'express';
import { sessionManager, AbacPolicyEvaluator } from '../session';
import type { SessionData } from '../session';
import { verifyAccessToken } from '../utils/jwt';

// Extend Express Request interface to include session data
declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
      abacEvaluator?: AbacPolicyEvaluator;
    }
  }
}

export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get session ID from Authorization header or cookie
    const jwt = getJwt(req);
    if (!jwt) {
      return next();
    }

    // Verify and decode the JWT token
    let tokenData;
    try {
      tokenData = verifyAccessToken(jwt);
    } catch (jwtError) {
      // Invalid JWT - continue without authentication
      console.warn('Invalid JWT token:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      return next();
    }

    if (!tokenData || !tokenData.userId) {
      console.warn('JWT token missing userId');
      return next();
    }

    // Get session data from Redis
    const sessionData = await sessionManager.getSession(tokenData.userId);

    if (!sessionData) {
      console.warn('Session not found for userId:', tokenData.userId);
      return next();
    }

    // Verify session user is still active
    if (sessionData.user.status !== 'ACTIVE') {
      console.warn('User account is not active:', sessionData.user.id);
      return next();
    }

    // Attach session data and ABAC evaluator to request
    req.session = sessionData;
    req.abacEvaluator = new AbacPolicyEvaluator(sessionData.user);

    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next();
  }
};


function getJwt(req: Request): string | null {
  // Extract JWT from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();


    return token;

  }

  return null;
}