'use client';

import Link from 'next/link';
import { BarChart3, Warehouse, DollarSign, AlertTriangle } from 'lucide-react';

const reports = [
  {
    title: 'Ventas',
    description: 'Ventas por período, por producto, por categoría',
    href: '/admin/reportes/ventas',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Inventario',
    description: 'Valor del inventario, rotación, productos sin movimiento',
    href: '/admin/reportes/inventario',
    icon: Warehouse,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Financiero',
    description: 'Ingresos vs costos, margen por producto',
    href: '/admin/reportes/financiero',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Por Vencer',
    description: 'Productos por vencer en 30/60/90 días con valor',
    href: '/admin/reportes/por-vencer',
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Selecciona un reporte para generar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {report.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
