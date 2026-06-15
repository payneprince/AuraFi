import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AuraVest',
    short_name: 'AuraVest',
    description: 'Multi-asset investment platform — part of the Aura Finance suite',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#EF4444',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
