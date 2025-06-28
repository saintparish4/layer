export interface PlanConfig {
    nickname: string;
    amount: number;
    interval: "month" | "year";
    description: string;
    features: string[];
    limits?: Record<string, number>;
    trialDays?: number;
    popular?: boolean;
    annualDiscount?: number; // Percentage discount for annual billing
    metadata?: Record<string, string>; // Additional metadata
}

export const plans: PlanConfig[] = [
    {
        nickname: "Hobby",
        amount: 0,
        interval: "month",
        description: "Perfect for side projects and learning",
        features: [
            "1 SaaS application",
            "Basic auth & billing setup",
            "Community support",
            "Standard templates",
            "GitHub integration"
        ],
        limits: {
            applications: 1,
            teamMembers: 1,
            apiCalls: 1000,
            storage: 1, // GB
            customDomains: 0
        },
        metadata: {
            planType: "free",
            maxUsers: "1",
            targetAudience: "hobbyist"
        }
    },
    {
        nickname: "Starter",
        amount: 2900, // $29/month
        interval: "month",
        description: "For indie developers and small startups",
        features: [
            "Up to 3 SaaS applications",
            "Advanced auth & billing",
            "Email support",
            "Custom templates",
            "Custom domains",
            "Analytics dashboard",
            "Webhook integrations"
        ],
        limits: {
            applications: 3,
            teamMembers: 3,
            apiCalls: 10000,
            storage: 10,
            customDomains: 3
        },
        trialDays: 14,
        annualDiscount: 20,
        metadata: {
            planType: "paid",
            maxUsers: "3",
            supportLevel: "email",
            targetAudience: "indie"
        }
    },
    {
        nickname: "Pro",
        amount: 9900, // $99/month
        interval: "month",
        description: "For growing SaaS companies",
        features: [
            "Up to 10 SaaS applications",
            "Enterprise auth & billing",
            "Priority support",
            "Custom templates & themes",
            "Unlimited custom domains",
            "Advanced analytics",
            "Team collaboration",
            "API access",
            "White-label options",
            "SSO integration"
        ],
        limits: {
            applications: 10,
            teamMembers: 10,
            apiCalls: 100000,
            storage: 100,
            customDomains: -1 // Unlimited
        },
        trialDays: 14,
        popular: true,
        annualDiscount: 25,
        metadata: {
            planType: "paid",
            maxUsers: "10",
            supportLevel: "priority",
            hasApi: "true",
            hasWhiteLabel: "true",
            hasSso: "true",
            targetAudience: "startup"
        }
    },
    {
        nickname: "Business",
        amount: 29900, // $299/month
        interval: "month",
        description: "For established SaaS companies",
        features: [
            "Up to 25 SaaS applications",
            "Advanced security & compliance",
            "Dedicated support",
            "Custom integrations",
            "Advanced team management",
            "SLA guarantee",
            "Custom branding",
            "Multi-tenant support",
            "Advanced reporting",
            "Custom workflows"
        ],
        limits: {
            applications: 25,
            teamMembers: 25,
            apiCalls: 500000,
            storage: 500,
            customDomains: -1
        },
        trialDays: 14,
        annualDiscount: 30,
        metadata: {
            planType: "paid",
            maxUsers: "25",
            supportLevel: "dedicated",
            hasApi: "true",
            hasWhiteLabel: "true",
            hasSso: "true",
            hasSla: "true",
            hasMultiTenant: "true",
            targetAudience: "business"
        }
    },
    {
        nickname: "Enterprise",
        amount: 99900, // $999/month
        interval: "month",
        description: "For large enterprises and agencies",
        features: [
            "Unlimited SaaS applications",
            "Custom security compliance",
            "24/7 phone support",
            "Custom integrations",
            "Advanced analytics",
            "Dedicated account manager",
            "Custom development",
            "On-premise options",
            "Advanced monitoring",
            "Custom SLAs"
        ],
        limits: {
            applications: -1, // Unlimited
            teamMembers: -1, // Unlimited
            apiCalls: -1, // Unlimited
            storage: -1, // Unlimited
            customDomains: -1
        },
        trialDays: 30,
        annualDiscount: 35,
        metadata: {
            planType: "enterprise",
            maxUsers: "unlimited",
            supportLevel: "24_7",
            hasApi: "true",
            hasWhiteLabel: "true",
            hasSso: "true",
            hasSla: "true",
            hasMultiTenant: "true",
            hasAccountManager: "true",
            hasCustomDev: "true",
            hasOnPremise: "true",
            targetAudience: "enterprise"
        }
    }
];

// Helper functions for plan management
export function getPlanByNickname(nickname: string): PlanConfig | undefined {
    return plans.find(plan => plan.nickname === nickname);
}

export function getPopularPlans(): PlanConfig[] {
    return plans.filter(plan => plan.popular);
}

export function getPaidPlans(): PlanConfig[] {
    return plans.filter(plan => plan.amount > 0);
}

export function getPlanLimits(nickname: string): Record<string, number> | undefined {
    const plan = getPlanByNickname(nickname);
    return plan?.limits;
}

export function getPlanFeatures(nickname: string): string[] | undefined {
    const plan = getPlanByNickname(nickname);
    return plan?.features;
}

// Validation functions
export function validatePlan(plan: PlanConfig): string[] {
    const errors: string[] = [];
    
    if (!plan.nickname) {
        errors.push("Plan nickname is required");
    }
    
    if (plan.amount < 0) {
        errors.push("Plan amount cannot be negative");
    }
    
    if (plan.annualDiscount && (plan.annualDiscount < 0 || plan.annualDiscount > 100)) {
        errors.push("Annual discount must be between 0 and 100");
    }
    
    if (plan.trialDays && plan.trialDays < 0) {
        errors.push("Trial days cannot be negative");
    }
    
    if (!plan.features || plan.features.length === 0) {
        errors.push("Plan must have at least one feature");
    }
    
    return errors;
}

export function validateAllPlans(): { plan: string; errors: string[] }[] {
    return plans.map(plan => ({
        plan: plan.nickname,
        errors: validatePlan(plan)
    })).filter(result => result.errors.length > 0);
} 