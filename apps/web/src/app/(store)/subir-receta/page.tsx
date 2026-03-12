'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Camera, CheckCircle, ShieldCheck, Clock, Phone } from 'lucide-react';

export default function SubirRecetaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with prescription upload API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">¡Receta recibida!</h1>
        <p className="text-slate leading-relaxed">
          Hemos recibido tu receta médica. Nuestro equipo la revisará y te
          contactará por teléfono o WhatsApp para confirmar la disponibilidad
          y el precio de tus medicamentos.
        </p>
        <p className="text-silver text-sm mt-4">
          Tiempo de respuesta estimado: 1-2 horas en horario laboral
        </p>
        <a
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Subir Receta Médica</h1>
        <p className="text-slate mt-2 max-w-md mx-auto">
          Sube una foto de tu receta y nosotros nos encargamos del resto.
          Te contactaremos para confirmar disponibilidad y precio.
        </p>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="flex items-center gap-3 bg-snow rounded-xl p-4 border border-mist">
          <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span className="text-sm text-charcoal">Datos 100% confidenciales</span>
        </div>
        <div className="flex items-center gap-3 bg-snow rounded-xl p-4 border border-mist">
          <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <span className="text-sm text-charcoal">Respuesta en 1-2 horas</span>
        </div>
        <div className="flex items-center gap-3 bg-snow rounded-xl p-4 border border-mist">
          <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-charcoal">Te llamamos para confirmar</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-mist rounded-2xl p-10 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-200"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          {preview ? (
            <div>
              <img
                src={preview}
                alt="Vista previa de receta"
                className="max-h-64 mx-auto rounded-xl mb-4 shadow-brand-sm"
              />
              <p className="text-sm text-charcoal font-medium">{file?.name}</p>
              <p className="text-xs text-silver mt-1">Haz clic para cambiar archivo</p>
            </div>
          ) : file ? (
            <div>
              <FileText className="w-12 h-12 mx-auto text-purple-300 mb-3" />
              <p className="text-sm text-charcoal font-medium">{file.name}</p>
              <p className="text-xs text-silver mt-1">Haz clic para cambiar archivo</p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-charcoal font-semibold">
                Arrastra tu receta aquí o haz clic para seleccionar
              </p>
              <p className="text-silver text-sm mt-2">
                Formatos: JPG, PNG, PDF — Máx. 10MB
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Camera className="w-4 h-4 text-slate" />
                <span className="text-xs text-slate">También puedes tomar una foto desde tu celular</span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Necesito 2 cajas del medicamento, prefiero genérico si está disponible..."
            rows={3}
            className="w-full border border-mist rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all resize-none placeholder:text-silver"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file}
          className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-semibold text-base
                     hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-brand-sm hover:shadow-brand-md"
        >
          Enviar mi receta
        </button>

        <p className="text-xs text-silver text-center">
          Al enviar tu receta aceptas nuestros términos de servicio y política de privacidad.
          Tu información será tratada con total confidencialidad.
        </p>
      </form>
    </div>
  );
}
