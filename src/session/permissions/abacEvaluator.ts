import type { SessionUser, SessionPolicy, SessionPolicyRule } from '../types';
import type { AppContext } from '../../index';

// Request context interface for ABAC evaluation
export interface AbacRequestContext {
  subject: {
    id: string;
    role: string[];
    status: string;
    createdAt: Date;
  };
  resource: {
    type: string;
    id?: string;
    // Dynamic resource attributes will be added based on resource type
    [key: string]: any;
  };
  action: {
    type: string;
  };
  environment: {
    currentTime: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class AbacPolicyEvaluator {
  private user: SessionUser;
  private policies: SessionPolicy[];

  constructor(user: SessionUser) {
    this.user = user;
    this.policies = user.policies;
  }

  /**
   * Main evaluation method - evaluates all applicable policies for a request
   */
  async evaluate(
    resourceType: string,
    actionType: string,
    resourceData?: Record<string, any>,
    environmentContext?: Partial<AbacRequestContext['environment']>
  ): Promise<{
    decision: 'ALLOW' | 'DENY';
    matchingPolicies: string[];
    reason: string;
    evaluationTimeMs: number;
  }> {
    const startTime = Date.now();

    // Build request context
    const context = this.buildRequestContext(resourceType, actionType, resourceData, environmentContext);

    // Get applicable policies for this resource/action
    const applicablePolicies = this.getApplicablePolicies(resourceType, actionType);

    if (applicablePolicies.length === 0) {
      return {
        decision: 'DENY',
        matchingPolicies: [],
        reason: 'No applicable policies found',
        evaluationTimeMs: Date.now() - startTime
      };
    }

    // Evaluate each policy
    const policyResults: Array<{
      policy: SessionPolicy;
      matches: boolean;
      reason: string;
    }> = [];

    for (const policy of applicablePolicies) {
      const result = await this.evaluatePolicy(policy, context);
      policyResults.push({
        policy,
        matches: result.matches,
        reason: result.reason
      });
    }

    // Apply policy decision logic
    const decision = this.makeDecision(policyResults);

    return {
      decision: decision.effect,
      matchingPolicies: decision.matchingPolicies,
      reason: decision.reason,
      evaluationTimeMs: Date.now() - startTime
    };
  }

  /**
   * Convenience method for simple permission checks
   */
  async hasPermission(
    resourceType: string,
    actionType: string,
    resourceData?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.evaluate(resourceType, actionType, resourceData);
    return result.decision === 'ALLOW';
  }

  /**
   * Field-level permission check
   */
  async hasFieldPermission(
    fieldId: string,
    actionType: string,
    entryData?: Record<string, any>
  ): Promise<boolean> {
    // Add field-specific data to resource context
    const resourceData = {
      ...entryData,
      field: { id: fieldId }
    };

    return this.hasPermission('fields', actionType, resourceData);
  }

  private buildRequestContext(
    resourceType: string,
    actionType: string,
    resourceData?: Record<string, any>,
    environmentContext?: Partial<AbacRequestContext['environment']>
  ): AbacRequestContext {
    return {
      subject: {
        id: this.user.id,
        role: this.user.roles.map(r => r.name),
        status: this.user.status,
        createdAt: new Date() // You might want to get this from user data
      },
      resource: {
        type: resourceType,
        ...resourceData
      },
      action: {
        type: actionType
      },
      environment: {
        currentTime: new Date(),
        ...environmentContext
      }
    };
  }

  private getApplicablePolicies(resourceType: string, actionType: string): SessionPolicy[] {
    return this.policies
      .filter(policy => 
        policy.resourceType === resourceType && 
        policy.actionType === actionType
      )
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  private async evaluatePolicy(
    policy: SessionPolicy,
    context: AbacRequestContext
  ): Promise<{ matches: boolean; reason: string }> {
    if (policy.rules.length === 0) {
      return { matches: true, reason: 'Policy has no rules' };
    }

    const ruleResults: Array<{ matches: boolean; rule: SessionPolicyRule; reason: string }> = [];

    for (const rule of policy.rules) {
      const result = this.evaluateRule(rule, context);
      ruleResults.push({
        matches: result,
        rule,
        reason: result ? 'Rule matched' : 'Rule did not match'
      });
    }

    // Apply rule connector logic
    let policyMatches: boolean;
    if (policy.ruleConnector === 'AND') {
      policyMatches = ruleResults.every(r => r.matches);
    } else { // OR
      policyMatches = ruleResults.some(r => r.matches);
    }

    const reason = policyMatches 
      ? `Policy ${policy.name} matched (${policy.ruleConnector} of ${ruleResults.length} rules)`
      : `Policy ${policy.name} did not match (${policy.ruleConnector} of ${ruleResults.length} rules)`;

    return { matches: policyMatches, reason };
  }

  private evaluateRule(rule: SessionPolicyRule, context: AbacRequestContext): boolean {
    const actualValue = this.extractAttributeValue(rule.attributePath, context);
    const expectedValue = this.parseExpectedValue(rule.expectedValue, rule.valueType);

    return this.compareValues(actualValue, expectedValue, rule.operator);
  }

  private extractAttributeValue(attributePath: string, context: AbacRequestContext): any {
    const parts = attributePath.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private parseExpectedValue(expectedValue: string, valueType: string): any {
    try {
      const parsed = JSON.parse(expectedValue);
      
      switch (valueType) {
        case 'string':
          return String(parsed);
        case 'number':
          return Number(parsed);
        case 'boolean':
          return Boolean(parsed);
        case 'uuid':
          return String(parsed);
        case 'datetime':
          return new Date(parsed);
        case 'array':
          return Array.isArray(parsed) ? parsed : [parsed];
        default:
          return parsed;
      }
    } catch {
      return expectedValue; // Fallback to string
    }
  }

  private compareValues(actualValue: any, expectedValue: any, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return actualValue === expectedValue;
      
      case 'ne':
        return actualValue !== expectedValue;
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      
      case 'gt':
        return actualValue > expectedValue;
      
      case 'gte':
        return actualValue >= expectedValue;
      
      case 'lt':
        return actualValue < expectedValue;
      
      case 'lte':
        return actualValue <= expectedValue;
      
      case 'contains':
        if (typeof actualValue === 'string') {
          return actualValue.includes(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expectedValue);
        }
        return false;
      
      case 'starts_with':
        return typeof actualValue === 'string' && actualValue.startsWith(expectedValue);
      
      case 'ends_with':
        return typeof actualValue === 'string' && actualValue.endsWith(expectedValue);
      
      case 'is_null':
        return actualValue === null || actualValue === undefined;
      
      case 'is_not_null':
        return actualValue !== null && actualValue !== undefined;
      
      case 'regex':
        try {
          const regex = new RegExp(expectedValue);
          return regex.test(String(actualValue));
        } catch {
          return false;
        }
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private makeDecision(
    policyResults: Array<{ policy: SessionPolicy; matches: boolean; reason: string }>
  ): {
    effect: 'ALLOW' | 'DENY';
    matchingPolicies: string[];
    reason: string;
  } {
    // Separate ALLOW and DENY policies that matched
    const matchingAllowPolicies = policyResults.filter(r => r.matches && r.policy.effect === 'ALLOW');
    const matchingDenyPolicies = policyResults.filter(r => r.matches && r.policy.effect === 'DENY');

    // DENY takes precedence (security-first approach)
    if (matchingDenyPolicies.length > 0) {
      const highestPriorityDeny = matchingDenyPolicies[0]!; // Already sorted by priority
      return {
        effect: 'DENY',
        matchingPolicies: [highestPriorityDeny.policy.id],
        reason: `Access denied by policy: ${highestPriorityDeny.policy.name} (priority: ${highestPriorityDeny.policy.priority})`
      };
    }

    // Check for ALLOW policies
    if (matchingAllowPolicies.length > 0) {
      const highestPriorityAllow = matchingAllowPolicies[0]!;
      return {
        effect: 'ALLOW',
        matchingPolicies: matchingAllowPolicies.map(p => p.policy.id),
        reason: `Access granted by policy: ${highestPriorityAllow.policy.name} (priority: ${highestPriorityAllow.policy.priority})`
      };
    }

    // No matching policies - default DENY
    return {
      effect: 'DENY',
      matchingPolicies: [],
      reason: 'No matching policies found - default deny'
    };
  }

  // Utility methods for common permission checks
  async canCreate(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'create', resourceData);
  }

  async canRead(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'read', resourceData);
  }

  async canUpdate(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'update', resourceData);
  }

  async canDelete(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'delete', resourceData);
  }

  async canPublish(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'publish', resourceData);
  }

  async canUnpublish(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'unpublish', resourceData);
  }

  async canArchive(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'archive', resourceData);
  }

  async canRestore(resourceType: string, resourceData?: Record<string, any>): Promise<boolean> {
    return this.hasPermission(resourceType, 'restore', resourceData);
  }
}