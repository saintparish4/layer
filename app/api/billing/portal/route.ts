import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/directive/auth";

// Validate environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

if (!NEXTAUTH_URL) {
    throw new Error("NEXTAUTH_URL environment variable is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
});

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);
    
    if (!record || now > record.resetTime) {
        rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    record.count++;
    return true;
}

interface BillingPortalRequest {
    customerId: string;
}

// Validate customer ID format (Stripe customer IDs start with 'cus_')
function isValidCustomerId(customerId: string): boolean {
    return /^cus_[a-zA-Z0-9]+$/.test(customerId);
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Authentication check using Better Auth
        const session = await auth.api.getSession({ headers: req.headers });
        
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Validate request method
        if (req.method !== 'POST') {
            return NextResponse.json(
                { error: "Method not allowed" },
                { status: 405 }
            );
        }

        // Parse and validate request body
        let body: BillingPortalRequest;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { customerId } = body;

        // Input validation
        if (!customerId) {
            return NextResponse.json(
                { error: "customerId is required" },
                { status: 400 }
            );
        }

        if (typeof customerId !== 'string') {
            return NextResponse.json(
                { error: "customerId must be a string" },
                { status: 400 }
            );
        }

        if (!isValidCustomerId(customerId)) {
            return NextResponse.json(
                { error: "Invalid customer ID format" },
                { status: 400 }
            );
        }

        // Optional: Verify the customer belongs to the authenticated user
        // This depends on your data model - you might want to check if the customer
        // is associated with the current user's account
        // const userCustomer = await getUserCustomer(session.user.id);
        // if (userCustomer !== customerId) {
        //     return NextResponse.json(
        //         { error: "Access denied to this customer" },
        //         { status: 403 }
        //     );
        // }

        // Create Stripe billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${NEXTAUTH_URL}/dashboard`,
        });

        // Log successful portal creation (for audit purposes)
        console.log(`Billing portal session created for customer: ${customerId} by user: ${session.user.id}`);

        return NextResponse.json(
            { url: portalSession.url },
            { status: 200 }
        );

    } catch (error) {
        // Log error for debugging (but don't expose sensitive details)
        console.error('Billing portal error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            userAgent: req.headers.get('user-agent'),
        });

        // Return generic error message to avoid information leakage
        return NextResponse.json(
            { error: "Failed to create billing portal session. Please try again later." },
            { status: 500 }
        );
    }
}