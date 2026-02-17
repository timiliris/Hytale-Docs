"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Calendar } from "lucide-react";

export function UpdatesSection() {
  const t = useTranslations("updates");
  const locale = useLocale();

  const updates = [
    {
      title: t("update3"),
      description: t("update3Desc"),
      href: "/docs/servers/update-3",
      date: "2026-02-17",
      badge: "v3",
      badgeColor: "#e6a33e",
    },
    {
      title: t("serverInternals"),
      description: t("serverInternalsDesc"),
      href: "/docs/api/server-internals",
      date: "2026-01-13",
      badge: "v1",
      badgeColor: "#e6a33e",
    },
    {
      title: t("serverCalculator"),
      description: t("serverCalculatorDesc"),
      href: "/tools/server-calculator",
      date: "2026-01-11",
      badge: t("new"),
      badgeColor: "#4a9e6e",
    },
    {
      title: t("projectGenerator"),
      description: t("projectGeneratorDesc"),
      href: "/tools/project-generator",
      date: "2026-01-10",
      badge: t("new"),
      badgeColor: "#4a9e6e",
    },
    {
      title: t("jsonValidator"),
      description: t("jsonValidatorDesc"),
      href: "/tools/json-validator",
      date: "2026-01-09",
      badge: t("new"),
      badgeColor: "#4a9e6e",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gradient hytale-title">
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {updates.map((update) => (
            <Link key={update.title} href={update.href} className="group block">
              <div className="flex items-center gap-4 p-5 rounded-lg border-2 border-border bg-muted/30 transition-all duration-300 hover:border-primary/50 hover:bg-muted/50">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {update.title}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                      style={{
                        backgroundColor: `${update.badgeColor}20`,
                        color: update.badgeColor,
                      }}
                    >
                      {update.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {update.description}
                  </p>
                </div>

                {/* Date & Arrow */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(update.date).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
