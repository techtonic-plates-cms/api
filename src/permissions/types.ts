// Permission system types and examples

export type ScopeType = "GLOBAL" | "RESOURCE_SPECIFIC" | "FIELD_SPECIFIC" | "CONDITIONAL";

export interface PermissionCheck {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  context?: Record<string, any>;
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  scopeType: ScopeType;
  resourceId?: string;
  fieldScope?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
}

// Examples of how permissions would be configured:

/*
EXAMPLE 1: Global permission
- User can read all users
{
  action: "read",
  resource: "users",
  scopeType: "GLOBAL"
}

EXAMPLE 2: Resource-specific permission
- User can only edit user with ID "123"
{
  action: "edit",
  resource: "users",
  scopeType: "RESOURCE_SPECIFIC",
  resourceId: "123"
}

EXAMPLE 3: Field-specific permission
- User can only view name and email fields of users
{
  action: "read",
  resource: "users",
  scopeType: "FIELD_SPECIFIC",
  fieldScope: "name,email"
}

EXAMPLE 4: Conditional permission
- User can only edit their own posts (where author_id equals their user ID)
{
  action: "edit",
  resource: "posts",
  scopeType: "CONDITIONAL",
  conditionField: "author_id",
  conditionOperator: "eq",
  conditionValue: "${user.id}" // This would be resolved at runtime
}

EXAMPLE 5: API endpoint specific
- User can only access specific endpoints
{
  action: "execute",
  resource: "api.users.profile",
  scopeType: "GLOBAL"
}
*/
