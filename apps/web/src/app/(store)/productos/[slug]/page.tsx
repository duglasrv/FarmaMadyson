import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmamadyson.com';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const price = product.variants?.[0]?.price;
  const image = product.images?.[0];

  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ||
      `Compra ${product.name} en Farma Madyson. Envío a Chimaltenango, Guatemala.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || `Compra ${product.name} en Farma Madyson`,
      type: 'website',
      url: `${SITE_URL}/productos/${slug}`,
      ...(image && { images: [{ url: image, alt: product.name }] }),
    },
    alternates: { canonical: `${SITE_URL}/productos/${slug}` },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // JSON-LD structured data
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || '',
        image: product.images?.[0] || '',
        sku: product.variants?.[0]?.sku || '',
        brand: product.brand
          ? { '@type': 'Brand', name: product.brand.name }
          : undefined,
        offers: product.variants?.map((v: { price: number; computedStock?: number; sku: string }) => ({
          '@type': 'Offer',
          price: v.price,
          priceCurrency: 'GTQ',
          availability:
            (v.computedStock ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          sku: v.sku,
        })),
      }
    : null;

  // BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITE_URL}/productos` },
      ...(product?.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category.name,
              item: `${SITE_URL}/categorias/${product.category.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: product?.name || '',
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: product?.name || '',
            },
          ]),
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductDetailClient />
    </>
  );
}
