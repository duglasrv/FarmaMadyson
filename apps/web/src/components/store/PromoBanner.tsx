'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
}

export default function PromoBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    apiClient
      .get('/banners?active=true')
      .then(({ data }) => setBanners(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Bienvenido a Farma Madyson</h2>
        <p className="text-white/80">Tu farmacia de confianza en Chimaltenango</p>
      </div>
    );
  }

  const banner = banners[current];
  if (!banner) return null;
  const Wrapper = banner.linkUrl ? Link : 'div';
  const wrapperProps = banner.linkUrl ? { href: banner.linkUrl } : {};

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[3/1] min-h-[200px]">
      <Wrapper {...(wrapperProps as any)} className="block w-full h-full">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
          <div className="p-8 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-1">{banner.title}</h2>
            {banner.subtitle && (
              <p className="text-white/80">{banner.subtitle}</p>
            )}
          </div>
        </div>
      </Wrapper>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
