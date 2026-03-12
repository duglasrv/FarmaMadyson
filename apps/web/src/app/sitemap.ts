import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmamadyson.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/productos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/buscar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  // Fetch products
  try {
    const productsRes = await fetch(`${API_URL}/products?limit=1000`, { next: { revalidate: 3600 } });
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      const products = productsData.data || productsData || [];
      for (const product of products) {
        staticPages.push({
          url: `${SITE_URL}/productos/${product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {}

  // Fetch categories
  try {
    const categoriesRes = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (categoriesRes.ok) {
      const categories = await categoriesRes.json();
      for (const cat of categories) {
        staticPages.push({
          url: `${SITE_URL}/categorias/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {}

  // Fetch published pages
  try {
    const pagesRes = await fetch(`${API_URL}/pages?published=true`, { next: { revalidate: 3600 } });
    if (pagesRes.ok) {
      const pages = await pagesRes.json();
      for (const page of pages) {
        staticPages.push({
          url: `${SITE_URL}/${page.slug}`,
          lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    }
  } catch {}

  return staticPages;
}
