"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_TOPICS, DEFAULT_CAPABILITIES, Demo } from "@/lib/types";

export default function EditDemoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [topicOptions, setTopicOptions] = useState<string[]>(DEFAULT_TOPICS);
  const [capabilityOptions, setCapabilityOptions] = useState<string[]>(DEFAULT_CAPABILITIES);

  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    demo_type: "SPCS" as "SPCS" | "STREAMLIT",
    entry_url: "",
    video_url: "",
    topics: [] as string[],
    capabilities: [] as string[],
    status: "PUBLISHED",
    thumbnail_stage_path: "" as string | null,
    click_script_stage_path: "" as string | null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/demos/${id}`)
      .then((r) => r.json())
      .then((data: Demo) => {
        setForm({
          name: data.name || "",
          short_description: data.short_description || "",
          description: data.description || "",
          demo_type: data.demo_type || "SPCS",
          entry_url: data.entry_url || "",
          video_url: data.video_url || "",
          topics: data.topics || [],
          capabilities: data.capabilities || [],
          status: data.status || "PUBLISHED",
          thumbnail_stage_path: data.thumbnail_stage_path,
          click_script_stage_path: data.click_script_stage_path,
        });
        if (data.thumbnail_url) {
          setImagePreview(data.thumbnail_url);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.topics) setTopicOptions(data.topics);
        if (data.capabilities) setCapabilityOptions(data.capabilities);
      })
      .catch(() => {});
  }, [id]);

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
      const slug = form.name.toLowerCase().replace(/\s+/g, "_");
      let thumbnail_stage_path = form.thumbnail_stage_path;
      let click_script_stage_path = form.click_script_stage_path;

      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append("file", imageFile);
        imgForm.append("stageType", "images");
        imgForm.append("destPath", `${slug}/${imageFile.name}`);
        await fetch("/api/upload", { method: "POST", body: imgForm });
        thumbnail_stage_path = `${slug}/${imageFile.name}`;
      }

      if (scriptFile) {
        const scriptForm = new FormData();
        scriptForm.append("file", scriptFile);
        scriptForm.append("stageType", "scripts");
        scriptForm.append("destPath", `${slug}/${scriptFile.name}`);
        await fetch("/api/upload", { method: "POST", body: scriptForm });
        click_script_stage_path = `${slug}/${scriptFile.name}`;
      }

      const res = await fetch(`/api/demos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          thumbnail_stage_path,
          click_script_stage_path,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update demo");
      }

      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Demo</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Demo Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <input
            type="text"
            value={form.short_description}
            onChange={(e) => updateForm("short_description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)] min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Demo Type</label>
            <div className="flex gap-2">
              {(["SPCS", "STREAMLIT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateForm("demo_type", t)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.demo_type === t
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entry URL</label>
          <input
            type="url"
            value={form.entry_url}
            onChange={(e) => updateForm("entry_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => updateForm("video_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
          <div className="flex flex-wrap gap-2">
            {topicOptions.map((t) => (
              <button
                key={t}
                onClick={() => toggleArray("topics", t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
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
            {capabilityOptions.map((c) => (
              <button
                key={c}
                onClick={() => toggleArray("capabilities", c)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
          {imagePreview && (
            <div className="mb-2">
              <img src={imagePreview} alt="Current" className="max-h-32 rounded-lg border border-gray-200 mb-1" />
              <button
                onClick={() => { setImagePreview(null); setImageFile(null); updateForm("thumbnail_stage_path", null); }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove image
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs" />
          {form.thumbnail_stage_path && !imageFile && !imagePreview && (
            <p className="text-xs text-gray-400 mt-1">Current: {form.thumbnail_stage_path}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Click Script</label>
          {form.click_script_stage_path && !scriptFile && (
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs text-gray-600">{form.click_script_stage_path}</p>
              <button
                onClick={() => updateForm("click_script_stage_path", null)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept=".pdf,.docx,.doc,.html"
            onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
            className="text-xs"
          />
          {form.click_script_stage_path && !scriptFile && (
            <p className="text-xs text-gray-400 mt-1">Current: {form.click_script_stage_path}</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)] disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
