"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Loader2,
  ArrowRight,
  Book,
  Server,
  Code,
  Wrench,
  BookOpen,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SearchResult {
  title: string;
  description: string;
  href: string;
  content: string;
  category: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Getting Started": BookOpen,
  Modding: Code,
  Servers: Server,
  API: Book,
  Tools: Wrench,
  Guides: FileText,
  Community: Users,
};

export function SearchDialog() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&locale=${locale}`
        );
        const data = await response.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation with wrapping
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of results) {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    }
    return groups;
  }, [results]);

  // Calculate flat index for keyboard navigation
  const getFlatIndex = (category: string, indexInCategory: number): number => {
    let flatIndex = 0;
    for (const [cat, items] of Object.entries(groupedResults)) {
      if (cat === category) {
        return flatIndex + indexInCategory;
      }
      flatIndex += items.length;
    }
    return flatIndex;
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-3 h-10 min-w-60 px-4 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-xl transition-all duration-200 hover:shadow-sm group"
      >
        <Search className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
        <span className="flex-1 text-sm text-left">{t("search")}</span>
        <kbd className="hidden md:inline-flex h-6 items-center gap-1 rounded-md bg-primary/10 px-2 font-mono text-[11px] text-primary/80 border border-primary/20">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      {/* Mobile search button - 44x44px minimum touch target */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden flex items-center justify-center min-h-11 min-w-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">{t("search")}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 bg-card border-border overflow-hidden">
          <DialogTitle className="sr-only">{t("search")}</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={t("search")}
              aria-describedby="search-instructions"
              aria-controls="search-results"
              className="flex-1 h-14 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            />
            {isLoading && (
              <>
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" aria-hidden="true" />
                <VisuallyHidden aria-live="polite" aria-atomic="true">
                  {t("loading") || "Loading search results"}
                </VisuallyHidden>
              </>
            )}
            <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-border bg-background px-2 font-mono text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Screen reader instructions */}
          <VisuallyHidden id="search-instructions">
            {t("typeToSearch")}. {t("navigate")} {t("select")}
          </VisuallyHidden>

          {/* Aria-live region for search results */}
          <div
            id="search-results"
            role="region"
            aria-live="polite"
            aria-atomic="false"
          >
            <VisuallyHidden>
              {!isLoading && query && results.length === 0 && (
                <span>{t("noResults")} &quot;{query}&quot;</span>
              )}
              {!isLoading && results.length > 0 && (
                <span>
                  {results.length} {results.length > 1 ? t("results") : t("result")}
                </span>
              )}
            </VisuallyHidden>
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[60vh]">
            {query && !isLoading && results.length === 0 && (
              <div className="px-4 py-12 text-center">
                <FileText className="h-12 w-12 text-border mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {t("noResults")} &quot;{query}&quot;
                </p>
              </div>
            )}

            {!query && !isLoading && (
              <div className="px-4 py-12 text-center">
                <Search className="h-12 w-12 text-border mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {t("typeToSearch")}
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                      ↓
                    </kbd>
                    {t("navigate")}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                      ↵
                    </kbd>
                    {t("select")}
                  </span>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2" role="listbox" aria-label={t("results")}>
                {Object.entries(groupedResults).map(([category, items]) => {
                  const CategoryIcon = categoryIcons[category] || FileText;
                  return (
                    <div key={category}>
                      <div className="px-4 py-2 flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </span>
                      </div>
                      {items.map((result, indexInCategory) => {
                        const flatIndex = getFlatIndex(category, indexInCategory);
                        const isSelected = flatIndex === selectedIndex;
                        return (
                          <button
                            key={result.href}
                            onClick={() => navigateToResult(result)}
                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                            aria-selected={isSelected}
                            role="option"
                            className={cn(
                              "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors",
                              isSelected ? "bg-muted" : "hover:bg-muted/50"
                            )}
                          >
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {result.title}
                                </span>
                              </div>
                              {result.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight
                              className={cn(
                                "h-4 w-4 shrink-0 mt-1 transition-opacity",
                                isSelected
                                  ? "text-primary opacity-100"
                                  : "text-muted-foreground opacity-0"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground/70">
              <span>
                {results.length} {results.length > 1 ? t("results") : t("result")}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                    ↵
                  </kbd>
                  {t("open")}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
