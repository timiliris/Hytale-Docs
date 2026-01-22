"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Github, Twitter } from "lucide-react";
import { FooterAd } from "@/components/ads";
import { useCookieConsent } from "@/contexts/cookie-consent-context";

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

const socialLinks = [
  { title: "Discord", href: "https://discord.gg/yAjaFBH4Y8", icon: DiscordIcon },
  { title: "Twitter", href: "https://twitter.com/Hytale", icon: Twitter },
  { title: "GitHub", href: "https://github.com/timiliris/Hytale-Docs", icon: Github },
];

export function Footer() {
  const t = useTranslations("footer");
  const { openPreferences } = useCookieConsent();

  const footerLinks = {
    gameplay: [
      { title: t("firstSteps"), href: "/docs/gameplay/getting-started/first-steps" },
      { title: t("combat"), href: "/docs/gameplay/combat/overview" },
      { title: t("regions"), href: "/docs/gameplay/world/regions" },
      { title: t("creatures"), href: "/docs/gameplay/creatures/overview" },
    ],
    development: [
      { title: t("modding"), href: "/docs/modding/overview" },
      { title: t("plugins"), href: "/docs/modding/plugins/overview" },
      { title: t("servers"), href: "/docs/servers/overview" },
      { title: t("api"), href: "/docs/api/overview" },
    ],
    tools: [
      { title: t("serverCalculator"), href: "/tools/server-calculator" },
      { title: t("projectGenerator"), href: "/tools/project-generator" },
      { title: t("jsonValidator"), href: "/tools/json-validator" },
    ],
  };

  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="container px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo-h.png"
                alt="Hytale"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold">
                <span className="text-foreground">Hytale</span>
                <span className="text-primary">Docs</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("description")}
            </p>
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Gameplay */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("gameplay")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.gameplay.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Development */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("development")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.development.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("tools")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.tools.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Discrete ad */}
        <FooterAd />

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {t("copyright")}
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href="/docs/community/contributing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("contribute")}
              </Link>
              <button
                onClick={openPreferences}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("cookieSettings")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
