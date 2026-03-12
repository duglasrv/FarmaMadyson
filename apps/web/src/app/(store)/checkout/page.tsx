'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, MapPin, CreditCard, FileText, ShoppingBag, ArrowLeft, ArrowRight, Upload, FileWarning, Mail, LogIn, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;
type PaymentMethod = 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  department: string;
  instructions?: string;
}

const BANK_INFO = {
  bank: 'Banrural',
  account: '0000-0000-0000',
  name: 'Farma Madyson S.A.',
  nit: '12345678-9',
};

const stepLabels = [
  { step: 1, label: 'Datos', icon: MapPin },
  { step: 2, label: 'Pago', icon: CreditCard },
  { step: 3, label: 'Resumen', icon: FileText },
  { step: 4, label: 'Confirmación', icon: Check },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, refreshUser } = useAuth();
  const { items, calculation, isCalculating, clearCart } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  // Guest checkout fields
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [wantAccount, setWantAccount] = useState(false);
  const [guestPassword, setGuestPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Inline login for existing email
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    department: 'Chimaltenango',
    instructions: '',
  });

  // Load saved addresses for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      apiClient
        .get('/auth/me/addresses')
        .then(({ data }) => setSavedAddresses(data || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Pre-fill from user profile
  useEffect(() => {
    if (user && !newAddress.fullName) {
      setNewAddress((a) => ({
        ...a,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phone || '',
      }));
      setGuestFirstName(user.firstName);
      setGuestLastName(user.lastName);
      setGuestEmail(user.email);
      setGuestPhone(user.phone || '');
    }
  }, [user]);

  // Check if email exists (debounced)
  useEffect(() => {
    if (isAuthenticated || !guestEmail || guestEmail.length < 5) {
      setEmailExists(false);
      setShowInlineLogin(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) return;

    const timeout = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const { data } = await apiClient.post('/auth/check-email', { email: guestEmail });
        setEmailExists(data.exists);
        if (data.exists) {
          setShowInlineLogin(true);
        } else {
          setShowInlineLogin(false);
        }
      } catch {
        // ignore
      } finally {
        setCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [guestEmail, isAuthenticated]);

  if (items.length === 0 && !orderResult) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Carrito vacío</h1>
        <p className="text-muted-foreground mb-6">Agrega productos antes de hacer checkout</p>
        <a
          href="/productos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium"
        >
          Ver Productos
        </a>
      </div>
    );
  }

  const hasRequiresPrescription = calculation?.items?.some((i: any) => i.requiresPrescription);

  // Handle inline login for user with existing email
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await login(guestEmail, loginPassword);
      if (result?.requiresTwoFactor) {
        setLoginError('Tu cuenta requiere verificación 2FA. Por favor inicia sesión desde la página de login.');
        return;
      }
      await refreshUser();
      setShowInlineLogin(false);
      setEmailExists(false);
      setWantAccount(false);
      setLoginSuccess(true);
      setTimeout(() => setLoginSuccess(false), 4000);
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // If user is authenticated, use normal checkout
      if (isAuthenticated) {
        const shippingAddress = selectedAddressId
          ? savedAddresses.find((a) => a.id === selectedAddressId)
          : newAddress;

        if (!shippingAddress) {
          setError('Selecciona o ingresa una dirección de envío.');
          setLoading(false);
          return;
        }

        const { data } = await apiClient.post('/orders/checkout', {
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          shippingAddress: selectedAddressId
            ? shippingAddress
            : {
                fullName: newAddress.fullName,
                phone: newAddress.phone,
                addressLine1: newAddress.addressLine1,
                addressLine2: newAddress.addressLine2 || undefined,
                city: newAddress.city,
                department: newAddress.department,
                instructions: newAddress.instructions || undefined,
              },
          paymentMethod,
          couponCode: couponApplied ? couponCode : undefined,
          addressId: selectedAddressId || undefined,
          notes: notes || undefined,
        });

        setOrderResult(data);
        clearCart();
        setStep(4);
      } else {
        // Guest checkout flow
        // If user wants to create an account, register them first and auto-login
        if (wantAccount && guestPassword) {
          try {
            const { data: regData } = await apiClient.post('/auth/quick-register', {
              email: guestEmail,
              password: guestPassword,
              firstName: guestFirstName,
              lastName: guestLastName,
              phone: guestPhone || undefined,
            });
            localStorage.setItem('accessToken', regData.accessToken);
            await refreshUser();

            // Now checkout as authenticated user
            const { data } = await apiClient.post('/orders/checkout', {
              items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
              shippingAddress: {
                fullName: newAddress.fullName || `${guestFirstName} ${guestLastName}`,
                phone: newAddress.phone || guestPhone,
                addressLine1: newAddress.addressLine1,
                addressLine2: newAddress.addressLine2 || undefined,
                city: newAddress.city,
                department: newAddress.department,
                instructions: newAddress.instructions || undefined,
              },
              paymentMethod,
              couponCode: couponApplied ? couponCode : undefined,
              notes: notes || undefined,
            });

            setOrderResult(data);
            clearCart();
            setStep(4);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear tu cuenta. Intenta nuevamente.');
            setLoading(false);
            return;
          }
        } else {
          // Guest checkout without account creation
          try {
            const { data } = await apiClient.post('/orders/guest-checkout', {
              email: guestEmail,
              firstName: guestFirstName,
              lastName: guestLastName,
              phone: guestPhone || newAddress.phone,
              items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
              shippingAddress: {
                fullName: newAddress.fullName || `${guestFirstName} ${guestLastName}`,
                phone: newAddress.phone || guestPhone,
                addressLine1: newAddress.addressLine1,
                addressLine2: newAddress.addressLine2 || undefined,
                city: newAddress.city,
                department: newAddress.department,
                instructions: newAddress.instructions || undefined,
              },
              paymentMethod,
              couponCode: couponApplied ? couponCode : undefined,
              notes: notes || undefined,
            });

            setOrderResult(data);
            clearCart();
            setStep(4);
          } catch (err: any) {
            const msg = err.response?.data?.message || '';
            if (msg.includes('ya tiene una cuenta')) {
              setEmailExists(true);
              setShowInlineLogin(true);
              setStep(1);
              setError('Este correo ya está registrado. Inicia sesión para continuar.');
            } else {
              setError(msg || 'Error al procesar tu pedido. Intenta de nuevo.');
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar tu pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponApplied(false);

    try {
      // Validate coupon by recalculating cart with coupon
      const { data } = await apiClient.post('/cart/calculate', {
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: couponCode.toUpperCase(),
      });

      if (data.discount > 0) {
        setCouponApplied(true);
      } else {
        setCouponError('Cupón no válido o no aplicable a tu pedido.');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Cupón no válido.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Determine if step 1 form is complete
  const effectivelyAuthenticated = isAuthenticated;
  const guestInfoComplete = effectivelyAuthenticated || (guestEmail && guestFirstName && guestLastName && !emailExists);
  const addressComplete =
    selectedAddressId ||
    (newAddress.fullName && newAddress.phone && newAddress.addressLine1 && newAddress.city);
  const canProceedStep1 = guestInfoComplete && addressComplete;

  const updateAddr = (field: string, value: string) =>
    setNewAddress((a) => ({ ...a, [field]: value }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.step
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.step ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  step >= s.step ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                  step > s.step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Login success toast */}
      {loginSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">¡Sesión iniciada correctamente!</p>
              <p className="text-xs text-green-700 mt-0.5">Puedes continuar con tu pedido.</p>
            </div>
          </div>
          <button onClick={() => setLoginSuccess(false)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Customer Info + Address */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Guest info section (only show if not authenticated) */}
          {!isAuthenticated && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Tus Datos</h2>
                <Link
                  href="/login?redirect=/checkout"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <LogIn className="w-4 h-4" />
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={guestLastName}
                    onChange={(e) => setGuestLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Correo electrónico *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      emailExists ? 'border-amber-400' : 'border-border'
                    }`}
                    placeholder="tu@email.com"
                    required
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Email exists warning */}
                {emailExists && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">
                          Este correo ya tiene una cuenta registrada
                        </p>
                        <p className="text-amber-700 mt-1">
                          Inicia sesión para continuar con tu pedido o usa otro correo.
                        </p>
                        {!showInlineLogin && (
                          <button
                            onClick={() => setShowInlineLogin(true)}
                            className="mt-2 text-primary font-medium hover:underline"
                          >
                            Iniciar sesión aquí
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline login form */}
                    {showInlineLogin && (
                      <form onSubmit={handleInlineLogin} className="mt-3 space-y-2">
                        <div className="relative">
                          <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Tu contraseña"
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        {loginError && (
                          <p className="text-xs text-destructive">{loginError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={loginLoading || !loginPassword}
                            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50"
                          >
                            {loginLoading ? 'Ingresando...' : 'Ingresar'}
                          </button>
                          <Link
                            href="/olvidar-contrasena"
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            ¿Olvidaste tu contraseña?
                          </Link>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+502 0000-0000"
                />
              </div>

              {/* Create account option - only show if email doesn't already exist */}
              {!emailExists && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantAccount}
                      onChange={(e) => setWantAccount(e.target.checked)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div>
                      <span className="text-sm font-medium">Crear mi cuenta</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Guarda tus datos para futuras compras y dale seguimiento a tus pedidos
                      </p>
                    </div>
                  </label>

                  {wantAccount && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">Contraseña</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Mínimo 8 caracteres"
                          minLength={8}
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
                  )}
                </div>
              )}

              <hr className="border-border" />
            </div>
          )}

          {/* Address section */}
          <h2 className="text-xl font-bold">Dirección de Envío</h2>

          {effectivelyAuthenticated && savedAddresses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Direcciones guardadas</h3>
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedAddressId === addr.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">{addr.fullName}</p>
                  <p className="text-sm text-muted-foreground">{addr.addressLine1}</p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.department}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                </button>
              ))}
              <button
                onClick={() => setSelectedAddressId(null)}
                className={`text-sm ${!selectedAddressId ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                + Usar nueva dirección
              </button>
            </div>
          )}

          {(!effectivelyAuthenticated || !selectedAddressId) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={newAddress.fullName}
                  onChange={(e) => updateAddr('fullName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={effectivelyAuthenticated ? '' : `${guestFirstName} ${guestLastName}`.trim() || 'Nombre completo'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => updateAddr('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => updateAddr('city', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  value={newAddress.addressLine1}
                  onChange={(e) => updateAddr('addressLine1', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Calle, zona, número"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Departamento</label>
                <input
                  type="text"
                  value={newAddress.department}
                  onChange={(e) => updateAddr('department', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instrucciones (opcional)</label>
                <input
                  type="text"
                  value={newAddress.instructions || ''}
                  onChange={(e) => updateAddr('instructions', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Referencia, color de casa..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => {
                // Auto-fill address name/phone from guest info if empty
                if (!effectivelyAuthenticated && !newAddress.fullName) {
                  setNewAddress((a) => ({
                    ...a,
                    fullName: `${guestFirstName} ${guestLastName}`.trim(),
                    phone: a.phone || guestPhone,
                  }));
                }
                setStep(2);
              }}
              disabled={!canProceedStep1}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Método de Pago</h2>

          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">💵 Pago contra entrega</p>
              <p className="text-sm text-muted-foreground mt-1">
                Paga en efectivo cuando recibas tu pedido
              </p>
            </button>

            <button
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">🏦 Transferencia bancaria</p>
              <p className="text-sm text-muted-foreground mt-1">
                Realiza una transferencia y sube el comprobante
              </p>
            </button>

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-1">
                <p className="font-medium">Datos bancarios:</p>
                <p>Banco: {BANK_INFO.bank}</p>
                <p>Cuenta: {BANK_INFO.account}</p>
                <p>A nombre de: {BANK_INFO.name}</p>
                <p>NIT: {BANK_INFO.nit}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Resumen del Pedido</h2>

          {/* Items */}
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {calculation?.items.map((item: any) => (
              <div key={item.variantId} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 bg-muted/30 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      Sin img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponApplied(false);
                  setCouponError('');
                }}
                placeholder="Código de cupón"
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2.5 bg-muted text-sm font-medium rounded-lg hover:bg-muted/80 disabled:opacity-50"
              >
                {couponLoading ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
            {couponApplied && (
              <p className="text-sm text-green-600">✓ Cupón aplicado correctamente</p>
            )}
            {couponError && (
              <p className="text-sm text-destructive">{couponError}</p>
            )}
          </div>

          {/* Prescription warning */}
          {hasRequiresPrescription && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm flex items-start gap-3">
              <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Receta médica requerida</p>
                <p className="text-amber-700 mt-1">
                  Algunos productos requieren receta médica. Podrás subirla después de confirmar el pedido.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Instrucciones especiales para tu pedido..."
            />
          </div>

          {/* Totals */}
          {calculation && (
            <div className="bg-white rounded-xl border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(calculation.subtotal)}</span>
              </div>
              {calculation.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (12%)</span>
                  <span>{formatPrice(calculation.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{calculation.shippingCost === 0 ? 'Gratis' : formatPrice(calculation.shippingCost)}</span>
              </div>
              {calculation.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(calculation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatPrice(calculation.total)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && orderResult && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">¡Pedido confirmado!</h2>
            <p className="text-muted-foreground mt-2">
              Tu número de pedido es{' '}
              <span className="font-mono font-bold text-foreground">
                {orderResult.orderNumber}
              </span>
            </p>
          </div>

          {wantAccount && !isAuthenticated && (
            <div className="max-w-sm mx-auto p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <p className="font-medium">¡Tu cuenta fue creada!</p>
              <p className="mt-1">Puedes iniciar sesión con tu correo y contraseña para ver tus pedidos.</p>
            </div>
          )}

          {orderResult.paymentMethod === 'BANK_TRANSFER' && (
            <div className="max-w-sm mx-auto text-left bg-white rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-semibold">Datos para transferencia:</h3>
              <div className="text-sm space-y-1">
                <p>Banco: {BANK_INFO.bank}</p>
                <p>Cuenta: {BANK_INFO.account}</p>
                <p>A nombre de: {BANK_INFO.name}</p>
                <p>NIT: {BANK_INFO.nit}</p>
                <p className="font-medium pt-2">
                  Total a transferir:{' '}
                  <span className="text-primary">{formatPrice(orderResult.total)}</span>
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  Referencia: {orderResult.orderNumber}
                </p>
              </div>
            </div>
          )}

          {orderResult.paymentMethod === 'CASH_ON_DELIVERY' && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Prepara el monto exacto de{' '}
              <span className="font-bold text-foreground">
                {formatPrice(orderResult.total)}
              </span>{' '}
              para cuando llegue tu pedido.
            </p>
          )}

          <div className="flex justify-center gap-4 pt-4">
            {isAuthenticated && (
              <a
                href={`/mi-cuenta/pedidos/${orderResult.orderId}`}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
              >
                Ver Mi Pedido
              </a>
            )}
            <a
              href="/productos"
              className="px-6 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted"
            >
              Seguir Comprando
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
