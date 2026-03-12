'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  department: string;
  instructions?: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    department: 'Chimaltenango',
    instructions: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = () => {
    setLoading(true);
    apiClient
      .get('/auth/me/addresses')
      .then(({ data }) => setAddresses(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/auth/me/addresses', form);
      setShowForm(false);
      setForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', department: 'Chimaltenango', instructions: '' });
      loadAddresses();
    } catch {}
  };

  const deleteAddress = async (id: string) => {
    try {
      await apiClient.delete(`/auth/me/addresses/${id}`);
      setAddresses((a) => a.filter((addr) => addr.id !== id));
    } catch {}
  };

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Mis Direcciones</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre completo</label>
              <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Teléfono</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Dirección</label>
              <input type="text" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ciudad</label>
              <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Departamento</label>
              <input type="text" value={form.department} onChange={(e) => update('department', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium">Guardar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted/50 rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No tienes direcciones guardadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{addr.fullName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{addr.addressLine1}</p>
                  <p className="text-sm text-muted-foreground">{addr.city}, {addr.department}</p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                </div>
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
