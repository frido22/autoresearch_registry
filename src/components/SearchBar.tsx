"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="flex gap-2">
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
    </form>
  );
}
