import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '身だしなみチェックアプリ',
    short_name: '身だしなみ',
    description: 'お見合い・デート前の身だしなみAI診断',
    start_url: '/',
    display: 'standalone',
    background_color: '#eff6ff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
