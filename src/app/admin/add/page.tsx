"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TOPICS, DEFAULT_CAPABILITIES } from "@/lib/types";

const STEPS = ["Basic Info", "Links", "Categories", "Files", "Review"];

export default function AddDemoPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [topics, setTopicsOptions] = useState<string[]>(DEFAULT_TOPICS);
  const [capabilities, setCapabilitiesOptions] = useState<string[]>(DEFAULT_CAPABILITIES);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.topics) setTopicsOptions(data.topics);
        if (data.capabilities) setCapabilitiesOptions(data.capabilities);
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    demo_type: "SPCS" as "SPCS" | "STREAMLIT",
    entry_url: "",
    video_url: "",
    topics: [] as string[],
    capabilities: [] as string[],
    status: "PUBLISHED" as string,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const updateForm = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArray = (key: "topics" | "capabilities", val: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter((v) => v !== val)
        : [...prev[key], val],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          thumbnail_stage_path: imageFile ? `${form.name.toLowerCase().replace(/\s+/g, "_")}/${imageFile.name}` : null,
          click_script_stage_path: scriptFile ? `${form.name.toLowerCase().replace(/\s+/g, "_")}/${scriptFile.name}` : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create demo");
      }

      const { id } = await res.json();

      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append("file", imageFile);
        imgForm.append("stageType", "images");
        imgForm.append("destPath", `${form.name.toLowerCase().replace(/\s+/g, "_")}/${imageFile.name}`);
        await fetch("/api/upload", { method: "POST", body: imgForm });
      }

      if (scriptFile) {
        const scriptForm = new FormData();
        scriptForm.append("file", scriptFile);
        scriptForm.append("stageType", "scripts");
        scriptForm.append("destPath", `${form.name.toLowerCase().replace(/\s+/g, "_")}/${scriptFile.name}`);
        await fetch("/api/upload", { method: "POST", body: scriptForm });
      }

      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return form.entry_url.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add New Demo</h1>

      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-[var(--sf-blue)]" : "bg-gray-200"}`} />
            <p className={`text-[10px] mt-1 ${i === step ? "text-[var(--sf-dark)] font-medium" : "text-gray-400"}`}>
              {s}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demo Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
                placeholder="e.g. Predictive Maintenance Demo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => updateForm("short_description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
                placeholder="Brief tagline for the demo tile"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)] min-h-[100px]"
                placeholder="Detailed description shown in the info panel"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demo Type *</label>
              <div className="flex gap-3">
                {(["SPCS", "STREAMLIT"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateForm("demo_type", t)}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.demo_type === t
                        ? "bg-[var(--sf-blue)] text-white border-[var(--sf-blue)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[var(--sf-blue)]"
                    }`}
                  >
                    {t === "SPCS" ? "React on SPCS" : "Streamlit in Snowflake"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry URL *</label>
              <input
                type="url"
                value={form.entry_url}
                onChange={(e) => updateForm("entry_url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-400 mt-1">The URL that opens when a user clicks Launch</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => updateForm("video_url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
                placeholder="https://youtube.com/... or mp4 URL"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleArray("topics", t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.topics.includes(t)
                        ? "bg-[var(--sf-blue)] text-white border-[var(--sf-blue)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[var(--sf-blue)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capabilities</label>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleArray("capabilities", c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.capabilities.includes(c)
                        ? "bg-[var(--sf-blue)] text-white border-[var(--sf-blue)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[var(--sf-blue)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot Image</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg mb-2" />
                    <p className="text-xs text-gray-500">{imageFile?.name}</p>
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 mb-2">Upload a screenshot of the demo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Click Script (PDF/DOCX)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                {scriptFile ? (
                  <div>
                    <p className="text-sm text-gray-700">{scriptFile.name}</p>
                    <button
                      onClick={() => setScriptFile(null)}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 mb-2">Upload a click script document</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.html"
                      onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Review</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span>{form.demo_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Entry URL:</span>
                <span className="text-xs truncate max-w-[200px]">{form.entry_url}</span>
              </div>
              {form.video_url && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Video:</span>
                  <span className="text-xs truncate max-w-[200px]">{form.video_url}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Topics:</span>
                <span>{form.topics.join(", ") || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Capabilities:</span>
                <span>{form.capabilities.join(", ") || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Screenshot:</span>
                <span>{imageFile?.name || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Click Script:</span>
                <span>{scriptFile?.name || "None"}</span>
              </div>
            </div>

            {imagePreview && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Tile Preview:</p>
                <div className="w-64 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <img src={imagePreview} alt="" className="w-full aspect-video object-cover" />
                  <div className="p-3">
                    <h4 className="font-semibold text-xs text-gray-900">{form.name}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{form.short_description}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/admin")}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)] disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Demo"}
          </button>
        )}
      </div>
    </div>
  );
}
