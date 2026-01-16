"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/contexts/pwa-context";
import { cn } from "@/lib/utils";

export function UpdateNotification() {
  const t = useTranslations("pwa");
  const { updateAvailable, updateServiceWorker, dismissUpdate } = usePWA();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  // Animate in when update becomes available
  React.useEffect(() => {
    if (updateAvailable) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    setIsUpdating(true);
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(dismissUpdate, 300);
  };

  if (!updateAvailable) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[60] max-w-sm",
        "transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-amber-500" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">
                {t("update.title")}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("update.description")}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      {t("update.updating")}
                    </>
                  ) : (
                    t("update.refresh")
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                >
                  {t("update.later")}
                </Button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              aria-label={t("update.dismiss")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
