/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `standalone` produces a self-contained server for the Docker/Cloud Run path.
  // Firebase App Hosting ignores this and builds its own server — harmless there.
  output: 'standalone',
  async redirects() {
    return [
      // `/careers` is the public-facing name for the career explorer.
      { source: '/:lang/careers', destination: '/:lang/career-explorer', permanent: false },
    ]
  },
}

export default nextConfig
