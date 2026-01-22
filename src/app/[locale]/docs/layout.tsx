import { setRequestLocale } from "next-intl/server";
import { Navbar, Footer, Sidebar, DocsMobileNavigation } from "@/components/layout";
import { DocsDisclaimer } from "@/components/docs-disclaimer";
import { DisclaimerToast } from "@/components/disclaimer-toast";
import { ReadingModeToggle } from "@/components/reading-mode-toggle";

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <DocsMobileNavigation>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <DocsDisclaimer />
        <div className="flex-1 w-full px-2 pb-16 lg:pb-0">
          <div className="flex gap-6 lg:gap-8">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-6">{children}</main>
          </div>
        </div>
        <Footer />
        <DisclaimerToast />
        <ReadingModeToggle />
      </div>
    </DocsMobileNavigation>
  );
}
