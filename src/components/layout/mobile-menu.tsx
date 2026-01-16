"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  Gamepad2,
  Server,
  Code,
  Wrench,
  Github,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSelector } from "./language-selector";

const mainNav = [
  {
    titleKey: "home",
    href: "/",
    icon: Home,
  },
  {
    titleKey: "playerGuide",
    href: "/docs/gameplay/overview",
    icon: Gamepad2,
  },
  {
    titleKey: "modding",
    href: "/docs/modding/overview",
    icon: Code,
  },
  {
    titleKey: "servers",
    href: "/docs/servers/overview",
    icon: Server,
  },
  {
    titleKey: "tools",
    href: "/tools",
    icon: Wrench,
  },
];

export function MobileMenu() {
  const t = useTranslations("nav");
  const mobileNavT = useTranslations("mobileNav");
  const pathname = usePathname();
  const { menuOpen, setMenuOpen } = useMobileNavigation();

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent
        side="right"
        className={cn(
          "w-[280px] sm:w-[320px]",
          "bg-background border-l border-border",
          "p-0"
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="px-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-h.png"
              alt="Hytale"
              className="h-7 w-7 object-contain"
            />
            <SheetTitle className="text-lg font-bold text-left">
              <span className="text-foreground">Hytale</span>
              <span className="text-primary">Docs</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Main Navigation */}
        <nav className="p-4 space-y-1">
          {mainNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const title = item.titleKey === "home" ? mobileNavT("home") : t(item.titleKey);

            return (
              <Link
                key={item.titleKey}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  "min-h-[44px]", // Touch-friendly
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {title}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-border mx-4" />

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* GitHub */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 min-h-[44px]"
            asChild
          >
            <a
              href="https://github.com/timiliris/Hytale-Docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </Button>

          {/* Theme & Language */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <LanguageSelector />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
