'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch {
      setError('El enlace ha expirado o no es válido. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tu contraseña ha sido restablecida exitosamente.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Enlace inválido</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Este enlace de restablecimiento no es válido.
        </p>
        <Link href="/olvidar-contrasena" className="text-primary font-medium hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige una nueva contraseña para tu cuenta
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              confirmPassword && password !== confirmPassword
                ? 'border-destructive'
                : 'border-border'
            }`}
            placeholder="Repetir contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!!confirmPassword && password !== confirmPassword)}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center animate-pulse"><div className="h-8 bg-muted/50 rounded w-48 mx-auto" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
