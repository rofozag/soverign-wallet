/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress known Supabase SSR fetch warning in dev
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig
