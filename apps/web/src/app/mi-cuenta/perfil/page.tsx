'use client';

import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updatePassField = (field: string, value: string) =>
    setPasswordForm((f) => ({ ...f, [field]: value }));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiClient.patch('/auth/me', form);
      await refreshUser();
      setMessage('Perfil actualizado correctamente.');
    } catch {
      setError('Error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSavingPassword(true);
    setMessage('');
    setError('');
    try {
      await apiClient.patch('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage('Contraseña actualizada correctamente.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Mi Perfil</h2>

      {message && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">{message}</div>
      )}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>
      )}

      {/* Profile info */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-medium text-sm">Información Personal</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Apellido</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted/50 text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-medium text-sm">Cambiar Contraseña</h3>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-medium mb-1">Contraseña actual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => updatePassField('currentPassword', e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => updatePassField('newPassword', e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => updatePassField('confirmPassword', e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                  ? 'border-destructive'
                  : 'border-border'
              }`}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {savingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
