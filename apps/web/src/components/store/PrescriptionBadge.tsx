import { FileWarning } from 'lucide-react';

export default function PrescriptionBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
      <FileWarning className="w-3 h-3" />
      Requiere Receta
    </span>
  );
}
