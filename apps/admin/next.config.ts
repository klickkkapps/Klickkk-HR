import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@klickkk/db'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

export default nextConfig
