"use client";

import { Demo } from "@/lib/types";
import DemoTile from "./DemoTile";

interface DemoGridProps {
  demos: Demo[];
  onInfo: (demo: Demo) => void;
}

export default function DemoGrid({ demos, onInfo }: DemoGridProps) {
  if (demos.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-gray-500 text-sm">No demos found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {demos.map((demo) => (
        <DemoTile key={demo.id} demo={demo} onInfo={onInfo} />
      ))}
    </div>
  );
}
