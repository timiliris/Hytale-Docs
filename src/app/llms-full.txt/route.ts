import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";

const BASE_URL = "https://hytale-docs.com";

export async function GET() {
  const slugs = getAllDocSlugs("en");

  let content = `# Hytale Developer Wiki - Complete Documentation

Generated: ${new Date().toISOString()}
Total Documents: ${slugs.length}
Base URL: ${BASE_URL}

---

`;

  for (const slugArray of slugs) {
    const doc = getDocBySlug(slugArray, "en");
    if (!doc) continue;

    const url = `${BASE_URL}/docs/${slugArray.join("/")}`;

    content += `## ${doc.meta.title}

**URL:** ${url}
**Path:** /docs/${slugArray.join("/")}
${doc.meta.description ? `**Description:** ${doc.meta.description}` : ""}

${doc.content}

---

`;
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
