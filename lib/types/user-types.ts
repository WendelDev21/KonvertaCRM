export type UserRole = "user" | "admin"
export type UserPlan = "starter" | "pro" | "business"

export interface PlanLimits {
  maxContacts: number | null // null significa ilimitado
  maxWebhooks: number | null // null significa ilimitado
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  starter: {
    maxContacts: 100,
    maxWebhooks: 1,
  },
  pro: {
    maxContacts: null, // ilimitado
    maxWebhooks: 5,
  },
  business: {
    maxContacts: null, // ilimitado
    maxWebhooks: null, // ilimitado
  },
}

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter
}
