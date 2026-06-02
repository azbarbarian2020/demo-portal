"use client";

import { Demo } from "@/lib/types";

interface DemoTileProps {
  demo: Demo;
  onInfo: (demo: Demo) => void;
}

export default function DemoTile({ demo, onInfo }: DemoTileProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col group">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {demo.thumbnail_url ? (
          <img
            src={demo.thumbnail_url}
            alt={demo.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 text-[var(--sf-dark)]">
          {demo.demo_type}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{demo.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{demo.short_description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {demo.topics.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--sf-light)] text-[var(--sf-dark)] font-medium">
              {t}
            </span>
          ))}
          {demo.capabilities.slice(0, 2).map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {c}
            </span>
          ))}
          {demo.capabilities.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              +{demo.capabilities.length - 2}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href={demo.entry_url.startsWith("http") ? demo.entry_url : `https://${demo.entry_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-[var(--sf-blue)] text-white hover:bg-[var(--sf-dark)] transition-colors"
          >
            Launch
          </a>
          <button
            onClick={() => onInfo(demo)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
}
