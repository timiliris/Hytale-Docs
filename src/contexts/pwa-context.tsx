"use client";

import * as React from "react";

// BeforeInstallPromptEvent interface for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend window to include PWA-related properties
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface PWAContextType {
  // Update notification state
  updateAvailable: boolean;
  updateServiceWorker: () => void;
  dismissUpdate: () => void;

  // Install prompt state
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  showInstallPrompt: boolean;
  installApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
  remindLater: () => void;
}

const PWAContext = React.createContext<PWAContextType | undefined>(undefined);

const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";
const INSTALL_REMIND_KEY = "pwa-install-remind-at";
const REMIND_DELAY_DAYS = 7;

function isInstallDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
}

function setInstallDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return;
  if (dismissed) {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  } else {
    localStorage.removeItem(INSTALL_DISMISSED_KEY);
  }
}

function getRemindAt(): number | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(INSTALL_REMIND_KEY);
  return value ? parseInt(value, 10) : null;
}

function setRemindAt(timestamp: number | null): void {
  if (typeof window === "undefined") return;
  if (timestamp) {
    localStorage.setItem(INSTALL_REMIND_KEY, timestamp.toString());
  } else {
    localStorage.removeItem(INSTALL_REMIND_KEY);
  }
}

function shouldShowReminder(): boolean {
  const remindAt = getRemindAt();
  if (!remindAt) return true;
  return Date.now() >= remindAt;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  // Update state
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

  // Install state
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(true); // Default true to prevent flash
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isAndroid, setIsAndroid] = React.useState(false);
  const [isSafari, setIsSafari] = React.useState(false);

  // Detect platform and browser
  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari specific property
      window.navigator.standalone === true;

    setIsInstalled(isStandalone);

    // Only show install prompt after delay and if not dismissed
    if (!isStandalone && !isInstallDismissed() && shouldShowReminder()) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for beforeinstallprompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Listen for service worker updates
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      // Service worker has been updated and taken control
      // This means we can reload to get the new version
      if (updateAvailable) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Check for waiting service worker on load
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // Listen for new service worker installing
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New content is available
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [updateAvailable]);

  // Update handlers
  const updateServiceWorker = React.useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  const dismissUpdate = React.useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  // Install handlers
  const installApp = React.useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setShowInstallPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error("[PWA] Install error:", error);
      }
    }
  }, [deferredPrompt]);

  const dismissInstallPrompt = React.useCallback(() => {
    setShowInstallPrompt(false);
    setInstallDismissed(true);
  }, []);

  const remindLater = React.useCallback(() => {
    setShowInstallPrompt(false);
    const remindTimestamp = Date.now() + REMIND_DELAY_DAYS * 24 * 60 * 60 * 1000;
    setRemindAt(remindTimestamp);
  }, []);

  const canInstall = deferredPrompt !== null || (isIOS && isSafari);

  const value: PWAContextType = {
    // Update
    updateAvailable,
    updateServiceWorker,
    dismissUpdate,
    // Install
    canInstall,
    isInstalled,
    isIOS,
    isAndroid,
    isSafari,
    showInstallPrompt: showInstallPrompt && !isInstalled,
    installApp,
    dismissInstallPrompt,
    remindLater,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const context = React.useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
