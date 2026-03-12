'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-foreground mb-2">Verificando...</h2>
          <p className="text-sm text-muted-foreground">
            Estamos verificando tu correo electrónico
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">¡Correo verificado!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tu cuenta ha sido verificada exitosamente.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Iniciar Sesión
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Error de verificación</h2>
          <p className="text-sm text-muted-foreground mb-6">
            El enlace de verificación ha expirado o no es válido.
          </p>
          <Link href="/login" className="text-primary font-medium hover:underline">
            Volver al inicio de sesión
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center"><Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" /><p>Verificando...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
