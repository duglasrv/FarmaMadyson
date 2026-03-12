'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';

export default function NuevaPaginaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
  });

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => api.post('/pages', form),
    onSuccess: () => router.push('/admin/configuracion/paginas'),
  });

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/configuracion/paginas"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a páginas
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nueva Página</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!form.slug || form.slug === generateSlug(form.title.slice(0, -1) + '')) {
                  set('slug', generateSlug(e.target.value));
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-sm">/</span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contenido *</label>
            <textarea
              required
              rows={16}
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="Contenido HTML de la página..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">SEO</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Título</label>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => set('metaTitle', e.target.value)}
              placeholder={form.title}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Descripción</label>
            <textarea
              rows={2}
              value={form.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set('isPublished', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">Publicar página</span>
          </label>
        </div>

        {mutation.isError && (
          <p className="text-red-600 text-sm">Error al crear la página. Verifica que el slug no esté duplicado.</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
        >
          {mutation.isPending ? 'Creando...' : 'Crear Página'}
        </button>
      </form>
    </div>
  );
}
