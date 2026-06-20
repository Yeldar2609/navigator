import type { MetadataRoute } from 'next'

// Pre-launch: keep Kim Bolam out of search indexes until the team is ready.
// Flip to `allow: '/'` when public indexing is desired.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
