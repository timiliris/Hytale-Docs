import { MetadataRoute } from "next";
import { getAllDocSlugs } from "@/lib/docs";

const BASE_URL = "https://hytale-docs.com";
const locales = ["en", "fr"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
    alternates: {
      languages: {
        en: BASE_URL,
        fr: `${BASE_URL}/fr`,
      },
    },
  });

  // Static pages
  const staticPages = [
    { path: "/tools", priority: 0.8 },
    { path: "/tools/server-calculator", priority: 0.7 },
    { path: "/tools/project-generator", priority: 0.7 },
    { path: "/tools/json-validator", priority: 0.7 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: page.priority,
      alternates: {
        languages: {
          en: `${BASE_URL}${page.path}`,
          fr: `${BASE_URL}/fr${page.path}`,
        },
      },
    });
  }

  // High-priority documentation pages
  const highPriorityDocs = [
    { path: "/docs/servers/update-3", priority: 0.9 },
  ];

  for (const doc of highPriorityDocs) {
    entries.push({
      url: `${BASE_URL}${doc.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: doc.priority,
      alternates: {
        languages: {
          en: `${BASE_URL}${doc.path}`,
          fr: `${BASE_URL}/fr${doc.path}`,
        },
      },
    });
  }

  // Documentation pages
  for (const locale of locales) {
    const slugs = getAllDocSlugs(locale);

    for (const slugArray of slugs) {
      const slug = slugArray.join("/");
      const path = `/docs/${slug}`;

      entries.push({
        url: locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${BASE_URL}${path}`,
            fr: `${BASE_URL}/fr${path}`,
          },
        },
      });
    }
  }

  // Remove duplicates based on URL
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
