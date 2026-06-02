"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#0c2340] to-[#11567F] px-8 py-5 flex items-center justify-between shadow-lg">
      <Link href="/" className="flex items-center gap-5">
        <img
          src="/logo_no_text.png"
          alt="Manufacturing West Demo Portal"
          className="h-28 w-28 rounded-full object-contain"
        />
        <div>
          <h1 className="text-white text-lg font-bold tracking-wide">Manufacturing West</h1>
          <p className="text-blue-200 text-xs font-medium tracking-wider uppercase">Demo Portal</p>
        </div>
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-200 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/10"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}
