import { NextRequest, NextResponse } from "next/server";
import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";

const BASE_URL = "https://hytale-docs.com";

interface DocListItem {
  slug: string;
  url: string;
  title: string;
  description: string | null;
  category: string;
  path: string[];
}

interface DocDetail extends DocListItem {
  content: string;
}

interface ListResponse {
  total: number;
  baseUrl: string;
  docs: DocListItem[];
}

interface DetailResponse {
  doc: DocDetail | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");
  const category = searchParams.get("category");
  const includeContent = searchParams.get("content") === "true";

  // If specific slug requested, return that document
  if (slug) {
    return getDocumentBySlug(slug, includeContent);
  }

  // Otherwise, return list of all documents
  return getDocumentList(category);
}

function getDocumentList(categoryFilter?: string | null): NextResponse<ListResponse> {
  const slugs = getAllDocSlugs("en");

  const docs: DocListItem[] = [];

  for (const slugArray of slugs) {
    const doc = getDocBySlug(slugArray, "en");
    if (!doc) continue;

    const category = slugArray[0] || "docs";

    // Filter by category if specified
    if (categoryFilter && category !== categoryFilter) continue;

    docs.push({
      slug: slugArray.join("/"),
      url: `${BASE_URL}/docs/${slugArray.join("/")}`,
      title: doc.meta.title,
      description: doc.meta.description || null,
      category,
      path: slugArray,
    });
  }

  return NextResponse.json(
    {
      total: docs.length,
      baseUrl: BASE_URL,
      docs,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}

function getDocumentBySlug(
  slugParam: string,
  includeContent: boolean
): NextResponse<DetailResponse> {
  const slugArray = slugParam.split("/");
  const doc = getDocBySlug(slugArray, "en");

  if (!doc) {
    return NextResponse.json({ doc: null, error: "Document not found" }, { status: 404 });
  }

  const response: DocDetail = {
    slug: slugArray.join("/"),
    url: `${BASE_URL}/docs/${slugArray.join("/")}`,
    title: doc.meta.title,
    description: doc.meta.description || null,
    category: slugArray[0] || "docs",
    path: slugArray,
    content: includeContent ? doc.content : "",
  };

  return NextResponse.json(
    { doc: response },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
