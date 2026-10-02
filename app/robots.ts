import type { MetadataRoute } from 'next'

// Allow crawlers to read the noindex directive on every response.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } }
}
