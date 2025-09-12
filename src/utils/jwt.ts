import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-default-refresh-secret-key';
const JWT_EXPIRES_IN ='15m';
const JWT_REFRESH_EXPIRES_IN =  '30d';

export interface TokenPayload {
  userId: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokenPair(payload: TokenPayload): TokenPair {
  const accessTokenOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    subject: payload.userId,
    algorithm: 'HS256'
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    subject: payload.userId,
    algorithm: 'HS256'
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, accessTokenOptions);
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, refreshTokenOptions);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    console.log(jwt.verify(token, JWT_SECRET))
    
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch(e) {
    // Only log if it's not a common validation error
  
      console.error('JWT verification error:', e);
    
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {

    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch(e) {
    // Only log if it's not a common validation error
    if (e instanceof Error && !e.message.includes('jwt malformed')) {
      console.error('JWT refresh token verification error:', e.message);
    }
    return null;
  }
}