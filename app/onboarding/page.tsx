"use client";
import { useState } from "react";
import { authClient } from '@/lib/auth-client';
import PricingTable from "@/components/pricingTable";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(session?.user?.name || "");
  const [plan, setPlan] = useState<string | null>(null);

  const createTenant = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tenants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerId: session?.user?.id }),
      }
    );
    const { id } = await res.json();
    return id;
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && plan) {
      const tenantId = await createTenant();
      if (plan !== "Hobby") {
        const { url } = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lookupKey: plan, tenantId }),
        }).then((r) => r.json());
        window.location.assign(url);
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold">Step 1: Workspace Name</h1>
          <input
            className="w-full p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your workspace name"
            required
          />
          <button
            disabled={!name}
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <h1 className="text-2xl font-bold">Step 2: Choose a Plan</h1>
          <PricingTable onSelect={(planNickname) => setPlan(planNickname)} />
          <button
            disabled={!plan}
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {plan === "Hobby" ? "Finish" : "Next"}
          </button>
        </>
      )}
    </div>
  );
}
