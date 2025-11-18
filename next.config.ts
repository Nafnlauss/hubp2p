import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint errors during production builds (Railway)
    // Run linting separately with `npm run lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done separately, allow build to continue
    ignoreBuildErrors: false,
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
