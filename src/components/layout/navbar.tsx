"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  Gamepad2,
  Server,
  Code,
  Wrench,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSelector } from "./language-selector";
import { cn } from "@/lib/utils";

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const SearchDialog = dynamic(
  () => import("./search-dialog").then((mod) => ({ default: mod.SearchDialog })),
  { ssr: false }
);

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  const mainNav = [
    {
      title: t("playerGuide"),
      href: "/docs/gameplay/overview",
      icon: Gamepad2,
    },
    {
      title: t("modding"),
      href: "/docs/modding/overview",
      icon: Code,
    },
    {
      title: t("servers"),
      href: "/docs/servers/overview",
      icon: Server,
    },
    {
      title: t("tools"),
      href: "/tools",
      icon: Wrench,
    },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <Image
                src="/logo-h.png"
                alt="Hytale"
                width={32}
                height={32}
                className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-110"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-foreground">Hytale</span>
              <span className="text-primary">Docs</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <SearchDialog />

            {/* Discord - 44x44px minimum touch target */}
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-muted"
              asChild
            >
              <a
                href="https://discord.gg/yAjaFBH4Y8"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord server (opens in new tab)"
              >
                <DiscordIcon className="h-5 w-5" />
                <span className="sr-only">Discord</span>
              </a>
            </Button>

            {/* GitHub - 44x44px minimum touch target */}
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-muted"
              asChild
            >
              <a
                href="https://github.com/timiliris/Hytale-Docs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository (opens in new tab)"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
