"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Home, BookOpen, List, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
import { Link } from "@/i18n/routing";

interface NavItem {
  id: "home" | "docs" | "toc" | "menu";
  labelKey: string;
  icon: React.ElementType;
  action: "link" | "sidebar" | "toc" | "menu";
  href?: string;
  showOnlyOnDocs?: boolean;
  hideOnDocs?: boolean;
}

const navItems: NavItem[] = [
  {
    id: "home",
    labelKey: "home",
    icon: Home,
    action: "link",
    href: "/",
  },
  {
    id: "docs",
    labelKey: "docs",
    icon: BookOpen,
    action: "sidebar",
  },
  {
    id: "toc",
    labelKey: "toc",
    icon: List,
    action: "toc",
    showOnlyOnDocs: true,
  },
  {
    id: "menu",
    labelKey: "menu",
    icon: Menu,
    action: "menu",
  },
];

export function BottomNavigation() {
  const t = useTranslations("mobileNav");
  const pathname = usePathname();
  const { openSidebar, openToc, openMenu, tocItems } = useMobileNavigation();

  const isDocsPage = pathname.startsWith("/docs");

  // Filter items based on current page
  const visibleItems = navItems.filter((item) => {
    if (item.showOnlyOnDocs && !isDocsPage) return false;
    if (item.hideOnDocs && isDocsPage) return false;
    // Hide TOC if no items
    if (item.id === "toc" && tocItems.length === 0) return false;
    return true;
  });

  const handleClick = (item: NavItem) => {
    switch (item.action) {
      case "sidebar":
        openSidebar();
        break;
      case "toc":
        openToc();
        break;
      case "menu":
        openMenu();
        break;
    }
  };

  return (
    <nav
      role="navigation"
      aria-label={t("navigation")}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "lg:hidden", // Hide on desktop
        "bg-background/95 backdrop-blur-md",
        "border-t border-border",
        "safe-area-bottom"
      )}
    >
      <div className="flex items-center justify-around h-14">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.action === "link" && item.href
              ? pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              : false;

          if (item.action === "link" && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "min-w-[64px] min-h-[44px]",
                  "px-3 py-1.5 gap-0.5",
                  "transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-[64px] min-h-[44px]",
                "px-3 py-1.5 gap-0.5",
                "transition-colors duration-200",
                "text-muted-foreground active:text-primary"
              )}
              aria-label={t(item.labelKey)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
