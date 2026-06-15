import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AuraBank',
    short_name: 'AuraBank',
    description: 'Secure digital banking — part of the Aura Finance suite',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#D91E78',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
