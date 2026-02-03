import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrismPlus from "rehype-prism-plus";
import { getTranslations } from "next-intl/server";
import { getDocBySlug, getAllDocSlugs, getDocNavigation } from "@/lib/docs";
import { createLocalizedMdxComponents } from "@/components/mdx";
import { remarkAdmonitions } from "@/lib/remark-admonitions";
import { ArticleAd } from "@/components/ads";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { DocsBreadcrumb, TableOfContents, extractHeadings, BackToTop, TocProvider } from "@/components/layout";
import { findBreadcrumbPath, getVerificationStatus } from "@/config/sidebar";
import { UnverifiedContentModal } from "@/components/unverified-content-modal";

const BASE_URL = "https://hytale-docs.com";

interface DocPageProps {
  params: Promise<{ slug?: string[]; locale: string }>;
}

export async function generateStaticParams() {
  const locales = ["fr", "en"];
  const params: { locale: string; slug: string[] }[] = [];

  for (const locale of locales) {
    const slugs = getAllDocSlugs(locale);
    params.push({ locale, slug: [] }); // /docs
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const doc = getDocBySlug(slug || ["intro"], locale);

  if (!doc) {
    return {
      title: "Not Found",
    };
  }

  const slugPath = (slug || ["intro"]).join("/");
  const currentUrl = locale !== "en"
    ? `${BASE_URL}/${locale}/docs/${slugPath}`
    : `${BASE_URL}/docs/${slugPath}`;

  return {
    title: doc.meta.title,
    description: doc.meta.description,
    alternates: {
      canonical: currentUrl,
      languages: {
        en: `${BASE_URL}/docs/${slugPath}`,
        fr: `${BASE_URL}/fr/docs/${slugPath}`,
        "x-default": `${BASE_URL}/docs/${slugPath}`,
      },
    },
    openGraph: {
      title: doc.meta.title,
      description: doc.meta.description,
      type: "article",
      url: currentUrl,
    },
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug, locale } = await params;
  const actualSlug = slug || ["intro"];
  const doc = getDocBySlug(actualSlug, locale);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getDocNavigation(actualSlug, locale);
  const t = await getTranslations({ locale, namespace: "docs" });

  // Build breadcrumb items for JSON-LD
  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Docs", url: `${BASE_URL}/docs` },
    ...actualSlug.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      url: `${BASE_URL}/docs/${actualSlug.slice(0, index + 1).join("/")}`,
    })),
  ];

  // Build breadcrumb items from sidebar structure
  const sidebarT = await getTranslations({ locale, namespace: "sidebar" });
  const currentHref = `/docs/${actualSlug.join("/")}`;
  const sidebarPath = findBreadcrumbPath(currentHref);

  // Get verification status for the current page
  const verificationStatus = getVerificationStatus(currentHref);

  const visualBreadcrumbItems = sidebarPath.map((item, index) => ({
    label: sidebarT(item.titleKey),
    href: index === sidebarPath.length - 1 ? undefined : item.href,
  }));

  // Extract headings for table of contents
  const tocItems = extractHeadings(doc.content);

  // Create locale-aware MDX components
  const localizedMdxComponents = createLocalizedMdxComponents(locale);

  const articleUrl = locale === "en"
    ? `${BASE_URL}/docs/${actualSlug.join("/")}`
    : `${BASE_URL}/${locale}/docs/${actualSlug.join("/")}`;

  return (
    <UnverifiedContentModal
      pageSlug={currentHref}
      isVerified={verificationStatus.verified}
      isNonFunctional={verificationStatus.nonFunctional}
      isEventPage={verificationStatus.isEventPage}
    >
      <TocProvider items={tocItems}>
        <div className="flex gap-8">
          <article id="main-content" className="flex-1 min-w-0 pb-6 lg:pb-8">
            {/* Structured Data */}
            <BreadcrumbJsonLd items={breadcrumbItems} />
            <ArticleJsonLd
              title={doc.meta.title}
              description={doc.meta.description || ""}
              url={articleUrl}
            />

            {/* Breadcrumb */}
            <div className="mb-8">
              <DocsBreadcrumb items={visualBreadcrumbItems} />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-gradient mb-4">
              {doc.meta.title}
            </h1>

            {doc.meta.description && (
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                {doc.meta.description}
              </p>
            )}

            {/* Separator */}
            <div className="h-px bg-linear-to-r from-primary/50 via-border to-transparent mb-10" />

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MDXRemote
                source={doc.content}
                components={localizedMdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm, remarkAdmonitions],
                    rehypePlugins: [rehypeSlug, [rehypePrismPlus, { ignoreMissing: true }]],
                  },
                }}
              />
            </div>

            {/* Discrete ad after content */}
            <ArticleAd />

            {/* Navigation */}
            <div className="h-px bg-linear-to-r from-transparent via-border to-transparent my-12" />

            <nav className="flex items-stretch gap-4">
              {prev ? (
                <Link
                  href={prev.href}
                  className="flex-1 group p-5 rounded-xl border-2 border-border bg-card/30 transition-all duration-300 hover:border-secondary/50 hover:bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 transition-colors group-hover:bg-secondary/20">
                      <ChevronLeft className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("previous")}</div>
                      <div className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                        {prev.title}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {next ? (
                <Link
                  href={next.href}
                  className="flex-1 group p-5 rounded-xl border-2 border-border bg-card/30 transition-all duration-300 hover:border-primary/50 hover:bg-card/50"
                >
                  <div className="flex items-center justify-end gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("next")}</div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {next.title}
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </nav>
          </article>

          {/* Table of Contents - Right Sidebar */}
          <TableOfContents items={tocItems} />

          {/* Back to Top Button */}
          <BackToTop />
        </div>
      </TocProvider>
    </UnverifiedContentModal>
  );
}
