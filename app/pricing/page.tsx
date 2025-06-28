import PricingTable from "@/components/pricingTable";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Choose a Plan</h1>
      <PricingTable />
    </div>
  );
}
