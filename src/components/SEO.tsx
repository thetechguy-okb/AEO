import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
}

const DEFAULT_SITE_NAME = 'Athena Election Observatory';
const DEFAULT_BASE_URL = 'https://aeo.athenacentre.org';
const DEFAULT_TITLE = 'Athena Election Observatory (AEO) | Election Integrity, Data & Accountability';
const DEFAULT_DESCRIPTION = 'Independent, non-partisan election data, audits and democratic health insights from the Athena Election Observatory, an initiative of the Athena Centre for Policy and Leadership.';
const DEFAULT_OG_DESCRIPTION = 'Independent, non-partisan election data, audits and democratic health insights from the Athena Election Observatory.';
const DEFAULT_TWITTER_DESCRIPTION = 'Independent election data, audits and democratic health insights from the Athena Election Observatory.';
const DEFAULT_KEYWORDS = 'Athena Election Observatory, AEO, Nigeria elections, election data, election monitoring, electoral integrity, INEC, Nigeria democracy, election results, Athena Centre';
const DEFAULT_OG_IMAGE = 'https://aeo.athenacentre.org/og/aeo-og.jpg';
const DEFAULT_TWITTER_SITE = '@Athena_centre';

function updateMetaTag(attributeName: 'name' | 'property', attributeValue: string, contentValue: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', contentValue);
}

function updateLinkTag(rel: string, hrefValue: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', hrefValue);
}

export default function SEO({
  title,
  description,
  keywords,
  canonicalPath,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  noIndex = false
}: SEOProps) {
  useEffect(() => {
    // 1. Process Title
    let pageTitle = DEFAULT_TITLE;
    if (title) {
      if (title.includes('Athena Election Observatory') || title.includes('AEO')) {
        pageTitle = title;
      } else {
        pageTitle = `${title} | ${DEFAULT_SITE_NAME}`;
      }
    }
    document.title = pageTitle;

    // 2. Process Description
    const metaDesc = description || DEFAULT_DESCRIPTION;
    const ogDesc = description || DEFAULT_OG_DESCRIPTION;
    const twitterDesc = description || DEFAULT_TWITTER_DESCRIPTION;

    updateMetaTag('name', 'description', metaDesc);
    updateMetaTag('name', 'keywords', keywords || DEFAULT_KEYWORDS);
    updateMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Process Canonical URL
    let path = canonicalPath || window.location.pathname;
    if (!path.startsWith('/')) path = `/${path}`;
    // Format URL
    let canonicalUrl = `${DEFAULT_BASE_URL}${path}`;
    if (path === '/') {
      canonicalUrl = `${DEFAULT_BASE_URL}/`;
    } else if (canonicalUrl.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
    }
    updateLinkTag('canonical', canonicalUrl);

    // 4. Process Open Graph
    let resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
    if (resolvedOgImage && !resolvedOgImage.startsWith('http://') && !resolvedOgImage.startsWith('https://')) {
      if (!resolvedOgImage.startsWith('/')) resolvedOgImage = `/${resolvedOgImage}`;
      resolvedOgImage = `${DEFAULT_BASE_URL}${resolvedOgImage}`;
    }

    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:site_name', DEFAULT_SITE_NAME);
    updateMetaTag('property', 'og:title', pageTitle);
    updateMetaTag('property', 'og:description', ogDesc);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:image', resolvedOgImage);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', ogImageAlt || 'Athena Election Observatory — Election Integrity, Data and Accountability');

    // 5. Process Twitter Cards
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', pageTitle);
    updateMetaTag('name', 'twitter:description', twitterDesc);
    updateMetaTag('name', 'twitter:image', resolvedOgImage);
    updateMetaTag('name', 'twitter:site', DEFAULT_TWITTER_SITE);
  }, [title, description, keywords, canonicalPath, ogType, ogImage, ogImageAlt, noIndex]);

  return null;
}
