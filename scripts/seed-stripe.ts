import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

// Validate environment variable
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY environment variable is required");
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
})

async function upsert() {
    try {
        // Define Plans
        const plans = [
            { nickname: "Free", amount: 0, interval: "month" },
            { nickname: "Pro", amount: 1000, interval: "month" },
            { nickname: "Enterprise", amount: 10000, interval: "month" },
        ];

        // Upsert Plans
        for (const plan of plans) {
            try {
                // Skip price creation for free plan (Stripe doesn't allow $0 recurring prices)
                if (plan.amount === 0) {
                    console.log(`Skipping price creation for ${plan.nickname} (free plan)`);
                    continue;
                }

                // Create or find product for this plan
                const products = await stripe.products.list({ 
                    active: true,
                    limit: 100 
                });
                
                let prod = products.data.find(p => p.name === `Layer ${plan.nickname}`);
                
                if (!prod) {
                    prod = await stripe.products.create({ 
                        name: `Layer ${plan.nickname}`, 
                        type: "service",
                        description: `${plan.nickname} subscription plan`
                    });
                    console.log(`Created product ${prod.id} for ${plan.nickname}`);
                } else {
                    console.log(`Found existing product ${prod.id} for ${plan.nickname}`);
                }

                // Upsert Price
                const prices = await stripe.prices.list({
                    product: prod.id,
                    lookup_keys: [plan.nickname],
                    active: true,
                });

                if (prices.data.length === 0) {
                    const price = await stripe.prices.create({
                        unit_amount: plan.amount,
                        currency: "usd",
                        recurring: { interval: plan.interval as Stripe.Price.Recurring.Interval },
                        product: prod.id,
                        nickname: plan.nickname,
                        lookup_key: plan.nickname,
                    });
                    console.log(`Created price ${price.id} (${plan.nickname})`);
                } else {
                    console.log(`Price exists for ${plan.nickname}: ${prices.data[0].id}`);
                }
            } catch (error) {
                console.error(`Error processing plan ${plan.nickname}:`, error);
            }
        }
        
        console.log("Stripe seeding completed successfully");
    } catch (error) {
        console.error("Error during Stripe seeding:", error);
        process.exit(1);
    }
}

upsert().catch(console.error);
