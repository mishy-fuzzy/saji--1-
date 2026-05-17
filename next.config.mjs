import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Normalize R2 hostname for Next Image remotePatterns.
// Accepts `R2_PUBLIC_HOSTNAME` as either a full URL (https://...) or a hostname.
const rawR2Host = process.env.R2_PUBLIC_HOSTNAME || `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
let r2Hostname = rawR2Host
try {
  if (typeof rawR2Host === 'string') {
    if (rawR2Host.startsWith('http://') || rawR2Host.startsWith('https://')) {
      // Replace {bucket} placeholder if present before parsing
      const resolved = rawR2Host.replace('{bucket}', process.env.R2_BUCKET || process.env.R2_ACCOUNT_ID || '')
      r2Hostname = new URL(resolved).hostname
    } else if (rawR2Host.includes('{bucket}')) {
      r2Hostname = rawR2Host.replace('{bucket}', process.env.R2_BUCKET || process.env.R2_ACCOUNT_ID || '')
    }
  }
} catch (e) {
  r2Hostname = rawR2Host
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js image optimization for remote images hosted on R2.
    // `r2Hostname` will be a plain hostname (no scheme or path).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: r2Hostname,
        pathname: '/:path*',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  // Enable source maps in production builds to get readable stack traces
  productionBrowserSourceMaps: true,
}

export default nextConfig
