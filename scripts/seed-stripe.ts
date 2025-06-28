import Stripe from "stripe";
import dotenv from "dotenv";
import { plans, PlanConfig, validateAllPlans } from "./plans-config";
dotenv.config();

// Validate environment variable
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY environment variable is required");
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
})

async function createOrUpdateProduct(plan: PlanConfig): Promise<Stripe.Product> {
    const productName = `Layer ${plan.nickname}`;
    
    // Find existing product
    const products = await stripe.products.list({ 
        active: true,
        limit: 100 
    });
    
    let product = products.data.find(p => p.name === productName);
    
    if (!product) {
        product = await stripe.products.create({ 
            name: productName,
            type: "service",
            description: plan.description,
            metadata: {
                features: JSON.stringify(plan.features),
                limits: JSON.stringify(plan.limits || {}),
                trialDays: plan.trialDays?.toString() || "0",
                popular: plan.popular?.toString() || "false",
                ...plan.metadata
            }
        });
        console.log(`✅ Created product ${product.id} for ${plan.nickname}`);
    } else {
        // Update existing product with new metadata
        product = await stripe.products.update(product.id, {
            description: plan.description,
            metadata: {
                features: JSON.stringify(plan.features),
                limits: JSON.stringify(plan.limits || {}),
                trialDays: plan.trialDays?.toString() || "0",
                popular: plan.popular?.toString() || "false",
                ...plan.metadata
            }
        });
        console.log(`🔄 Updated product ${product.id} for ${plan.nickname}`);
    }
    
    return product;
}

async function createOrUpdatePrices(product: Stripe.Product, plan: PlanConfig): Promise<void> {
    // Create monthly price
    if (plan.amount > 0) {
        const monthlyLookupKey = `${plan.nickname}_monthly`;
        const monthlyPrices = await stripe.prices.list({
            product: product.id,
            lookup_keys: [monthlyLookupKey],
            active: true,
        });

        if (monthlyPrices.data.length === 0) {
            const monthlyPrice = await stripe.prices.create({
                unit_amount: plan.amount,
                currency: "usd",
                recurring: { interval: "month" },
                product: product.id,
                nickname: `${plan.nickname} (Monthly)`,
                lookup_key: monthlyLookupKey,
                metadata: {
                    trialDays: plan.trialDays?.toString() || "0",
                    planType: plan.metadata?.planType || "paid"
                }
            });
            console.log(`✅ Created monthly price ${monthlyPrice.id} for ${plan.nickname} ($${(plan.amount / 100).toFixed(2)}/month)`);
        } else {
            console.log(`ℹ️  Monthly price exists for ${plan.nickname}: ${monthlyPrices.data[0].id}`);
        }

        // Create annual price with discount
        if (plan.annualDiscount) {
            const annualAmount = Math.round(plan.amount * 12 * (1 - plan.annualDiscount / 100));
            const annualLookupKey = `${plan.nickname}_annual`;
            const annualPrices = await stripe.prices.list({
                product: product.id,
                lookup_keys: [annualLookupKey],
                active: true,
            });

            if (annualPrices.data.length === 0) {
                const annualPrice = await stripe.prices.create({
                    unit_amount: annualAmount,
                    currency: "usd",
                    recurring: { interval: "year" },
                    product: product.id,
                    nickname: `${plan.nickname} (Annual)`,
                    lookup_key: annualLookupKey,
                    metadata: {
                        trialDays: plan.trialDays?.toString() || "0",
                        originalMonthlyPrice: plan.amount.toString(),
                        discountPercentage: plan.annualDiscount.toString(),
                        planType: plan.metadata?.planType || "paid"
                    }
                });
                console.log(`✅ Created annual price ${annualPrice.id} for ${plan.nickname} ($${(annualAmount / 100).toFixed(2)}/year, ${plan.annualDiscount}% off)`);
            } else {
                console.log(`ℹ️  Annual price exists for ${plan.nickname}: ${annualPrices.data[0].id}`);
            }
        }
    } else {
        console.log(`⏭️  Skipping price creation for ${plan.nickname} (free plan)`);
    }
}

