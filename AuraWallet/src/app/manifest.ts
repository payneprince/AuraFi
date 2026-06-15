import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AuraWallet',
    short_name: 'AuraWallet',
    description: 'Fast digital payments — part of the Aura Finance suite',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1E39',
    theme_color: '#22C55E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
