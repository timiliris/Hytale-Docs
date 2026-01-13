import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://hytale-docs.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/private/"],
      },
      {
        // Allow AI crawlers to access LLM-specific endpoints
        userAgent: ["GPTBot", "ChatGPT-User", "Claude-Web", "Anthropic-AI", "Google-Extended"],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/api/llms"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
