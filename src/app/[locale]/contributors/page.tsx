"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Github, Heart, GitPullRequest, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export default function ContributorsPage() {
  const t = useTranslations("contributors");
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributors() {
      try {
        const response = await fetch(
          "https://api.github.com/repos/timiliris/Hytale-Docs/contributors?per_page=100",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setContributors(data.filter((c: Contributor) => c.type === "User"));
        }
      } catch (error) {
        console.error("Error fetching contributors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContributors();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {loading ? "..." : contributors.length}
          </div>
          <div className="text-sm text-muted-foreground">{t("stats.contributors")}</div>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {loading ? "..." : contributors.reduce((sum, c) => sum + c.contributions, 0)}
          </div>
          <div className="text-sm text-muted-foreground">{t("stats.contributions")}</div>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <a
            href="https://github.com/timiliris/Hytale-Docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Github className="w-5 h-5" />
            <span className="font-medium">{t("stats.viewRepo")}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Contributors Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      ) : contributors.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {contributors.map((contributor) => (
            <a
              key={contributor.login}
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border rounded-xl p-4 text-center hover:border-primary/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="relative w-16 h-16 mx-auto mb-3">
                <Image
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  fill
                  sizes="64px"
                  className="rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all"
                />
              </div>
              <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {contributor.login}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                <GitPullRequest className="w-3 h-3" />
                <span>
                  {contributor.contributions} {contributor.contributions === 1 ? "commit" : "commits"}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t("noContributors")}
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-16 text-center bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
        <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          {t("cta.description")}
        </p>
        <a
          href="https://github.com/timiliris/Hytale-Docs/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Github className="w-5 h-5" />
          {t("cta.button")}
        </a>
      </div>
    </>
  );
}
