// Type definitions for structured data
type Organization = {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  description?: string;
};

type WebSite = {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
};

type Business = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  category?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(): Organization {
  return {
    '@type': 'Organization',
    name: 'Manfaa',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com',
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com'}/images/logo.png`,
    sameAs: [
      'https://facebook.com/manfaa',
      'https://twitter.com/manfaa',
      'https://linkedin.com/company/manfaa',
      'https://instagram.com/manfaa',
    ],
    description: 'A marketplace for buying and selling businesses in Saudi Arabia',
  };
}

/**
 * Generate WebSite structured data
 */
export function generateWebsiteSchema(): WebSite {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com';
  
  return {
    '@type': 'WebSite',
    name: 'Manfaa - Saudi Business Marketplace',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Product structured data for a business listing
 */
export function generateBusinessSchema(business: Business) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com';
  
  return {
    '@type': 'Product',
    name: business.title,
    description: business.description,
    offers: {
      '@type': 'Offer',
      price: business.price,
      priceCurrency: business.currency || 'SAR',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/businesses/${business.id}`,
    },
    ...(business.image && { image: business.image }),
    ...(business.category && { category: business.category }),
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate full JSON-LD markup for a page
 */
export function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    ...(Array.isArray(data) ? { '@graph': data } : data),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Generate home page JSON-LD
 */
export function HomePageJsonLd() {
  const data = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
  ];
  
  return <JsonLd data={data} />;
}

/**
 * Generate business listing page JSON-LD
 */
export function BusinessPageJsonLd({ business, breadcrumbs }: { business: Business; breadcrumbs: BreadcrumbItem[] }) {
  const data = [
    generateOrganizationSchema(),
    generateBusinessSchema(business),
    generateBreadcrumbSchema(breadcrumbs),
  ];
  
  return <JsonLd data={data} />;
} 