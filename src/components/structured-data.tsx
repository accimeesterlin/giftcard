export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Seller Gift",
    "alternateName": "SellerGift",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://sellergift.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://sellergift.com"}/icon.png`,
    "description": "The all-in-one platform for businesses to create, manage, and sell digital gift cards globally.",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/sellergift",
      "https://linkedin.com/company/sellergift",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "availableLanguage": ["en"],
      "areaServed": "Worldwide"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Seller Gift",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://sellergift.com",
    "description": "Digital gift card marketplace platform with multi-tenant support",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || "https://sellergift.com"}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Seller Gift",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "14-day free trial, no credit card required"
    },
    "operatingSystem": "Web",
    "description": "Multi-tenant gift card marketplace platform",
    "featureList": [
      "Multi-tenant architecture",
      "Multiple payment gateways",
      "Enterprise security",
      "Team collaboration",
      "Analytics & insights",
      "Global reach"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
    </>
  );
}
