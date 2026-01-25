"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

const TOAST_STORAGE_KEY = "hytaledocs-toast-last-shown";
const TOAST_INITIAL_DELAY = 30000; // 30 seconds on first visit
const TOAST_INTERVAL = 300000; // 5 minutes between toasts
const TOAST_DURATION = 10000; // Toast stays visible for 10 seconds

export function DisclaimerToast() {
  const t = useTranslations("docsDisclaimer");
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback(() => {
    setIsVisible(true);
    localStorage.setItem(TOAST_STORAGE_KEY, Date.now().toString());

    // Auto-hide after duration
    setTimeout(() => {
      setIsVisible(false);
    }, TOAST_DURATION);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const lastShown = localStorage.getItem(TOAST_STORAGE_KEY);
    const now = Date.now();

    let initialDelay: number;

    if (!lastShown) {
      // First visit - show after initial delay
      initialDelay = TOAST_INITIAL_DELAY;
    } else {
      // Calculate time since last shown
      const timeSinceLastShown = now - parseInt(lastShown, 10);
      if (timeSinceLastShown >= TOAST_INTERVAL) {
        // Enough time has passed, show soon
        initialDelay = 5000;
      } else {
        // Wait for the remaining time
        initialDelay = TOAST_INTERVAL - timeSinceLastShown;
      }
    }

    // Initial timeout
    const initialTimeout = setTimeout(() => {
      showToast();
    }, initialDelay);

    // Set up recurring interval
    const interval = setInterval(() => {
      showToast();
    }, TOAST_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showToast]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="bg-background border border-orange-500/30 rounded-lg shadow-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-orange-500">{t("toastTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("toastMessage")}</p>
            <a
              href="https://github.com/timiliris/Hytale-Docs/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              {t("reportLink")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <button
            onClick={handleDismiss}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
