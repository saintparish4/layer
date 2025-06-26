import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    
    if (!signature) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`, {
        status: 400,
      });
    }

    // Handle subscription-related events
    switch (event.type) {
      case "customer.subscription.created":
        console.log("Subscription created:", event.data.object);
        // TODO: Persist subscription status to database
        break;
        
      case "customer.subscription.updated":
        console.log("Subscription updated:", event.data.object);
        // TODO: Update subscription status in database
        break;
        
      case "customer.subscription.deleted":
        console.log("Subscription deleted:", event.data.object);
        // TODO: Mark subscription as cancelled in database
        break;
        
      case "customer.subscription.trial_will_end":
        console.log("Subscription trial ending:", event.data.object);
        // TODO: Send notification about trial ending
        break;
        
      case "invoice.payment_succeeded":
        console.log("Payment succeeded:", event.data.object);
        // TODO: Update payment status in database
        break;
        
      case "invoice.payment_failed":
        console.log("Payment failed:", event.data.object);
        // TODO: Handle failed payment (retry logic, notifications)
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error("Unexpected error in webhook handler:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
