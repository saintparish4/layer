import Sidebar from "@/components/sidebar";
import { auth } from "@/lib/auth";
import React, { ReactNode } from "react";
import { headers } from "next/headers";

interface Tenant {
    id: string;
    name: string;
    ownerId: string;
    subscriptionTier?: string;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session) {
        // Middleware will guard anyway
        return <p>Redirecting to sign in...</p>;
    }

    // Fetch all tenants owned by this user 
    let tenant: Tenant | null = null;
    let isAdmin = false;
    let tier = "Free";
    
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tenants?ownerId=${session.user.id}`,
            { cache: "no-store" }
        );
        
        if (res.ok) {
            const tenants: Tenant[] = await res.json();
            tenant = tenants[0]; // Assume one tenant per user for now
            
            if (tenant) {
                isAdmin = session.user.email === tenant.ownerId;
                tier = tenant.subscriptionTier || "Free";
            }
        }
    } catch (error) {
        console.error('Error fetching tenant data:', error);
        // Continue with default values
    }

    return (
        <div className="flex h-screen">
            <Sidebar isAdmin={isAdmin} tier={tier} />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {children}
            </main>
        </div>
    )
}
