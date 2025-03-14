import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Create a Supabase client for fetching dynamic routes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Fetch approved businesses for dynamic routes
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, updated_at')
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching businesses for sitemap:', error);
    return staticRoutes;
  }

  // Generate business routes
  const businessRoutes = businesses.map((business) => ({
    url: `${baseUrl}/businesses/${business.id}`,
    lastModified: new Date(business.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Combine all routes
  return [...staticRoutes, ...businessRoutes];
} 