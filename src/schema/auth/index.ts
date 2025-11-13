// ============================================================================
// Auth Module Index
// ============================================================================
// This file imports all auth-related schema modules to ensure they are
// registered with the Pothos builder

// User management (must be imported first as it defines the User type)
import './user/user.type.ts';
import './user/user.queries.ts';
import './user/user.mutations.ts';

// Core auth types and operations (login, logout, refresh, me)
// These depend on User type being defined
import './auth.type.ts';
import './auth.queries.ts';
import './auth.mutations.ts';

// Role management
import './role/role.type.ts';
import './role/role.queries.ts';
import './role/role.mutations.ts';

// ABAC Policy management
import './policy/policy.type.ts';
import './policy/policy.queries.ts';
import './policy/policy.mutations.ts';

// Export key types for use in other modules
export { User } from './user/user.type.ts';
export { LoginPayload, RefreshPayload, LogoutPayload } from './auth.type.ts';
export { UserStatusEnum } from './user/user.type.ts';
export { RoleType } from './role/role.type.ts';
export {
  PolicyType,
  PolicyRuleType,
  PermissionEffectEnum,
  BaseResourceEnum,
  PermissionActionEnum,
  LogicalOperatorEnum,
  AttributePathEnum,
  OperatorEnum,
  ValueTypeEnum,
} from './policy/policy.type.ts';
