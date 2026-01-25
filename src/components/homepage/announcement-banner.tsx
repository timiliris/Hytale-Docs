"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Server, X, Puzzle } from "lucide-react";
import { useState, useEffect, useRef } from "react";



/*
   * The initial approach was non-deterministic and caused a hydration error because it had used Math.random
   * to pick between the banner types, ofc react hates when the client does not match the server.
   * I added a bit of modularity so it's easy to add more banner types in future (yeah, frontend remains, but let's just try to keep it clean :D.)
   * Also added a progress bar to indicate the elapsed time for current rotation of a banner type.
   * I pulled the handler for the closing out and used local storage to save the local state of whether it should be visible or not.
*/

const BANNER_ROTATION_INTERVAL = 30 * 1000; // 30 seconds
const BANNER_TYPES = ["serverInternals", "intellijPlugin"] as const;
type BannerType = typeof BANNER_TYPES[number];

const getCurrentBannerType = (): BannerType => {
  const timeSlot = Math.floor(Date.now() / BANNER_ROTATION_INTERVAL);
  return BANNER_TYPES[timeSlot % BANNER_TYPES.length];
};
export function AnnouncementBanner() {
  const t = useTranslations("announcement");

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("banner-hidden") !== "true";
  });

  // Initialize banner type for SSR, then update on client
  const [bannerType, setBannerType] = useState<BannerType>(getCurrentBannerType());
  const [progress, setProgress] = useState(100);
  const lastSwitched = useRef(Date.now());
  useEffect(() => {
    lastSwitched.current = Date.now();
    setProgress(100);
    if (localStorage.getItem("banner-hidden") === "true") {
      setIsVisible(false);
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSwitched.current;
      const percentage = (elapsed / BANNER_ROTATION_INTERVAL) * 100;
      if (elapsed >= BANNER_ROTATION_INTERVAL) {
        setBannerType(prev => prev === "serverInternals" ? "intellijPlugin" : "serverInternals");
        lastSwitched.current = Date.now();
        setProgress(100);
      } else {
        setProgress(100 - percentage);
      }
    }, 100)
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("banner-hidden", "true");
  }


  if (!isVisible) return null;

  const isIntelliJ = bannerType === "intellijPlugin";

  return (
    <div className={`relative overflow-hidden bg-linear-to-r ${isIntelliJ
      ? "from-violet-500/10 via-violet-500/20 to-violet-500/10 border-b border-violet-500/20"
      : "from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/20"
      }`}>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-foreground/10">
        <div
          className={`h-full transition-all duration-100 ease-linear ${isIntelliJ ? "bg-violet-500" : "bg-amber-500"
            }`}
          style={{
            width: `${progress}%`,
            transform: `translateX(-${100 - progress}%)`
          }}
        />
      </div>

      <div className="container px-4">
        {isIntelliJ ? (
          <a
            href="https://github.com/timiliris/hytaledDocs-intelliJ-plugin/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-2.5 text-sm group"
          >
            <span className="flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-violet-500" />
              <span className="font-semibold text-violet-500">{t("intellij.badge")}</span>
              <span className="hidden sm:inline text-foreground">—</span>
              <span className="text-foreground">{t("intellij.title")}</span>
            </span>
            <span className="hidden md:inline text-muted-foreground">
              {t("intellij.subtitle")}
            </span>
            <span className="inline-flex items-center gap-1 text-violet-500 font-medium group-hover:underline">
              {t("intellij.cta")}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ) : (
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
        )}
      </div>
      <button
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
