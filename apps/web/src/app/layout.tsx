import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Providers from '@/components/Providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: {
    default: 'Farma Madyson — Donde Comienza el Bienestar',
    template: '%s | Farma Madyson',
  },
  description:
    'Tu farmacia de confianza en Chimaltenango, Guatemala. Medicamentos, suplementos, cuidado personal y más con entrega a domicilio.',
  keywords: ['farmacia', 'medicamentos', 'Chimaltenango', 'Guatemala', 'Farma Madyson'],
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Farma Madyson',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://farmamadyson.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://farmamadyson.com'}/logo.png`,
  description:
    'Tu farmacia de confianza en Chimaltenango, Guatemala. Medicamentos, suplementos, cuidado personal y más con entrega a domicilio.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Chimaltenango',
    addressCountry: 'GT',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${jakarta.variable} ${inter.className}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
