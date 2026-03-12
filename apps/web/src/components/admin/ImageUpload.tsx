'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ImageUploadProps {
  /** Current URL value (for the text field) */
  value: string;
  /** Called when the URL changes (from upload or manual input) */
  onChange: (url: string) => void;
  /** Supabase storage folder */
  folder?: string;
  /** Label shown above the field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder for the URL input */
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = 'general',
  label = 'Imagen',
  required = false,
  placeholder = 'https://... o sube una imagen',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post(`/storage/upload?folder=${encodeURIComponent(folder)}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onChange(res.data.url);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al subir imagen');
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground">
          {label} {required && '*'}
        </label>
      )}

      {/* URL text input */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <Upload className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">
          {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir'}
        </span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-auto rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 p-0.5 bg-destructive text-white rounded-full hover:bg-destructive/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Multi-image variant ──────────────────────────────────────────────

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  max?: number;
}

export function MultiImageUpload({
  values,
  onChange,
  folder = 'products',
  label = 'Imágenes',
  max = 10,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setError(null);
      const remaining = max - values.length;
      if (remaining <= 0) {
        setError(`Máximo ${max} imágenes`);
        return;
      }

      const toUpload = Array.from(files).slice(0, remaining);
      setUploading(true);
      try {
        const formData = new FormData();
        toUpload.forEach((f) => formData.append('files', f));
        const res = await apiClient.post(
          `/storage/upload-multiple?folder=${encodeURIComponent(folder)}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        const newUrls: string[] = res.data.map((r: { url: string }) => r.url);
        onChange([...values, ...newUrls]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al subir imágenes');
      } finally {
        setUploading(false);
      }
    },
    [folder, max, onChange, values],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
    },
    [handleUpload],
  );

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (url && values.length < max) {
      onChange([...values, url]);
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground">
          {label} ({values.length}/{max})
        </label>
      )}

      {/* Manual URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Pegar URL de imagen..."
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim() || values.length >= max}
          className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Agregar
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <Upload className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">
          {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir imágenes'}
        </span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Thumbnails */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {values.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Imagen ${i + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 p-0.5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
