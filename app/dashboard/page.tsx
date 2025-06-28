'use client';

import { authClient } from '@/lib/auth-client';

export default function Dashboard() {
    const { data: session } = authClient.useSession();

    const openPortal = async () => {
        try {
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), 
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

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Welcome! {session?.user?.name}</h1>
            <p className="text-gray-600">Email: {session?.user?.email}</p>
            
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

