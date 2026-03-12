import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const res = await fetch(`${API}/pages/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmamadyson.com';

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `${siteUrl}/pagina/${page.slug}` },
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      type: 'article',
    },
  };
}

export default async function PublicPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
