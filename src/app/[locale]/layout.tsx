import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentProvider } from "@/contexts/cookie-consent-context";
import { CookieConsent } from "@/components/cookie-consent";
import { CookiePreferencesDialog } from "@/components/cookie-preferences";
import { AdblockDetector, AdScriptLoader } from "@/components/ads";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { ServiceWorkerRegister, UpdateNotification, InstallPrompt, OpenAppPrompt } from "@/components/pwa";
import { PWAProvider } from "@/contexts/pwa-context";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const BASE_URL = "https://hytale-docs.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const descriptions: Record<string, string> = {
    en: "Community documentation for Hytale. Gameplay guides, modding tutorials, server administration and API reference. Everything you need to master Hytale.",
    fr: "Documentation communautaire pour Hytale. Guides de gameplay, tutoriels de modding, administration de serveurs et reference API. Tout ce dont vous avez besoin pour maitriser Hytale.",
  };

  const titles: Record<string, string> = {
    en: "HytaleDocs - Hytale Community Documentation & Wiki",
    fr: "HytaleDocs - Documentation et Wiki Communautaire Hytale",
  };

  const currentUrl = locale === "en" ? BASE_URL : `${BASE_URL}/${locale}`;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: titles[locale] || titles.en,
      template: "%s | HytaleDocs",
    },
    description: descriptions[locale] || descriptions.en,
    keywords: [
      "Hytale",
      "Hytale wiki",
      "Hytale documentation",
      "Hytale modding",
      "Hytale guide",
      "Hytale gameplay",
      "Hytale server",
      "Hytale API",
      "Hytale tutorial",
      "Hytale blocks",
      "Hytale items",
      "Hytale NPCs",
      "Hypixel Studios",
      "Hytale early access",
      "Hytale 2026",
    ],
    authors: [{ name: "HytaleDocs Community" }],
    creator: "HytaleDocs",
    publisher: "HytaleDocs",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        en: BASE_URL,
        fr: `${BASE_URL}/fr`,
        "x-default": BASE_URL,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/logo-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/logo-512.png", type: "image/png", sizes: "512x512" }],
      shortcut: "/favicon.png",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "HytaleDocs",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      type: "website",
      url: currentUrl,
      siteName: "HytaleDocs",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
      images: [
        {
          url: `${BASE_URL}/logo-h.png`,
          width: 512,
          height: 512,
          alt: "HytaleDocs - Hytale Community Documentation",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: [`${BASE_URL}/logo-h.png`],
      creator: "@HytaleDocs",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* PWA Theme Color */}
        <meta name="theme-color" content="#f59e0b" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Preconnect to third-party origins for performance */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://www.googletagservices.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagservices.com" />
        <link rel="preconnect" href="https://adservice.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://adservice.google.com" />
        <link rel="preconnect" href="https://umami.3de-scs.tech" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://umami.3de-scs.tech" />

        {/* Google AdSense - Account verification meta tag only, script loaded lazily */}
        <meta name="google-adsense-account" content="ca-pub-4389631952462736" />
        {/* Umami Analytics */}
        <Script
          defer
          src="https://umami.3de-scs.tech/script.js"
          data-website-id="749f7e31-1125-4e87-bf50-b10dce51adce"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
        {/* Structured Data */}
        <OrganizationJsonLd
          name="HytaleDocs"
          url={BASE_URL}
          logo={`${BASE_URL}/logo-h.png`}
          description="Community documentation for Hytale game"
        />
        <WebSiteJsonLd
          name="HytaleDocs"
          url={BASE_URL}
          description="Community documentation for Hytale. Guides, tutorials, and references."
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          themes={["light", "dark", "reading", "reading-dark", "system"]}
          storageKey="hytaledocs-theme"
        >
          <NextIntlClientProvider messages={messages}>
            <CookieConsentProvider>
              <PWAProvider>
                {children}
                <CookieConsent />
                <CookiePreferencesDialog />
                <UpdateNotification />
                <InstallPrompt />
                <OpenAppPrompt />
              </PWAProvider>
            </CookieConsentProvider>
            <AdblockDetector />
            <AdScriptLoader />
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
