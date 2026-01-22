"use client";

import { useTheme } from "next-themes";
import { BookOpen, BookX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function ReadingModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isReadingMode = theme === "reading" || theme === "reading-dark";

  // Determine the base theme (light or dark) to return to
  const getBaseTheme = () => {
    if (theme === "reading") return "light";
    if (theme === "reading-dark") return "dark";
    // If in light mode, check system preference for dark
    if (theme === "light") return "light";
    if (theme === "dark") return "dark";
    // For system theme, we'll default to dark reading
    return "dark";
  };

  const toggleReadingMode = () => {
    if (isReadingMode) {
      // Exit reading mode - return to base theme
      if (theme === "reading") {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    } else {
      // Enter reading mode - match current light/dark preference
      if (theme === "dark" || theme === "system") {
        setTheme("reading-dark");
      } else {
        setTheme("reading");
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleReadingMode}
            className={`
              fixed bottom-6 left-6 z-50
              h-12 w-12 rounded-full shadow-lg
              transition-all duration-300
              ${isReadingMode
                ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                : "bg-card hover:bg-muted border-border"
              }
            `}
            aria-label={isReadingMode ? "Exit reading mode" : "Enter reading mode"}
          >
            {isReadingMode ? (
              <BookX className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p>{isReadingMode ? "Exit reading mode" : "Reading mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
