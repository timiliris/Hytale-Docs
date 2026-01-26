import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Gamepad2, Code, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-background" />

        {/* Subtle glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-100 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-150 h-75 bg-secondary/5 rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px),
                              linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Early Access Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-muted-foreground">{t("earlyAccess")}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-foreground font-medium">{t("sinceDate")}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Hytale</span>
            <span className="text-primary">Docs</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
            {t("subtitle")}
          </p>

          <p className="text-base text-muted-foreground/70 max-w-2xl mx-auto mb-10">
            {t("description")}
            <br className="hidden sm:block" />
            {t("descriptionLine2")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 px-8 text-base rounded-lg"
              asChild
            >
              <Link href="/docs/gameplay/overview">
                <Gamepad2 className="h-5 w-5" />
                {t("playerGuideBtn")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 border-border hover:border-muted group relative overflow-hidden h-12 px-8 text-base rounded-lg !transition-colors !duration-200 !ease-out"
              asChild
            >
              <Link href="/docs/modding/overview" className="flex items-center gap-2 relative">
                <span className="inline-block transition-colors group-hover:text-primary">
                  {t("moddingDocsBtn")}
                </span>
                <ArrowRight className="h-5 w-5 translate-x-0 transition-all! duration-300! ease-in-out! group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link
              href="/docs/gameplay/overview"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:border-muted hover:bg-card !transition-colors !duration-200 !ease-out"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Gamepad2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {t("gameplay")}
                </p>
                <p className="text-sm text-muted-foreground">{t("gameplayDesc")}</p>
              </div>
            </Link>

            <Link
              href="/docs/modding/overview"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:border-muted hover:bg-card !transition-colors !duration-200 !ease-out"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Modding
                </p>
                <p className="text-sm text-muted-foreground">{t("moddingDesc")}</p>
              </div>
            </Link>

            <Link
              href="/docs/servers/overview"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:border-muted hover:bg-card !transition-colors !duration-200 !ease-out"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Server className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Servers
                </p>
                <p className="text-sm text-muted-foreground">{t("serversDesc")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent" />
    </section>
  );
}
