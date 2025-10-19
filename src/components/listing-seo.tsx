"use client";

import { useEffect } from "react";

interface ListingSEOProps {
  listing: {
    title: string;
    description: string | null;
    brand: string;
    category: string;
    currency: string;
    discountPercentage: number;
    denominations: number[];
  };
  companyName: string;
  companySlug: string;
  listingId: string;
  averageRating?: number;
  reviewCount?: number;
}

export function ListingSEO({ listing, companyName, companySlug, listingId, averageRating, reviewCount }: ListingSEOProps) {
  useEffect(() => {
    const minPrice = Math.min(...listing.denominations);
    const maxPrice = Math.max(...listing.denominations);

    // Update page title
    document.title = `${listing.title} - ${listing.brand} Gift Card | ${companyName}`;

    // Create description
    const desc = listing.description ||
      `Buy ${listing.brand} ${listing.title} gift card from ${minPrice} to ${maxPrice} ${listing.currency}. ${listing.discountPercentage > 0 ? `Save ${listing.discountPercentage}%!` : ''} Instant digital delivery. Secure payment.`;

    // Update meta description
    updateOrCreateMetaTag('description', desc, 'name');

    // Update Open Graph tags
    updateOrCreateMetaTag('og:title', `${listing.title} - ${listing.brand} Gift Card`);
    updateOrCreateMetaTag('og:description', desc);
    updateOrCreateMetaTag('og:url', `/marketplace/${companySlug}/${listingId}`);
    updateOrCreateMetaTag('og:type', 'product');

    // Product-specific OG tags
    updateOrCreateMetaTag('product:price:amount', minPrice.toString());
    updateOrCreateMetaTag('product:price:currency', listing.currency);

    // Update Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateOrCreateMetaTag('twitter:title', `${listing.title} - ${listing.brand}`, 'name');
    updateOrCreateMetaTag('twitter:description', desc, 'name');

    // Add keywords
    const keywords = `${listing.brand} gift card, ${listing.category} gift card, buy ${listing.brand} gift card, digital gift card, ${companyName}`;
    updateOrCreateMetaTag('keywords', keywords, 'name');

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/marketplace/${companySlug}/${listingId}`;

    // Add JSON-LD structured data for Product
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title,
      "brand": {
        "@type": "Brand",
        "name": listing.brand
      },
      "description": desc,
      "category": listing.category,
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": minPrice,
        "highPrice": maxPrice,
        "priceCurrency": listing.currency,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": companyName
        }
      },
      ...(averageRating && reviewCount && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": averageRating.toFixed(1),
          "reviewCount": reviewCount,
          "bestRating": "5",
          "worstRating": "1"
        }
      })
    };

    // Remove existing schema if any
    const existingSchema = document.querySelector('script[type="application/ld+json"]#product-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add new schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-schema';
    script.textContent = JSON.stringify(productSchema);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const schemaToRemove = document.querySelector('script[type="application/ld+json"]#product-schema');
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, [listing, companyName, companySlug, listingId, averageRating, reviewCount]);

  return null;
}

function updateOrCreateMetaTag(property: string, content: string, attribute: 'property' | 'name' = 'property') {
  let meta = document.querySelector(`meta[${attribute}="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, property);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}
