'use client';
import { useState, useEffect } from "react";

type Plan = {
    id: string;
    nickname: string;
    price: number;
    interval: string;
};

type StripePrice = {
    id: string;
    nickname: string | null;
    unit_amount: number;
    recurring?: {
        interval: string;
    };
    lookup_key: string;
};

export default function PricingTable() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/billing/plans')
        .then(async (res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            console.log('API Response:', data); // Debug the response
            
            // Filter to only show monthly plans and remove duplicates
            const monthlyPlans = data.filter((p: StripePrice) => {
                // Add null checks
                if (!p.nickname) {
                    console.log('Plan with null nickname:', p);
                    return false;
                }
                
                return p.nickname.includes('(Monthly)') || 
                       (p.nickname === 'Hobby' && p.unit_amount === 0);
            });
            
            console.log('Filtered plans:', monthlyPlans); // Debug filtered plans
            
            setPlans(monthlyPlans.map((p: StripePrice) => ({
                id: p.id,
                nickname: p.nickname!.replace(' (Monthly)', ''),
                price: p.unit_amount! / 100,
                interval: p.recurring?.interval || 'month',
            })));
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching plans:', err);
            setError('Failed to load pricing plans');
            setLoading(false);
        });
    }, []); 

    const subscribe = async (planNickname: string) => {
        try {
            // Skip subscription for Hobby plan
            if (planNickname === 'Hobby') {
                alert('Hobby plan is free and requires no subscription.');
                return;
            }
            
            // Use the monthly lookup key format that matches our seed script
            const lookupKey = `${planNickname}_monthly`;
            
            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({ lookupKey }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error('Failed to parse JSON:', text);
                throw new Error('Invalid response from server');
            }

            if (data.url) {
                window.location.assign(data.url);
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            alert('Failed to start checkout process. Please try again.');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading pricing plans...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {plans.map((plan) => (
                <div key={plan.id} className="p-6 border rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800">{plan.nickname}</h2>
                    <p className="mt-2">
                        {plan.nickname === 'Hobby' ? 'Free' : `$${plan.price} / ${plan.interval}`}
                    </p>
                    <button 
                        onClick={() => subscribe(plan.nickname)}
                        disabled={plan.nickname === 'Hobby'}
                        className={`mt-4 w-full py-2 rounded-md transition-colors ${
                            plan.nickname === 'Hobby'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {plan.nickname === 'Hobby' ? 'Current Plan' : 'Subscribe'}
                    </button>
                </div>
            ))}
        </div>
    );
}