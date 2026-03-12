import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Truck, Shield, CreditCard } from 'lucide-react';

const footerLinks = {
  categorias: [
    { label: 'Medicamentos', href: '/categorias/medicamentos' },
    { label: 'Vitaminas y Suplementos', href: '/categorias/vitaminas-suplementos' },
    { label: 'Cuidado Personal', href: '/categorias/cuidado-personal' },
    { label: 'Equipo Médico', href: '/categorias/equipo-medico' },
    { label: 'Bebé y Mamá', href: '/categorias/bebe-mama' },
    { label: 'Ofertas', href: '/ofertas' },
  ],
  informacion: [
    { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { label: 'Políticas de Envío', href: '/politicas-envio' },
    { label: 'Términos y Condiciones', href: '/terminos-condiciones' },
    { label: 'Política de Privacidad', href: '/privacidad' },
    { label: 'Preguntas Frecuentes', href: '/faq' },
  ],
  cuenta: [
    { label: 'Mi Cuenta', href: '/mi-cuenta' },
    { label: 'Mis Pedidos', href: '/mi-cuenta/pedidos' },
    { label: 'Mis Favoritos', href: '/mi-cuenta/favoritos' },
    { label: 'Direcciones', href: '/mi-cuenta/direcciones' },
    { label: 'Subir Receta', href: '/subir-receta' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-foreground text-white/80">
      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Envío a Domicilio</h4>
                <p className="text-xs text-white/60">Gratis en compras mayores a Q200</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Productos Garantizados</h4>
                <p className="text-xs text-white/60">Medicamentos originales y certificados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Pago Seguro</h4>
                <p className="text-xs text-white/60">Transferencia o pago contra entrega</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-white">
              Farma<span className="text-secondary">Madyson</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Tu farmacia de confianza en Chimaltenango, Guatemala. Medicamentos,
              suplementos y productos de salud con entrega a domicilio.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                +502 0000-0000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                farmamadyson@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                Chimaltenango, Guatemala
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                Lun-Sáb: 8:00 – 20:00
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Categorías</h3>
            <ul className="space-y-2.5 text-sm">
              {footerLinks.categorias.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-secondary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Información</h3>
            <ul className="space-y-2.5 text-sm">
              {footerLinks.informacion.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-secondary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mi Cuenta */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Mi Cuenta</h3>
            <ul className="space-y-2.5 text-sm">
              {footerLinks.cuenta.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-secondary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} Farma Madyson. Todos los derechos reservados.</span>
          <span>Hecho con ❤️ en Guatemala</span>
        </div>
      </div>
    </footer>
  );
}