async function cleanupUnusedProducts(): Promise<void> {
    console.log("\n🧹 Checking for unused products...");
    
    const products = await stripe.products.list({ 
        active: true,
        limit: 100 
    });
    
    for (const product of products.data) {
        const prices = await stripe.prices.list({
            product: product.id,
            active: true,
        });
        
        if (prices.data.length === 0) {
            console.log(`🗑️  Deactivating unused product: ${product.name} (${product.id})`);
            await stripe.products.update(product.id, { active: false });
        }
    }
}

async function validatePlans(): Promise<boolean> {
    console.log("🔍 Validating plan configuration...");
    
    const validationErrors = validateAllPlans();
    
    if (validationErrors.length > 0) {
        console.error("❌ Plan validation failed:");
        validationErrors.forEach(({ plan, errors }) => {
            console.error(`  ${plan}:`);
            errors.forEach(error => console.error(`    - ${error}`));
        });
        return false;
    }
    
    console.log("✅ All plans are valid");
    return true;
}

async function upsert(): Promise<void> {
    try {
        console.log("🚀 Starting Stripe seeding process...\n");
        
        // Validate plans first
        if (!(await validatePlans())) {
            process.exit(1);
        }
        
        // Process each plan
        for (const plan of plans) {
            try {
                console.log(`📋 Processing plan: ${plan.nickname}`);
                
                // Create or update product
                const product = await createOrUpdateProduct(plan);
                
                // Create or update prices
                await createOrUpdatePrices(product, plan);
                
                console.log(`✅ Completed processing ${plan.nickname}\n`);
            } catch (error) {
                console.error(`❌ Error processing plan ${plan.nickname}:`, error);
                // Continue with other plans
            }
        }
        
        // Cleanup unused products
        await cleanupUnusedProducts();
        
        console.log("\n🎉 Stripe seeding completed successfully!");
        console.log(`📊 Created/Updated ${plans.length} plans`);
        
        // Summary
        console.log("\n📋 Plan Summary:");
        plans.forEach(plan => {
            const price = plan.amount > 0 ? `$${(plan.amount / 100).toFixed(2)}/month` : "Free";
            const annual = plan.annualDiscount ? ` (${plan.annualDiscount}% off annual)` : "";
            const popular = plan.popular ? " ⭐" : "";
            console.log(`  • ${plan.nickname}: ${price}${annual}${popular}`);
        });
        
    } catch (error) {
        console.error("❌ Error during Stripe seeding:", error);
        process.exit(1);
    }
}

// Add command line argument support
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Stripe Seed Script

Usage:
  npm run seed:stripe [options]

Options:
  --help, -h     Show this help message
  --cleanup      Only cleanup unused products
  --dry-run      Show what would be created without making changes
  --validate     Only validate plan configuration

Examples:
  npm run seed:stripe
  npm run seed:stripe --cleanup
  npm run seed:stripe --dry-run
  npm run seed:stripe --validate
`);
    process.exit(0);
}

if (args.includes('--validate')) {
    console.log("🔍 Running validation only...");
    validatePlans().then(isValid => {
        if (isValid) {
            console.log("✅ All plans are valid");
            process.exit(0);
        } else {
            console.log("❌ Validation failed");
            process.exit(1);
        }
    }).catch(error => {
        console.error("❌ Validation error:", error);
        process.exit(1);
    });
}

if (args.includes('--dry-run')) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
    console.log("Plans that would be created:");
    plans.forEach(plan => {
        const price = plan.amount > 0 ? `$${(plan.amount / 100).toFixed(2)}/month` : "Free";
        const annual = plan.annualDiscount ? ` (${plan.annualDiscount}% off annual)` : "";
        console.log(`  • ${plan.nickname}: ${price}${annual}`);
    });
    process.exit(0);
}

if (args.includes('--cleanup')) {
    console.log("🧹 Running cleanup only...");
    cleanupUnusedProducts().then(() => {
        console.log("✅ Cleanup completed");
        process.exit(0);
    }).catch(error => {
        console.error("❌ Cleanup failed:", error);
        process.exit(1);
    });
} else {
    upsert().catch(console.error);
}
