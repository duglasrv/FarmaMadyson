'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Warehouse } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

interface InventoryReport {
  summary: { totalValue: number; totalItems: number; lowStockCount: number; zeroStockCount: number };
  items: {
    sku: string;
    product: string;
    variant: string;
    category: string;
    stock: number;
    costPrice: number;
    salePrice: number;
    inventoryValue: number;
    minStock: number;
    isLowStock: boolean;
  }[];
}

export default function InventoryReportPage() {
  const { data, isLoading } = useQuery<InventoryReport>({
    queryKey: ['report-inventory'],
    queryFn: () => api.get('/reports/inventory').then((r) => r.data),
  });

  const handleExport = () => {
    if (!data) return;
    exportToExcel(
      data.items.map((i) => ({
        SKU: i.sku,
        Producto: i.product,
        Variante: i.variant,
        Categoría: i.category,
        Stock: i.stock,
        'Stock Mínimo': i.minStock,
        'Precio Costo (Q)': i.costPrice.toFixed(2),
        'Precio Venta (Q)': i.salePrice.toFixed(2),
        'Valor Inventario (Q)': i.inventoryValue.toFixed(2),
        'Stock Bajo': i.isLowStock ? 'Sí' : 'No',
      })),
      'inventario',
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            Reporte de Inventario
          </h1>
          <p className="text-sm text-muted-foreground">Valor del inventario, rotación y alertas</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(
              [
                { label: 'Valor Total Inventario', value: formatPrice(data.summary.totalValue) },
                { label: 'Total Productos', value: data.summary.totalItems.toString() },
                { label: 'Stock Bajo', value: data.summary.lowStockCount.toString(), color: 'text-amber-600' },
                { label: 'Sin Stock', value: data.summary.zeroStockCount.toString(), color: 'text-red-600' },
              ] as const
            ).map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${'color' in kpi ? kpi.color : 'text-foreground'}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">Detalle de Inventario</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium text-xs uppercase">SKU</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Producto</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Stock</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Mínimo</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Precio Venta</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Valor Inv.</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product}</p>
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{item.stock}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{item.minStock}</td>
                      <td className="px-3 py-2 text-right">{formatPrice(item.salePrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatPrice(item.inventoryValue)}</td>
                      <td className="px-3 py-2">
                        {item.stock === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">
                            Agotado
                          </span>
                        ) : item.isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                            Bajo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
