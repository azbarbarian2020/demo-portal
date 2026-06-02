"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newCapability, setNewCapability] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics);
        if (data.capabilities) setCapabilities(data.capabilities);
      });
  }, []);

  const addTopic = () => {
    const val = newTopic.trim();
    if (val && !topics.includes(val)) {
      setTopics([...topics, val]);
      setNewTopic("");
    }
  };

  const addCapability = () => {
    const val = newCapability.trim();
    if (val && !capabilities.includes(val)) {
      setCapabilities([...capabilities, val]);
      setNewCapability("");
    }
  };

  const removeTopic = (t: string) => setTopics(topics.filter((x) => x !== t));
  const removeCapability = (c: string) => setCapabilities(capabilities.filter((x) => x !== c));

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics, capabilities }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <button
          onClick={() => router.push("/admin")}
          className="text-sm text-gray-500 hover:underline"
        >
          Back to Admin
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Topics</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {topics.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--sf-light)] text-[var(--sf-dark)]">
                {t}
                <button onClick={() => removeTopic(t)} className="text-[var(--sf-dark)] hover:text-red-500 ml-0.5">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="Add topic..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
            />
            <button
              onClick={addTopic}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)]"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Capabilities</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {capabilities.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {c}
                <button onClick={() => removeCapability(c)} className="text-gray-500 hover:text-red-500 ml-0.5">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCapability}
              onChange={(e) => setNewCapability(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCapability()}
              placeholder="Add capability..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
            />
            <button
              onClick={addCapability}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)]"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
