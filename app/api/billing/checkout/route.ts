import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Check if Stripe secret key is configured
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil", 
});

export async function POST(req: NextRequest) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const { lookupKey } = await req.json();
        
        if (!lookupKey) {
            return NextResponse.json({ error: "lookupKey is required" }, { status: 400 });
        }

        // Retrieve price by lookup key (nickname)
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            expand: ["data.product"],
        });
        
        const price = prices.data[0];
        if (!price) {
            return NextResponse.json({ error: "Price not found" }, { status: 404 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: price.id, quantity: 1 }],
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing`, 
        });
        
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

