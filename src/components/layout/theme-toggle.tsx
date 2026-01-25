"use client";

import * as React from "react";
import { Moon, Sun, BookOpen, Monitor, BookMarked } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Determine which icon to show based on current theme
  const isReading = theme === "reading" || theme === "reading-dark";
  const isDark = theme === "dark" || theme === "reading-dark";

  return (
    <Tooltip
      delayDuration={300}
      open={tooltipOpen && !dropdownOpen}
      onOpenChange={setTooltipOpen}
    >
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 text-muted-foreground hover:text-primary hover:bg-primary/10"
              aria-label="Toggle theme"
            >
              {/* Show BookOpen for reading modes, Sun for light, Moon for dark */}
              {isReading ? (
                <BookOpen className="h-5 w-5" />
              ) : isDark ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Change theme
        </TooltipContent>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
            <Sun className="h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("reading")} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Reading Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("reading-dark")} className="gap-2">
            <BookMarked className="h-4 w-4" />
            Reading Dark
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
            <Monitor className="h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
}
