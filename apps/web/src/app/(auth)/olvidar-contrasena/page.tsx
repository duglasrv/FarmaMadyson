'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Revisa tu correo</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Si existe una cuenta con {email}, recibirás un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="text-primary font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa tu correo y te enviaremos un enlace para restablecerla
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="tu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
