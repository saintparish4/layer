import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../prisma";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const stripeRouter = Router();

function mapPlanToSubscriptionTier(planNickname: string): string | null {
    const nickname = planNickname.toLowerCase();
    if (nickname.includes('hobby')) return 'HOBBY';
    if (nickname.includes('starter')) return 'STARTER';
    if (nickname.includes('pro')) return 'PRO';
    if (nickname.includes('business')) return 'BUSINESS';
    if (nickname.includes('enterprise')) return 'ENTERPRISE';
    return null;
}

stripeRouter.post(
    '/webhook',
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"] as string;
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed.', err);
            return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
        }

        try {
            if (
                event.type === 'customer.subscription.created' ||
                event.type === 'customer.subscription.updated' 
            ) {
                const subscription = event.data.object as Stripe.Subscription;
                const tenantId = subscription.metadata.tenantId;
                const planNickname = subscription.items.data[0].plan.nickname || 'Unknown';
                const subscriptionTier = mapPlanToSubscriptionTier(planNickname);

                await prisma.tenant.update({
                    where: { id: tenantId },
                    data: { 
                        subscriptionTier: subscriptionTier as 'HOBBY' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' | null,
                        stripeCustomerId: subscription.customer as string,
                        stripeSubscriptionId: subscription.id,
                        subscriptionStatus: subscription.status,
                        subscriptionPeriodStart: new Date((subscription as any).current_period_start * 1000),
                        subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                        subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
                    },
                });
                console.log(`Tenant ${tenantId} subscription updated to ${subscriptionTier}`);
            } else if (event.type === 'customer.subscription.deleted') {
                const subscription = event.data.object as Stripe.Subscription;
                const tenantId = subscription.metadata.tenantId;

                await prisma.tenant.update({
                    where: { id: tenantId },
                    data: { 
                        subscriptionStatus: 'canceled',
                        subscriptionCancelAtPeriodEnd: false,
                    },
                });
                console.log(`Tenant ${tenantId} subscription canceled`);
            } else if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session;
                const tenantId = session.metadata?.tenantId;
                
                if (tenantId && session.customer) {
                    await prisma.tenant.update({
                        where: { id: tenantId },
                        data: { 
                            stripeCustomerId: session.customer as string,
                        },
                    });
                    console.log(`Tenant ${tenantId} customer ID updated to ${session.customer}`);
                }
            }
        } catch (error) {
            console.error('Error processing webhook event:', error);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }

        res.json({ received: true });
    }
);