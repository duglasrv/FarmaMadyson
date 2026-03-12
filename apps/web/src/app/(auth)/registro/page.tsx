'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    setLoading(true);
    setError('');
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      // Auto-login after successful registration
      await login(form.email, form.password);
      window.location.href = redirectTo;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Crear Cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Regístrate para comprar en Farma Madyson
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Juan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Apellido</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Pérez"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Correo electrónico</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="+502 0000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
          <label className="block text-sm font-medium text-foreground mb-1">Confirmar contraseña</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            required
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              form.confirmPassword && form.password !== form.confirmPassword
                ? 'border-destructive'
                : 'border-border'
            }`}
            placeholder="Repetir contraseña"
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-destructive mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
