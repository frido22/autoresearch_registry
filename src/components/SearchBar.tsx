"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [hardware, setHardware] = useState(
    searchParams.get("hardware") || ""
  );
  const [status, setStatus] = useState(searchParams.get("status") || "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (hardware) params.set("hardware", hardware);
    if (status) params.set("status", status);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search experiments..."
          className="flex-1 border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-black"
        />
        <button
          type="submit"
          className="border border-black px-4 py-1.5 text-sm hover:bg-black hover:text-white transition-colors"
        >
          search
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={hardware}
          onChange={(e) => setHardware(e.target.value)}
          placeholder="hardware (e.g. H100)"
          className="border border-gray-200 px-2 py-1 text-xs font-mono focus:outline-none focus:border-gray-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 px-2 py-1 text-xs font-mono focus:outline-none focus:border-gray-400 bg-white"
        >
          <option value="">all status</option>
          <option value="keep">keep</option>
          <option value="discard">discard</option>
          <option value="crash">crash</option>
        </select>
      </div>
    </form>
  );
}
