import { NextResponse } from "next/server";
import Stripe from "stripe";

// Check if Stripe secret key is configured
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-05-28.basil" });

export async function GET() {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const prices = await stripe.prices.list({ active: true, expand: ["data.product"] });
        return NextResponse.json(prices.data);
    } catch (error) {
        console.error('Plans error:', error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}