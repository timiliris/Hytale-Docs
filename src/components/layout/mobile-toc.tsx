"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
import type { TocItem } from "@/lib/extract-headings";

interface MobileTocProps {
  className?: string;
}

export function MobileToc({ className }: MobileTocProps) {
  const t = useTranslations("tableOfContents");
  const { tocOpen, setTocOpen, tocItems, activeId, setActiveId } = useMobileNavigation();

  // IntersectionObserver for tracking active heading
  React.useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      tocItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [tocItems, setActiveId]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, item: TocItem) => {
    e.preventDefault();
    const element = document.getElementById(item.id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(item.id);
      setTocOpen(false); // Close after selection
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <Sheet open={tocOpen} onOpenChange={setTocOpen}>
      <SheetContent
        side="right"
        className={cn(
          "w-[280px] sm:w-[320px]",
          "bg-background border-l border-border",
          "p-0",
          className
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold text-left">
            {t("title")}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav aria-label={t("navigation")} className="p-4">
            <ul className="space-y-1">
              {tocItems.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleClick(e, item)}
                    className={cn(
                      "block py-2 px-3 rounded-md text-sm",
                      "transition-colors duration-200",
                      "min-h-[44px] flex items-center", // Touch-friendly
                      item.level === 2 && "pl-3",
                      item.level === 3 && "pl-6",
                      item.level === 4 && "pl-9",
                      activeId === item.id
                        ? "text-primary bg-primary/10 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
