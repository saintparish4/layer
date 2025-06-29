"use client";

import Link from "next/link";

interface SidebarProps {
  isAdmin: boolean;
  tier: string;
}

export default function Sidebar({ isAdmin, tier }: SidebarProps) {
  return (
    <aside className="w-64 h-full bg-gray-50 border-r flex flex-col">
      <div className="p-4 text-2xl font-bold">LayerX</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center p-2 rounded-lg hover:bg-gray-100"
        >
          Overview
        </Link>
        <Link
          href="/dashboard/metrics"
          className="flex items-center p-2 rounded-lg hover:bg-gray-100"
        >
          Metrics
        </Link>
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex items-center p-2 rounded-lg hover:bg-gray-100"
          >
            Settings
          </Link>
        )}
        {tier !== "Free" && (
          <Link
            href="/dashboard/advanced"
            className="flex items-center p-2 rounded-lg hover:bg-gray-100"
          >
            Advanced
          </Link>
        )}
      </nav>
      <div className="p-4 text-sm text-gray-600 border-t">{tier}</div>
    </aside>
  );
}
