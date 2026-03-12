'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: Category[];
}

interface CategoryMenuProps {
  activeSlug?: string;
}

export default function CategoryMenu({ activeSlug }: CategoryMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiClient
      .get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => {});
  }, []);

  return (
    <nav className="bg-white rounded-xl border border-border overflow-hidden">
      <h3 className="px-4 py-3 font-semibold text-sm border-b border-border flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-primary" />
        Categorías
      </h3>
      <ul className="divide-y divide-border">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/categorias/${cat.slug}`}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted hover:text-primary ${
                activeSlug === cat.slug ? 'bg-muted text-primary font-medium' : 'text-foreground'
              }`}
            >
              <span>{cat.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
