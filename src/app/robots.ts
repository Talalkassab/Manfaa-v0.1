import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/auth/callback'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 