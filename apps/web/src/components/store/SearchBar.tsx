'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({ initialQuery = '', className = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar medicamentos, suplementos..."
          className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
