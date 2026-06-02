"use client";

import { useState, useEffect, useMemo } from "react";
import { Demo, DEFAULT_TOPICS, DEFAULT_CAPABILITIES } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import DemoGrid from "@/components/DemoGrid";
import DemoDetail from "@/components/DemoDetail";

export default function Home() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [capabilities, setCapabilities] = useState<string[]>(DEFAULT_CAPABILITIES);

  useEffect(() => {
    fetch("/api/demos")
      .then((r) => r.json())
      .then((data) => {
        setDemos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics);
        if (data.capabilities) setCapabilities(data.capabilities);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return demos.filter((d) => {
      if (d.status !== "PUBLISHED") return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !d.name.toLowerCase().includes(q) &&
          !d.short_description?.toLowerCase().includes(q) &&
          !d.description?.toLowerCase().includes(q)
        )
          return false;
      }

      if (selectedTopics.length > 0) {
        if (!selectedTopics.some((t) => d.topics.includes(t))) return false;
      }

      if (selectedCapabilities.length > 0) {
        if (!selectedCapabilities.some((c) => d.capabilities.includes(c))) return false;
      }

      return true;
    });
  }, [demos, search, selectedTopics, selectedCapabilities]);

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedTopics={selectedTopics}
          onTopicsChange={setSelectedTopics}
          selectedCapabilities={selectedCapabilities}
          onCapabilitiesChange={setSelectedCapabilities}
          topics={topics}
          capabilities={capabilities}
        />
      </div>

      <div>
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[var(--sf-blue)] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm mt-2">Loading demos...</p>
          </div>
        ) : (
          <DemoGrid demos={filtered} onInfo={setSelectedDemo} />
        )}
      </div>

      <DemoDetail demo={selectedDemo} onClose={() => setSelectedDemo(null)} />
    </div>
  );
}
