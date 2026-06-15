import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aura Finance',
    short_name: 'AuraFinance',
    description: 'Your complete financial ecosystem — bank, invest, pay',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#7C3AED',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
