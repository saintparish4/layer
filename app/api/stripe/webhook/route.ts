import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-05-28.basil" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req:  NextRequest) {
    const sig = (await headers()).get("stripe-signature")!;
    const body = await req.text();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
    }

    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            console.log(`Subscription event: ${event.type}`, event.data.object);
            // TODO: Persist subscription status to your DB
            break;
            default:
                console.log(`Unhandled event type ${event.type}`);
    }
    return NextResponse.json({ received: true });
}