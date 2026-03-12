import { FileWarning } from 'lucide-react';

export default function PrescriptionBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-teal-50 text-teal-600 border border-teal-200 px-2 py-1 rounded-full">
      <FileWarning className="w-3 h-3" />
      Requiere Receta
    </span>
  );
}
