import type { NextConfig } from "next";

function getSupabaseImageHostnames() {
  const defaultHostnames = ["**.supabase.co"];
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!configuredUrl) {
    return defaultHostnames;
  }

  try {
    const normalizedUrl = configuredUrl.replace(/\/(auth|rest)\/v1\/?$/i, "").replace(/\/$/, "");
    const hostname = new URL(normalizedUrl).hostname;

    if (!hostname) {
      return defaultHostnames;
    }

    return Array.from(new Set([...defaultHostnames, hostname]));
  } catch {
    return defaultHostnames;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      ...getSupabaseImageHostnames().map((hostname) => ({
        protocol: "https" as const,
        hostname
      }))
    ],
    localPatterns: [
      {
        pathname: "/images/**"
      }
    ]
  }
};

export default nextConfig;
