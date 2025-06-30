import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-05-28.basil" });

export async function POST(req: NextRequest) {
    try {
        const { customerId } = await req.json();
        
        if (!customerId) {
            return NextResponse.json(
                { error: "customerId is required" }, 
                { status: 400 }
            );
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
        });
        
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Billing portal error:', error);
        
        if (error instanceof Stripe.errors.StripeError) {
            if (error.code === 'parameter_missing') {
                return NextResponse.json(
                    { error: "Customer ID is missing or invalid" }, 
                    { status: 400 }
                );
            }
            if (error.code === 'resource_missing') {
                return NextResponse.json(
                    { error: "Customer not found in Stripe" }, 
                    { status: 404 }
                );
            }
        }
        
        return NextResponse.json(
            { error: "Failed to create billing portal session" }, 
            { status: 500 }
        );
    }
}