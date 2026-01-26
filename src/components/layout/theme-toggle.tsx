"use client";

import * as React from "react";
import { Moon, Sun, BookOpen, Monitor, BookMarked } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export function ThemeToggle({
  className,
  mobile,
  label
}: {
  className?: string;
  mobile?: boolean;
  label?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Determine which icon to show based on current theme
  const isReading = theme === "reading" || theme === "reading-dark";
  const isDark = theme === "dark" || theme === "reading-dark";

  const Icon = isReading ? BookOpen : isDark ? Moon : Sun;

  const trigger = (
    <Button
      variant="ghost"
      size={mobile ? "default" : "icon"}
      className={cn(
        mobile
          ? "w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
          : "min-h-11 min-w-11 text-muted-foreground hover:text-primary hover:bg-primary/10",
        className
      )}
      aria-label="Toggle theme"
    >
      <Icon className={cn(mobile ? "h-4 w-4" : "h-5 w-5")} />
      {mobile && <span>{label || "Theme"}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  if (mobile) {
    return (
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
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
    );
  }

  return (
    <Tooltip
      delayDuration={300}
      open={tooltipOpen && !dropdownOpen}
      onOpenChange={setTooltipOpen}
    >
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            {trigger}
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
