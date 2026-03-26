/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/subadmin/:path*",
        destination: "/sub-admin/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
