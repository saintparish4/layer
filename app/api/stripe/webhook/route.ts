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
            console.log(`Subscription event: ${event.type}`, {
                subscriptionId: (event.data.object as Stripe.Subscription).id,
                customerId: (event.data.object as Stripe.Subscription).customer,
                status: (event.data.object as Stripe.Subscription).status,
                tenantId: (event.data.object as Stripe.Subscription).metadata?.tenantId
            });
            // Backend handles the database updates
            break;
        case "checkout.session.completed":
            console.log(`Checkout completed:`, {
                sessionId: (event.data.object as Stripe.Checkout.Session).id,
                customerId: (event.data.object as Stripe.Checkout.Session).customer,
                tenantId: (event.data.object as Stripe.Checkout.Session).metadata?.tenantId
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    return NextResponse.json({ received: true });
}