"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getApiUrl, API_ENDPOINTS } from "@/lib/api-config";

interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  stripeCustomerId?: string;
}

export default function Settings() {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const params = new URLSearchParams({
      ownerId: session.user.id,
    });
    
    fetch(`${getApiUrl(API_ENDPOINTS.TENANTS)}?${params}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const t = data[0];
          setName(t.name);
          setTenant(t);
        } else {
          console.warn('No tenant data found');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching tenant data:', error);
        setLoading(false);
      });
  }, [session]);

  const save = () => {
    if (!tenant?.id) {
      alert("No tenant ID available");
      return;
    }
    
    fetch(`${getApiUrl(API_ENDPOINTS.TENANTS)}/${tenant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(() => alert("Workspace name updated"))
      .catch((error) => {
        console.error('Error updating workspace:', error);
        alert("Failed to update workspace name");
      });
  };

  const manageBilling = () => {
    if (!tenant?.stripeCustomerId) {
      alert("No billing information found. Please contact support.");
      return;
    }
    
    fetch(getApiUrl(API_ENDPOINTS.BILLING_PORTAL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: tenant.stripeCustomerId }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(({ url }) => {
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No billing portal URL received');
        }
      })
      .catch((error) => {
        console.error('Error accessing billing portal:', error);
        alert("Failed to access billing portal");
      });
  };

  if (loading) return <div>Loading...</div>;
  return (
    <div className="p-6 space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <input
            className="w-full p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace Name"
        />
        <button 
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            Save Changes
        </button>
        <button 
            onClick={manageBilling}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
            Manage Billing
        </button>
    </div>
  )
}
