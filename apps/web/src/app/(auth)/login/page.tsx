'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
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
