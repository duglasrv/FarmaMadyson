'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, verify2fa } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result?.requiresTwoFactor) {
        setNeeds2FA(true);
        setTempToken(result.tempToken || '');
      } else {
        const adminRoles = ['super_admin', 'admin', 'pharmacist', 'warehouse', 'sales'];
        const isAdmin = result?.user?.roles?.some((r: string) => adminRoles.includes(r));
        window.location.href = isAdmin ? '/admin' : redirectTo;
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const verifyResult = await verify2fa(tempToken, twoFACode);
      const adminRoles = ['super_admin', 'admin', 'pharmacist', 'warehouse', 'sales'];
      const isAdmin = verifyResult?.user?.roles?.some((r: string) => adminRoles.includes(r));
      window.location.href = isAdmin ? '/admin' : redirectTo;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Iniciar Sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa a tu cuenta de Farma Madyson
        </p>
      </div>

      {!mounted ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-mist rounded-lg" />
          <div className="h-10 bg-mist rounded-lg" />
          <div className="h-10 bg-mist rounded-lg" />
        </div>
      ) : (<>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {!needs2FA ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border" />
              Recordarme
            </label>
            <Link href="/olvidar-contrasena" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground">o continúa con</span>
            </div>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </a>
        </form>
      ) : (
        <form onSubmit={handle2FA} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Ingresa el código de verificación enviado a tu correo
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Código de verificación
            </label>
            <input
              type="text"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              required
              maxLength={6}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-primary font-medium hover:underline">
          Regístrate aquí
        </Link>
      </p>
      </>)}
    </div>
  );
}
