import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@klickkk/db'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

export default nextConfig
