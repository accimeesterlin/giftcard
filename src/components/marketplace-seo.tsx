"use client";

import { useEffect } from "react";

interface MarketplaceSEOProps {
  companyName: string;
  companySlug: string;
  listingsCount?: number;
  description?: string;
}

export function MarketplaceSEO({ companyName, companySlug, listingsCount = 0, description }: MarketplaceSEOProps) {
  useEffect(() => {
    // Update page title
    document.title = `${companyName} - Digital Gift Cards | Seller Gift`;

    // Update or create meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    const desc = description || `Shop ${listingsCount} digital gift cards from ${companyName}. Instant delivery, secure payment, and great discounts. Buy gift cards online now.`;

    if (metaDescription) {
      metaDescription.setAttribute('content', desc);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }

    // Update Open Graph tags
    updateOrCreateMetaTag('og:title', `${companyName} Gift Cards - Seller Gift`);
    updateOrCreateMetaTag('og:description', desc);
    updateOrCreateMetaTag('og:url', `/marketplace/${companySlug}`);
    updateOrCreateMetaTag('og:type', 'website');

    // Update Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateOrCreateMetaTag('twitter:title', `${companyName} Gift Cards - Seller Gift`, 'name');
    updateOrCreateMetaTag('twitter:description', desc, 'name');

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/marketplace/${companySlug}`;
  }, [companyName, companySlug, listingsCount, description]);

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
