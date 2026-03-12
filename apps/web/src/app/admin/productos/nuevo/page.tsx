'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { apiClient as api } from '@/lib/api-client';
import { MultiImageUpload } from '@/components/admin/ImageUpload';

interface VariantForm {
  name: string;
  sku: string;
  supplierCode: string;
  purchasePrice: string;
  suggestedPrice: string;
  salePrice: string;
  compareAtPrice: string;
  taxExempt: boolean;
  lowStockThreshold: string;
}

const emptyVariant: VariantForm = {
  name: '',
  sku: '',
  supplierCode: '',
  purchasePrice: '',
  suggestedPrice: '',
  salePrice: '',
  compareAtPrice: '',
  taxExempt: true,
  lowStockThreshold: '5',
};

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    productType: 'MEDICINE',
    requiresPrescription: false,
    metaTitle: '',
    metaDescription: '',
  });

  const [pharma, setPharma] = useState({
    activeIngredient: '',
    concentration: '',
    dosageForm: '',
    administrationRoute: '',
    therapeuticAction: '',
    contraindications: '',
    sideEffects: '',
    storageConditions: '',
    isControlled: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([{ ...emptyVariant }]);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/brands').then((r) => r.data),
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        images,
        variants: variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          supplierCode: v.supplierCode || undefined,
          purchasePrice: parseFloat(v.purchasePrice) || 0,
          suggestedPrice: v.suggestedPrice ? parseFloat(v.suggestedPrice) : undefined,
          salePrice: parseFloat(v.salePrice) || 0,
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
          taxExempt: v.taxExempt,
          lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
        })),
        pharmaInfo: form.productType === 'MEDICINE' ? pharma : undefined,
      };
      return api.post('/products', payload).then((r) => r.data);
    },
    onSuccess: () => router.push('/admin/productos'),
  });

  const updateField = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));

  const addVariant = () => setVariants((prev) => [...prev, { ...emptyVariant }]);

  const removeVariant = (index: number) =>
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Producto</h1>
          <p className="text-sm text-muted-foreground">Crea un producto para el catálogo</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProduct.mutate();
        }}
        className="space-y-6"
      >
        {/* Basic Info */}
        <Section title="Información Básica">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(v) => updateField('name', v)}
                placeholder="Ej: Amoxicilina 500mg"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Descripción del producto..."
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                {(categories?.data || categories || []).map(
                  (cat: { id: string; name: string }) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label>Marca / Laboratorio</Label>
              <select
                value={form.brandId}
                onChange={(e) => updateField('brandId', e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                {(brands?.data || brands || []).map(
                  (b: { id: string; name: string }) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label>Tipo de Producto *</Label>
              <select
                value={form.productType}
                onChange={(e) => updateField('productType', e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="MEDICINE">Medicamento</option>
                <option value="SUPPLEMENT">Suplemento</option>
                <option value="PERSONAL_CARE">Cuidado Personal</option>
                <option value="BABY_CARE">Bebé</option>
                <option value="MEDICAL_DEVICE">Dispositivo Médico</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                checked={form.requiresPrescription}
                onChange={(e) => updateField('requiresPrescription', e.target.checked)}
                id="prescription"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="prescription" className="text-sm">
                Requiere prescripción médica
              </label>
            </div>
          </div>
        </Section>

        {/* Images */}
        <Section title="Imágenes del Producto">
          <MultiImageUpload
            values={images}
            onChange={setImages}
            folder="products"
            label="Imágenes"
            max={10}
          />
        </Section>

        {/* Variants */}
        <Section
          title="Variantes"
          action={
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar variante
            </button>
          }
        >
          {variants.map((v, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-border space-y-4 relative"
            >
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre variante *</Label>
                  <Input
                    value={v.name}
                    onChange={(val) => updateVariant(i, 'name', val)}
                    placeholder="Ej: Caja 30 tablets"
                    required
                  />
                </div>
                <div>
                  <Label>SKU *</Label>
                  <Input
                    value={v.sku}
                    onChange={(val) => updateVariant(i, 'sku', val)}
                    placeholder="Ej: AMX-500-30"
                    required
                  />
                </div>
                <div>
                  <Label>Código Proveedor</Label>
                  <Input
                    value={v.supplierCode}
                    onChange={(val) => updateVariant(i, 'supplierCode', val)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Precio Compra *</Label>
                  <Input
                    value={v.purchasePrice}
                    onChange={(val) => updateVariant(i, 'purchasePrice', val)}
                    type="number"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Precio Sugerido</Label>
                  <Input
                    value={v.suggestedPrice}
                    onChange={(val) => updateVariant(i, 'suggestedPrice', val)}
                    type="number"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Precio Venta *</Label>
                  <Input
                    value={v.salePrice}
                    onChange={(val) => updateVariant(i, 'salePrice', val)}
                    type="number"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Precio Comparación</Label>
                  <Input
                    value={v.compareAtPrice}
                    onChange={(val) => updateVariant(i, 'compareAtPrice', val)}
                    type="number"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={v.taxExempt}
                    onChange={(e) => updateVariant(i, 'taxExempt', e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">Exento de IVA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Umbral stock bajo:</span>
                  <input
                    type="number"
                    value={v.lowStockThreshold}
                    onChange={(e) => updateVariant(i, 'lowStockThreshold', e.target.value)}
                    className="w-16 rounded-lg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Pharma Info */}
        {form.productType === 'MEDICINE' && (
          <Section title="Información Farmacéutica">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Principio Activo</Label>
                <Input
                  value={pharma.activeIngredient}
                  onChange={(v) => setPharma((p) => ({ ...p, activeIngredient: v }))}
                  placeholder="Ej: Amoxicilina"
                />
              </div>
              <div>
                <Label>Concentración</Label>
                <Input
                  value={pharma.concentration}
                  onChange={(v) => setPharma((p) => ({ ...p, concentration: v }))}
                  placeholder="Ej: 500mg"
                />
              </div>
              <div>
                <Label>Forma Farmacéutica</Label>
                <Input
                  value={pharma.dosageForm}
                  onChange={(v) => setPharma((p) => ({ ...p, dosageForm: v }))}
                  placeholder="Ej: Tableta"
                />
              </div>
              <div>
                <Label>Vía de Administración</Label>
                <Input
                  value={pharma.administrationRoute}
                  onChange={(v) => setPharma((p) => ({ ...p, administrationRoute: v }))}
                  placeholder="Ej: Oral"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Acción Terapéutica</Label>
                <Input
                  value={pharma.therapeuticAction}
                  onChange={(v) => setPharma((p) => ({ ...p, therapeuticAction: v }))}
                  placeholder="Ej: Antibiótico de amplio espectro"
                />
              </div>
              <div>
                <Label>Contraindicaciones</Label>
                <textarea
                  value={pharma.contraindications}
                  onChange={(e) => setPharma((p) => ({ ...p, contraindications: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <div>
                <Label>Efectos Adversos</Label>
                <textarea
                  value={pharma.sideEffects}
                  onChange={(e) => setPharma((p) => ({ ...p, sideEffects: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <div>
                <Label>Condiciones de Almacenamiento</Label>
                <Input
                  value={pharma.storageConditions}
                  onChange={(v) => setPharma((p) => ({ ...p, storageConditions: v }))}
                  placeholder="Ej: Almacenar a menos de 30°C"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  checked={pharma.isControlled}
                  onChange={(e) => setPharma((p) => ({ ...p, isControlled: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">Medicamento Controlado</span>
              </div>
            </div>
          </Section>
        )}

        {/* SEO */}
        <Section title="SEO">
          <div className="space-y-4">
            <div>
              <Label>Meta Title</Label>
              <Input
                value={form.metaTitle}
                onChange={(v) => updateField('metaTitle', v)}
                placeholder="Título para buscadores"
              />
            </div>
            <div>
              <Label>Meta Description</Label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Descripción para buscadores"
              />
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/productos"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createProduct.isPending ? 'Guardando...' : 'Crear Producto'}
          </button>
        </div>

        {createProduct.isError && (
          <p className="text-sm text-destructive">
            Error al crear el producto. Verifica los campos e intenta de nuevo.
          </p>
        )}
      </form>
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      step={type === 'number' ? '0.01' : undefined}
      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
    />
  );
}
