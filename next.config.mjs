/** @type {import('next').NextConfig} */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "";

const nextConfig = {
  env: {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY,
  },
  webpack(config) {
    // The auto-generated Supabase client uses import.meta.env.VITE_*
    // which doesn't exist in webpack/Next.js. Replace at compile time.
    config.plugins.push(
      new config.webpack.DefinePlugin({
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_KEY),
      })
    );
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
