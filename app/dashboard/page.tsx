'use client';

import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';
import { getApiUrl, API_ENDPOINTS } from '@/lib/api-config';

interface Tenant {
    id: string;
    name: string;
    ownerId: string;
    stripeCustomerId?: string;
}

export default function Dashboard() {
    const { data: session } = authClient.useSession();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session && !tenant && !loading) {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                ownerId: session.user?.id || "",
            });
            
            fetch(`${getApiUrl(API_ENDPOINTS.TENANTS)}?${params}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(res => {
                if (res.status === 404) {
                    // No tenant exists, create one
                    return fetch(getApiUrl(API_ENDPOINTS.TENANTS), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name: session.user?.name || "My Workspace",
                            ownerId: session.user?.id,
                        }),
                    });
                }
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res;
            })
            .then(res => res.json())
            .then(data => {
                setTenant(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching/creating tenant:', err);
                setError(err.message || 'Failed to load tenant data');
                setLoading(false);
            });
        }
    }, [session, tenant, loading]);

    const openPortal = async () => {
        try {
            if (!tenant?.stripeCustomerId) {
                alert('No billing information found. Please contact support.');
                return;
            }

            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: tenant.stripeCustomerId }), 
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Billing portal API error:', {
                    status: res.status,
                    statusText: res.statusText,
                    error: errorData
                });
                throw new Error(`Failed to open billing portal: ${res.status} ${res.statusText}`);
            }
            
            const { url } = await res.json();
            window.location.assign(url);
        } catch (error) {
            console.error('Error opening billing portal:', error);
            alert('Failed to open billing portal. Please try again or contact support.');
        }
    };

    const handleSignOut = async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // Redirect to home page after successful sign out
                        window.location.href = '/';
                    },
                },
            });
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Failed to sign out. Please try again.');
        }
    };

    if (!session) return <div>Loading...</div>;
    
    return (
        <div className="p-8 space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome! {session?.user?.name}</h2>
                <p className="text-gray-600 mb-1">Email: {session?.user?.email}</p>
                <p className="text-gray-600 mb-1">Tenant ID: {tenant?.id}</p>
                <p className="text-gray-600">Your workspace is ready. Use the sidebar to navigate.</p>
            </div>
            {/* TODO: Future widgets: metrics, charts, etc. */}
            
            {loading && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-700">Loading your workspace...</p>
                </div>
            )}
            
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700">Error: {error}</p>
                    <p className="text-sm text-red-600 mt-2">
                        Make sure your backend server is running on port 4000
                    </p>
                </div>
            )}
            
            {tenant && !loading && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-700">
                        Your tenant ID is <code className="bg-green-100 px-2 py-1 rounded">{tenant.id}</code>
                    </p>
                </div>
            )}
            
            <div className="space-y-3">
                <button 
                    onClick={openPortal}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Manage Subscription
                </button>
                <button 
                    onClick={handleSignOut}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

// NOTE: In a real app, you'd would check if a tenant already exists via GET /API/TENANTS?OWNERID=...
// If it does, you'd redirect to the dashboard. If it doesn't, you'd create a new tenant.
// This is just a demo to show how to use the Layer API.