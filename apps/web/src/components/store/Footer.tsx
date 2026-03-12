import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Truck, Shield, CreditCard, ShieldCheck } from 'lucide-react';

const footerLinks = {
  navegacion: [
    { label: 'Todos los Productos', href: '/productos' },
    { label: 'Medicamentos', href: '/categorias/medicamentos' },
    { label: 'Vitaminas y Suplementos', href: '/categorias/vitaminas-suplementos' },
    { label: 'Cuidado Personal', href: '/categorias/cuidado-personal' },
    { label: 'Equipo Médico', href: '/categorias/equipo-medico' },
    { label: 'Bebé y Mamá', href: '/categorias/bebe-mama' },
    { label: 'Ofertas', href: '/ofertas' },
  ],
  servicio: [
    { label: 'Subir Receta Médica', href: '/subir-receta' },
    { label: 'Políticas de Envío', href: '/politicas-envio' },
    { label: 'Preguntas Frecuentes', href: '/faq' },
    { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
  ],
  cuenta: [
    { label: 'Mi Cuenta', href: '/mi-cuenta' },
    { label: 'Mis Pedidos', href: '/mi-cuenta/pedidos' },
    { label: 'Mis Favoritos', href: '/mi-cuenta/favoritos' },
    { label: 'Direcciones', href: '/mi-cuenta/direcciones' },
  ],
  legal: [
    { label: 'Términos y Condiciones', href: '/terminos-condiciones' },
    { label: 'Política de Privacidad', href: '/privacidad' },
  ],
};

export default function Footer() {
  return (
    <footer>
      {/* ═══ Trust bar ═══ */}
      <div className="bg-ink border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Envío a Domicilio</h4>
                <p className="text-xs text-silver mt-0.5">Gratis en compras mayores a Q200</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Productos Garantizados</h4>
                <p className="text-xs text-silver mt-0.5">Medicamentos originales y certificados</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Pago Seguro</h4>
                <p className="text-xs text-silver mt-0.5">Transferencia o pago contra entrega</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Main footer — 5 columns ═══ */}
      <div className="bg-ink">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
            {/* Brand & Contact */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <Link href="/" className="inline-block">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Farma<span className="text-purple-400">Madyson</span>
                </span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-silver max-w-xs">
                Tu farmacia de confianza en Chimaltenango. Medicamentos,
                suplementos y productos de salud con entrega a domicilio.
              </p>
              <p className="mt-3 text-xs text-purple-300 italic font-medium">
                &quot;Donde comienza el bienestar&quot;
              </p>
              <ul className="mt-5 space-y-3 text-sm text-silver">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>+502 0000-0000</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>farmamadyson@gmail.com</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Chimaltenango, Guatemala</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Lun-Sáb: 8:00 – 20:00</span>
                </li>
              </ul>
            </div>

            {/* Navegación */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">
                Navegación
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerLinks.navegacion.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-silver hover:text-purple-300 transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Servicio al Cliente */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">
                Servicio al Cliente
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerLinks.servicio.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-silver hover:text-purple-300 transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mi Cuenta */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">
                Mi Cuenta
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerLinks.cuenta.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-silver hover:text-purple-300 transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Legal sub-section */}
              <h3 className="font-semibold text-white mt-6 mb-3 text-xs uppercase tracking-widest">
                Legal
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerLinks.legal.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-silver hover:text-purple-300 transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ License badge + Copyright ═══ */}
      <div className="bg-ink border-t border-white/5">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs text-silver">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Licencia Sanitaria MSPAS — Productos con registro sanitario
          </span>
          <div className="flex items-center gap-4 text-xs text-silver/50">
            <span>&copy; {new Date().getFullYear()} Farma Madyson</span>
            <span className="hidden sm:inline">·</span>
            <span>Hecho con ❤️ en Guatemala</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
