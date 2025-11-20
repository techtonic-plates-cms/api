import { builder } from '../builder.ts';

// ============================================================================
// User Type is now defined in auth/user/user.type.ts
// Import it here for re-export compatibility
// ============================================================================

import { User } from './user/user.type.ts';
export { User };

// ============================================================================
// Auth Payload Types
// ============================================================================

// Login response payload
export const LoginPayload = builder.objectRef<{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    status: string;
  };
}>('LoginPayload').implement({
  fields: (t) => ({
    accessToken: t.exposeString('accessToken', {nullable: false}),
    refreshToken: t.exposeString('refreshToken', {nullable: false}),
    user: t.field({
      type: User,
      resolve: (parent) => ({
        id: parent.user.id,
        name: parent.user.name,
      }),
    }),
  }),
});

// Refresh token response payload
export const RefreshPayload = builder.objectRef<{
  accessToken: string;
}>('RefreshPayload').implement({
  fields: (t) => ({
    accessToken: t.exposeString('accessToken', {nullable: false}),
  }),
});

// Logout response payload
export const LogoutPayload = builder.objectRef<{
  message: string;
}>('LogoutPayload').implement({
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});
