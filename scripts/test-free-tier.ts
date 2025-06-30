import dotenv from "dotenv";
dotenv.config();

async function testFreeTier() {
    console.log("🧪 Testing Free Tier Configuration...\n");

    // Test 1: Check if plans API returns the Hobby plan
    console.log("1. Testing /api/billing/plans endpoint...");
    try {
        const response = await fetch('http://localhost:3000/api/billing/plans');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const plans = await response.json();
        
        const hobbyPlan = plans.find((p: any) => p.nickname === 'Hobby');
        if (hobbyPlan) {
            console.log("✅ Hobby plan found in API response");
            console.log(`   - Price ID: ${hobbyPlan.id}`);
            console.log(`   - Amount: $${hobbyPlan.unit_amount / 100}`);
            console.log(`   - Lookup Key: ${hobbyPlan.lookup_key}`);
        } else {
            console.log("❌ Hobby plan not found in API response");
            console.log("Available plans:", plans.map((p: any) => p.nickname));
        }
    } catch (error) {
        console.error("❌ Error testing plans API:", error);
    }

    // Test 2: Check if the pricing table component would show the Hobby plan
    console.log("\n2. Testing pricing table filtering logic...");
    try {
        const response = await fetch('http://localhost:3000/api/billing/plans');
        const plans = await response.json();
        
        const monthlyPlans = plans.filter((p: any) => {
            if (!p.nickname) return false;
            return p.nickname.includes('(Monthly)') || 
                   (p.nickname === 'Hobby' && p.unit_amount === 0);
        });
        
        const hobbyPlan = monthlyPlans.find((p: any) => p.nickname === 'Hobby');
        if (hobbyPlan) {
            console.log("✅ Hobby plan would be shown in pricing table");
        } else {
            console.log("❌ Hobby plan would NOT be shown in pricing table");
            console.log("Filtered plans:", monthlyPlans.map((p: any) => p.nickname));
        }
    } catch (error) {
        console.error("❌ Error testing pricing table logic:", error);
    }

    // Test 3: Check Stripe directly
    console.log("\n3. Testing Stripe API directly...");
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log("❌ STRIPE_SECRET_KEY not configured");
    } else {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-05-28.basil",
        });

        try {
            const prices = await stripe.prices.list({
                lookup_keys: ['Hobby_monthly'],
                active: true,
            });
            
            if (prices.data.length > 0) {
                const price = prices.data[0];
                console.log("✅ Hobby plan found in Stripe");
                console.log(`   - Price ID: ${price.id}`);
                console.log(`   - Amount: $${price.unit_amount / 100}`);
                console.log(`   - Active: ${price.active}`);
            } else {
                console.log("❌ Hobby plan not found in Stripe");
            }
        } catch (error) {
            console.error("❌ Error testing Stripe API:", error);
        }
    }

    console.log("\n🎉 Free tier testing completed!");
}

testFreeTier().catch(console.error); 