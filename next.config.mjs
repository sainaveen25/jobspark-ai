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
  webpack(config, { isServer }) {
    // The auto-generated Supabase client reads import.meta.env.VITE_*
    // which doesn't exist in Next.js / webpack. Define it so the module
    // resolves at build time (including during static prerendering).
    const { webpack } = await import("next/dist/compiled/webpack/webpack.js")
      .then((m) => m)
      .catch(() => ({ webpack: null }));

    config.plugins.push(
      new (config.plugins.find((p) => p.constructor.name === "DefinePlugin")
        ?.constructor ??
        class {
          apply() {}
        })({
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
          JSON.stringify(SUPABASE_KEY),
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
