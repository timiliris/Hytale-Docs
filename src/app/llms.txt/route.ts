import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";

const BASE_URL = "https://hytale-docs.com";

const CATEGORY_NAMES: Record<string, string> = {
  "getting-started": "Getting Started",
  gameplay: "Gameplay",
  modding: "Modding",
  servers: "Servers",
  api: "API Reference",
  tools: "Tools",
  guides: "Guides",
  community: "Community",
};

function formatCategoryName(category: string): string {
  return CATEGORY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

export async function GET() {
  const slugs = getAllDocSlugs("en");

  let content = `# Hytale Developer Wiki

> The definitive resource for Hytale modding, server administration, and API development.

## About This Documentation

This documentation covers:
- Player guides and gameplay mechanics
- Modding with Java plugins, Data Assets, and Art Assets
- Server setup and administration
- API reference and SDKs
- Development tools (Blockbench, Asset Editor, Creative Mode)

## Documentation Pages

`;

  // Group docs by category
  const categories = new Map<string, Array<{ title: string; url: string; description: string }>>();

  for (const slugArray of slugs) {
    const doc = getDocBySlug(slugArray, "en");
    if (!doc) continue;

    const category = slugArray[0] || "docs";
    const url = `${BASE_URL}/docs/${slugArray.join("/")}`;

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push({
      title: doc.meta.title,
      url,
      description: doc.meta.description || "",
    });
  }

  // Format output
  for (const [category, docs] of categories) {
    content += `### ${formatCategoryName(category)}\n\n`;
    for (const doc of docs) {
      content += `- [${doc.title}](${doc.url})`;
      if (doc.description) {
        content += `: ${doc.description}`;
      }
      content += `\n`;
    }
    content += `\n`;
  }

  content += `## Additional Resources

- Full documentation with content: ${BASE_URL}/llms-full.txt
- JSON API: ${BASE_URL}/api/llms
- Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
