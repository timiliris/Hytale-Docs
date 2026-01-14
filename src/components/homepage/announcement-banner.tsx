"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Server, X } from "lucide-react";
import { useState } from "react";

export function AnnouncementBanner() {
  const t = useTranslations("announcement");
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/20">
      <div className="container px-4">
        <Link
          href="/docs/api/server-internals"
          className="flex items-center justify-center gap-3 py-2.5 text-sm group"
        >
          <span className="flex items-center gap-2">
            <Server className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-amber-500">v2</span>
            <span className="hidden sm:inline text-foreground">—</span>
            <span className="text-foreground">{t("title")}</span>
          </span>
          <span className="hidden md:inline text-muted-foreground">
            {t("subtitle")}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-500 font-medium group-hover:underline">
            {t("cta")}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
