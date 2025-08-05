import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OncoBot - Medical Oncology AI Assistant',
    short_name: 'OncoBot',
    description:
      'AI-powered medical oncology assistant providing evidence-based cancer treatment insights, clinical trial matching, and personalized health information',
    start_url: '/',
    display: 'standalone',
    categories: ['medical', 'health', 'ai', 'oncology'],
    background_color: '#171717',
    icons: [
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32',
        type: 'image/x-icon',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/opengraph-image.png',
        type: 'image/png',
        sizes: '1200x630',
      },
    ],
  };
}
