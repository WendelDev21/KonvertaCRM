/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Corrigido: outputFileTracingExcludes está na raiz agora
  outputFileTracingExcludes: {
    '/api/debug/**': ['**/node_modules/**'],
    '/api/debug-token/**': ['**/node_modules/**']
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

export default nextConfig
