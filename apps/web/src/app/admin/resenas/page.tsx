'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Search, Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  product: { id: string; name: string; slug: string; images: string[] };
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  avgRating: number;
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (filterApproved) params.isApproved = filterApproved;
      if (filterRating) params.rating = filterRating;

      const { data } = await apiClient.get('/reviews', { params });
      setReviews(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, filterApproved, filterRating]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/reviews/stats');
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApprove = async (id: string) => {
    await apiClient.patch(`/reviews/${id}/approve`);
    fetchReviews();
    fetchStats();
  };

  const handleReject = async (id: string) => {
    await apiClient.patch(`/reviews/${id}/reject`);
    fetchReviews();
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    await apiClient.delete(`/reviews/${id}`);
    fetchReviews();
    fetchStats();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          Reseñas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra las reseñas de productos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Aprobadas', value: stats.approved, color: 'text-green-600' },
          { label: 'Pendientes', value: stats.pending, color: 'text-amber-600' },
          { label: 'Calificación Promedio', value: stats.avgRating.toFixed(1), color: 'text-yellow-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por producto o comentario..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterApproved}
            onChange={(e) => { setFilterApproved(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos los estados</option>
            <option value="true">Aprobadas</option>
            <option value="false">Pendientes</option>
          </select>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todas las calificaciones</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} estrella{r > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
            No se encontraron reseñas
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className="flex gap-4">
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {review.product.images?.[0] ? (
                    <img src={review.product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-foreground truncate">{review.product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(review.rating)}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          review.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {review.isApproved ? 'Aprobada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!review.isApproved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {review.isApproved && (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {review.title && (
                    <p className="text-sm font-medium text-foreground mt-2">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{review.user.firstName} {review.user.lastName}</span>
                    <span>·</span>
                    <span>{review.user.email}</span>
                    <span>·</span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {meta.total} reseñas — Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
