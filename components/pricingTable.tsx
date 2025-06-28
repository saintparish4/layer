'use client';
import { useState, useEffect } from "react";

type Plan = {
    id: string;
    nickname: string;
    price: number;
    interval: string;
};

type ApiPlan = {
    id: string;
    nickname: string;
    unit_amount: number;
    recurring?: {
        interval: string;
    };
};

export default function PricingTable() {
    const [plans, setPlans] = useState<Plan[]>([]);
    useEffect(() => {
        fetch('/api/billing/plans')
        .then(res => res.json())
        .then((data) => 
        setPlans(data.map((p: ApiPlan) => ({
            id: p.id,
            nickname: p.nickname,
            price: p.unit_amount! / 100,
            interval: p.recurring?.interval,
        }))))
        .catch(err => console.error('Error fetching plans:', err));
    }, []); 

    const subscribe = async (lookupKey: string) => {
        const { url } = await fetch('/api/billing/checkout', {
            method: 'POST',
            body: JSON.stringify({ lookupKey }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.json());
        window.location.assign(url);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <div key={plan.id} className="p-6 border rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800">{plan.nickname}</h2>
                    <p className="mt-2">${plan.price} / {plan.interval}</p>
                    <button 
                    onClick={() => subscribe(plan.nickname)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Subscribe
                    </button>
                </div>
            ))}
        </div>
    );
}