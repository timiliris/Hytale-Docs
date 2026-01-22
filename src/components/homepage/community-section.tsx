"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink } from "lucide-react";

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

export function CommunitySection() {
  const t = useTranslations("community");

  const communityLinks = [
    {
      title: "Discord",
      description: t("discordDesc"),
      href: "https://discord.gg/yAjaFBH4Y8",
      icon: DiscordIcon,
      color: "#5865F2",
    },
    {
      title: "GitHub",
      description: t("githubDesc"),
      href: "https://github.com/timiliris/Hytale-Docs",
      icon: Github,
      color: "#e2e8f0",
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gradient hytale-title">
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
          {communityLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative flex flex-col items-center p-8 rounded-lg border-2 border-border bg-muted/30 transition-all duration-300 hover:border-opacity-50 hover:bg-muted/50">
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: `0 0 40px ${link.color}15`,
                  }}
                />

                {/* Icon */}
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${link.color}20` }}
                >
                  <link.icon
                    className="h-8 w-8"
                    style={{ color: link.color }}
                  />
                </div>

                {/* Title */}
                <h3
                  className="mb-2 text-lg font-bold transition-colors"
                  style={{ color: link.color }}
                >
                  {link.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center">
                  {link.description}
                </p>

                {/* External link indicator */}
                <ExternalLink className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">{t("ctaText")}</p>
          <Button
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            asChild
          >
            <a
              href="https://github.com/timiliris/Hytale-Docs"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Github className="h-4 w-4" />
              {t("viewOnGithub")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
