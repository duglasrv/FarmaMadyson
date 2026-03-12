'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Settings, CreditCard, Truck, Receipt } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

type Tab = 'general' | 'payments' | 'shipping' | 'taxes';

interface TabDef {
  id: Tab;
  label: string;
  icon: typeof Settings;
  group: string;
}

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: Settings, group: 'general' },
  { id: 'payments', label: 'Pagos', icon: CreditCard, group: 'payments' },
  { id: 'shipping', label: 'Envíos', icon: Truck, group: 'shipping' },
  { id: 'taxes', label: 'Impuestos', icon: Receipt, group: 'taxes' },
];

// Define the fields for each settings group
const fieldDefs: Record<Tab, { key: string; label: string; type: 'text' | 'number' | 'boolean' | 'textarea'; placeholder?: string }[]> = {
  general: [
    { key: 'store_name', label: 'Nombre de la tienda', type: 'text', placeholder: 'Farma Madyson' },
    { key: 'store_email', label: 'Email de contacto', type: 'text', placeholder: 'contacto@farmamadyson.com' },
    { key: 'store_phone', label: 'Teléfono', type: 'text', placeholder: '7890-1234' },
    { key: 'store_address', label: 'Dirección', type: 'textarea', placeholder: 'Dirección de la farmacia' },
    { key: 'store_schedule', label: 'Horario de atención', type: 'text', placeholder: 'Lun-Sáb 8:00-20:00' },
    { key: 'currency_symbol', label: 'Símbolo de moneda', type: 'text', placeholder: 'Q' },
    { key: 'maintenance_mode', label: 'Modo mantenimiento', type: 'boolean' },
  ],
  payments: [
    { key: 'payment_cash_enabled', label: 'Efectivo habilitado', type: 'boolean' },
    { key: 'payment_card_enabled', label: 'Tarjeta habilitada', type: 'boolean' },
    { key: 'payment_transfer_enabled', label: 'Transferencia habilitada', type: 'boolean' },
    { key: 'payment_instructions', label: 'Instrucciones de pago', type: 'textarea', placeholder: 'Instrucciones para el cliente al momento de pagar...' },
    { key: 'min_order_amount', label: 'Monto mínimo de pedido (Q)', type: 'number', placeholder: '0' },
  ],
  shipping: [
    { key: 'shipping_enabled', label: 'Envíos habilitados', type: 'boolean' },
    { key: 'shipping_flat_rate', label: 'Tarifa plana de envío (Q)', type: 'number', placeholder: '25.00' },
    { key: 'shipping_free_threshold', label: 'Envío gratis desde (Q)', type: 'number', placeholder: '200.00' },
    { key: 'pickup_enabled', label: 'Recogida en tienda', type: 'boolean' },
    { key: 'delivery_zones', label: 'Zonas de entrega', type: 'textarea', placeholder: 'Zona 1, Zona 2, ...' },
    { key: 'estimated_delivery', label: 'Tiempo estimado de entrega', type: 'text', placeholder: '1-3 días hábiles' },
  ],
  taxes: [
    { key: 'tax_enabled', label: 'Impuestos habilitados', type: 'boolean' },
    { key: 'tax_rate', label: 'Tasa de IVA (%)', type: 'number', placeholder: '12' },
    { key: 'tax_included', label: 'Precios incluyen IVA', type: 'boolean' },
    { key: 'tax_id_label', label: 'Etiqueta de NIT', type: 'text', placeholder: 'NIT' },
    { key: 'default_tax_id', label: 'NIT por defecto (Consumidor Final)', type: 'text', placeholder: 'CF' },
  ],
};

export default function AdminConfiguracionPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load all settings
  const { data: settings, isLoading } = useQuery<Record<string, Record<string, any>>>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });

  // When settings load or tab changes, populate form
  useEffect(() => {
    if (!settings) return;
    const tabDef = tabs.find((t) => t.id === activeTab);
    if (!tabDef) return;
    const group = settings[tabDef.group] ?? {};
    const fields = fieldDefs[activeTab];
    const initial: Record<string, any> = {};
    for (const field of fields) {
      initial[field.key] = group[field.key] ?? (field.type === 'boolean' ? false : '');
    }
    setFormData(initial);
    setDirty(false);
  }, [settings, activeTab]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const tabDef = tabs.find((t) => t.id === activeTab);
      const group = tabDef?.group ?? 'general';
      const items = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
        group,
      }));
      return api.patch('/settings', items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setDirty(false);
      showToast('Configuración guardada');
    },
    onError: () => showToast('Error al guardar', 'error'),
  });

  const fields = fieldDefs[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Administra la configuración general de la tienda</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-border overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/5 text-primary font-medium border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted/50 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form */}
        <div className="flex-1 bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!dirty || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {fields.map((field) => (
                <div key={field.key}>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[field.key]}
                        onChange={(e) => updateField(field.key, e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm font-medium">{field.label}</span>
                    </label>
                  ) : field.type === 'textarea' ? (
                    <>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <textarea
                        value={formData[field.key] ?? ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        rows={3}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={formData[field.key] ?? ''}
                        onChange={(e) =>
                          updateField(
                            field.key,
                            field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value,
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
