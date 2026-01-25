"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  Gamepad2,
  Server,
  Code,
  Wrench,
  Github,
  Menu,
  Puzzle,
  Calendar,
  Terminal,
  Cpu,
  Box,
  Palette,
  Settings,
  Shield,
  Cloud,
  Container,
  BookOpen,
  Zap,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSelector } from "./language-selector";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./search-dialog";

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


// Menu item component for mega-menu
interface MenuItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const MenuItem = React.forwardRef<HTMLAnchorElement, MenuItemProps>(
  ({ href, icon: Icon, title, description }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className="group flex select-none gap-3 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200 bg-muted/0 hover:bg-muted/80 focus:bg-muted/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/80 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-200">
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none group-hover:text-foreground transition-colors duration-200">{title}</span>
              <span className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                {description}
              </span>
            </div>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
MenuItem.displayName = "MenuItem";

// Featured link component for main CTA in dropdown
interface FeaturedLinkProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const FeaturedLink = ({ href, icon: Icon, title, description, gradient }: FeaturedLinkProps) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={cn(
          "flex h-full w-full select-none flex-col justify-end rounded-lg p-4 no-underline outline-none focus:shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5",
          gradient
        )}
      >
        <Icon className="h-6 w-6 text-white mb-2 transition-transform duration-200 group-hover:scale-110" />
        <div className="mb-1 text-base font-medium text-white">{title}</div>
        <p className="text-xs leading-tight text-white/80">{description}</p>
      </Link>
    </NavigationMenuLink>
  );
};

export function Navbar() {
  const t = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const tMenu = useTranslations("megaMenu");
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  // Modding submenu items
  const moddingItems: MenuItemProps[] = [
    {
      href: "/docs/modding/plugins/overview",
      icon: Puzzle,
      title: tSidebar("plugins"),
      description: tMenu("pluginsDesc"),
    },
    {
      href: "/docs/plugins/events",
      icon: Calendar,
      title: tSidebar("eventsReference"),
      description: tMenu("eventsDesc"),
    },
    {
      href: "/docs/modding/data-assets/overview",
      icon: Box,
      title: tSidebar("dataAssets"),
      description: tMenu("dataAssetsDesc"),
    },
    {
      href: "/docs/modding/art-assets/overview",
      icon: Palette,
      title: tSidebar("artAssets"),
      description: tMenu("artAssetsDesc"),
    },
    {
      href: "/docs/api/server-internals",
      icon: Cpu,
      title: tSidebar("apiReference"),
      description: tMenu("apiDesc"),
    },
    {
      href: "/docs/api/server-internals/ecs",
      icon: Blocks,
      title: tSidebar("ecsSystem"),
      description: tMenu("ecsDesc"),
    },
  ];

  // Servers submenu items
  const serversItems: MenuItemProps[] = [
    {
      href: "/docs/servers/setup/installation",
      icon: BookOpen,
      title: tSidebar("installation"),
      description: tMenu("installationDesc"),
    },
    {
      href: "/docs/servers/setup/configuration",
      icon: Settings,
      title: tSidebar("configuration"),
      description: tMenu("configurationDesc"),
    },
    {
      href: "/docs/servers/administration/commands",
      icon: Terminal,
      title: tSidebar("commands"),
      description: tMenu("commandsDesc"),
    },
    {
      href: "/docs/servers/administration/permissions",
      icon: Shield,
      title: tSidebar("permissions"),
      description: tMenu("permissionsDesc"),
    },
    {
      href: "/docs/servers/hosting/docker",
      icon: Container,
      title: tSidebar("docker"),
      description: tMenu("dockerDesc"),
    },
    {
      href: "/docs/servers/hosting/providers",
      icon: Cloud,
      title: tSidebar("cloudProviders"),
      description: tMenu("cloudProvidersDesc"),
    },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isModdingActive = pathname.startsWith("/docs/modding") || pathname.startsWith("/docs/api") || pathname.startsWith("/docs/plugins");
  const isServersActive = pathname.startsWith("/docs/servers");

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

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-h-11 min-w-11 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent side="left" className="w-75 sm:w-87.5">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center gap-2.5">
                  <Image
                    src="/logo-h.png"
                    alt="Hytale"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                  <span className="text-lg font-bold tracking-tight">
                    <span className="text-foreground">Hytale</span>
                    <span className="text-primary">Docs</span>
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col gap-1 px-2 py-4">
                {mainNav.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SheetClose key={item.title} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="border-t mx-4" />

              {/* Social Links */}
              <div className="flex flex-col gap-1 px-2 py-4">
                <SheetClose asChild>
                  <a
                    href="https://discord.gg/yAjaFBH4Y8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <DiscordIcon className="h-5 w-5" />
                    Discord
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="https://github.com/timiliris/Hytale-Docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <Github className="h-5 w-5" />
                    GitHub
                  </a>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation with Mega Menus */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Player Guide - Simple Link */}
              <NavigationMenuItem>
                <Link
                  href="/docs/gameplay/overview"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    pathname.startsWith("/docs/gameplay")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Gamepad2 className="h-4 w-4" />
                  {t("playerGuide")}
                </Link>
              </NavigationMenuItem>

              {/* Modding - Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "flex items-center gap-2 rounded-lg",
                    isModdingActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Code className="h-4 w-4" />
                  {t("modding")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-150 grid-cols-[180px_1fr]">
                    {/* Featured Section */}
                    <div className="row-span-3">
                      <FeaturedLink
                        href="/docs/modding/overview"
                        icon={Zap}
                        title={tMenu("moddingFeaturedTitle")}
                        description={tMenu("moddingFeaturedDesc")}
                        gradient="bg-gradient-to-b from-purple-500 to-indigo-600"
                      />
                    </div>
                    {/* Menu Items */}
                    <ul className="grid grid-cols-2 gap-1">
                      {moddingItems.map((item) => (
                        <MenuItem key={item.href} {...item} />
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Servers - Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "flex items-center gap-2 rounded-lg",
                    isServersActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Server className="h-4 w-4" />
                  {t("servers")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-150 grid-cols-[180px_1fr]">
                    {/* Featured Section */}
                    <div className="row-span-3">
                      <FeaturedLink
                        href="/docs/servers/overview"
                        icon={Server}
                        title={tMenu("serversFeaturedTitle")}
                        description={tMenu("serversFeaturedDesc")}
                        gradient="bg-gradient-to-b from-orange-500 to-red-600"
                      />
                    </div>
                    {/* Menu Items */}
                    <ul className="grid grid-cols-2 gap-1">
                      {serversItems.map((item) => (
                        <MenuItem key={item.href} {...item} />
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tools - Simple Link */}
              <NavigationMenuItem>
                <Link
                  href="/tools"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    pathname.startsWith("/tools")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  {t("tools")}
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <SearchDialog />

            {/* Discord - 44x44px minimum touch target */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex min-h-11 min-w-11 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                Join our Discord
              </TooltipContent>
            </Tooltip>

            {/* GitHub - 44x44px minimum touch target */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex min-h-11 min-w-11 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                View on GitHub
              </TooltipContent>
            </Tooltip>

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
