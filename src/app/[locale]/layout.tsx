import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentProvider } from "@/contexts/cookie-consent-context";
import { CookieConsent } from "@/components/cookie-consent";
import { CookiePreferencesDialog } from "@/components/cookie-preferences";
import { AdblockDetector } from "@/components/ads";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const BASE_URL = "https://hytale-docs.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        { url: "/logo-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/logo-512.png", type: "image/png", sizes: "512x512" }],
      shortcut: "/logo-512.png",
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
        {/* Google AdSense */}
        <meta name="google-adsense-account" content="ca-pub-4389631952462736" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4389631952462736"
          crossOrigin="anonymous"
        />
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
          storageKey="hytaledocs-theme"
        >
          <NextIntlClientProvider messages={messages}>
            <CookieConsentProvider>
              {children}
              <CookieConsent />
              <CookiePreferencesDialog />
            </CookieConsentProvider>
            <AdblockDetector />
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
