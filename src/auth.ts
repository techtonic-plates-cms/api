import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { createSession, createRefreshToken } from './session.ts';

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "default-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  sub: string; // session ID (not user ID anymore!)
  userId: string;
  name: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string; // refresh token ID
  type: "refresh";
}

/**
 * Generate an access token with session ID
 */
export async function generateAccessToken(userId: string, userName: string): Promise<{ token: string; sessionId: string }> {
  // Create session in Redis
  const sessionId = await createSession(userId, userName);
  
  const jwt = await new SignJWT({ userId, name: userName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sessionId) // Session ID is the subject
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);

  return { token: jwt, sessionId };
}

/**
 * Generate a refresh token linked to a session
 */
export async function generateRefreshToken(userId: string, sessionId: string): Promise<string> {
  // Create refresh token in Redis
  const refreshTokenId = await createRefreshToken(userId, sessionId);
  
  const jwt = await new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(refreshTokenId) // Refresh token ID is the subject
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return jwt;
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as TokenPayload;
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  
  if ((payload as RefreshTokenPayload).type !== "refresh") {
    throw new Error("Invalid token type");
  }
  
  return payload as RefreshTokenPayload;
}

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
