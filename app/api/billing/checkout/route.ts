import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/directive/auth";
import { PrismaClient } from "@/app/generated/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
});

const prisma = new PrismaClient();

// Define allowed plan lookup keys
const ALLOWED_LOOKUP_KEYS = ['pro', 'enterprise', 'basic'];

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

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

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication check
        const userSession = await auth.api.getSession({ headers: req.headers });
        if (!userSession) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Rate limiting
        const clientId = userSession.user.id;
        if (!checkRateLimit(clientId)) {
            return NextResponse.json({ 
                error: "Too many requests. Please try again later." 
            }, { status: 429 });
        }

        // 3. Input validation
        const { lookupKey } = await req.json();
        
        if (!lookupKey || typeof lookupKey !== 'string') {
            return NextResponse.json({ error: "Invalid lookup key" }, { status: 400 });
        }

        if (!ALLOWED_LOOKUP_KEYS.includes(lookupKey)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        // 4. Retrieve price by lookup key (nickname)
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            expand: ["data.product"], 
        });
        
        const price = prices.data[0];
        if (!price) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // 5. Create or get Stripe customer for the user
        let customerId = userSession.user.stripeCustomerId;
        
        if (!customerId) {
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: userSession.user.email,
                name: userSession.user.name,
                metadata: {
                    userId: userSession.user.id,
                }
            });
            customerId = customer.id;
            
            // Update user with Stripe customer ID
            await prisma.user.update({
                where: { id: userSession.user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        // 6. Create checkout session with proper configuration
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: price.id, quantity: 1 }],
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
            metadata: {
                userId: userSession.user.id,
                plan: lookupKey,
                userEmail: userSession.user.email,
                userName: userSession.user.name
            },
            allow_promotion_codes: true,
            billing_address_collection: "required",
            subscription_data: {
                metadata: {
                    userId: userSession.user.id,
                    plan: lookupKey
                }
            }
        });

        // 7. Log successful checkout creation
        console.log(`Checkout session created for user ${userSession.user.id} (${userSession.user.email}) for plan ${lookupKey}`);

        return NextResponse.json({ url: checkoutSession.url }, { status: 200 });

    } catch (error) {
        // 8. Proper error handling
        console.error('Stripe checkout error:', error);
        
        if (error instanceof Stripe.errors.StripeError) {
            return NextResponse.json({ 
                error: "Payment processing error" 
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
}