/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `standalone` produces a self-contained server for the Docker/Cloud Run path.
  // Firebase App Hosting ignores this and builds its own server — harmless there.
  output: 'standalone',
}

export default nextConfig
