import type { NextConfig } from 'next';

// Static frontend for Cloudflare Pages. Authentication, database permissions,
// certificates, and organisation boundaries remain in Supabase.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
