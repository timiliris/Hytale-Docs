"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/contexts/pwa-context";
import { cn } from "@/lib/utils";

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const {
    canInstall,
    isInstalled,
    isIOS,
    isAndroid,
    isSafari,
    showInstallPrompt,
    installApp,
    dismissInstallPrompt,
    remindLater,
  } = usePWA();

  const [isVisible, setIsVisible] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  // Animate in when prompt should show
  React.useEffect(() => {
    if (showInstallPrompt && !isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showInstallPrompt, isInstalled]);

  const handleInstall = async () => {
    if (isIOS && isSafari) {
      // Show iOS instructions
      setShowInstructions(true);
    } else {
      await installApp();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(dismissInstallPrompt, 300);
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    setTimeout(remindLater, 300);
  };

  // Don't render if already installed or shouldn't show
  if (isInstalled || !showInstallPrompt) return null;

  // Determine which icon to show based on platform
  const PlatformIcon = isIOS || isAndroid ? Smartphone : Monitor;

  return (
    <>
      {/* Main Install Prompt Banner */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6",
          "transition-all duration-300 ease-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Icon and content */}
              <div className="flex items-start gap-3 flex-1">
                {/* App icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                  <PlatformIcon className="w-6 h-6 text-amber-500" />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {t("install.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("install.description")}
                  </p>

                  {/* Features list */}
                  <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {t("install.feature1")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {t("install.feature2")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {t("install.feature3")}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Close button (mobile: top right) */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 sm:static p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                aria-label={t("install.dismiss")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
              {canInstall && (
                <Button
                  onClick={handleInstall}
                  className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("install.installButton")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleRemindLater}
                className="flex-1 sm:flex-none"
              >
                {t("install.remindLater")}
              </Button>
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {t("install.dontShowAgain")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {t("install.iosInstructions.title")}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("install.iosInstructions.description")}
              </p>

              {/* Steps */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-semibold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {t("install.iosInstructions.step1")}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <Share className="w-5 h-5" />
                      <span className="text-xs">{t("install.iosInstructions.shareIcon")}</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-semibold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {t("install.iosInstructions.step2")}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <PlusSquare className="w-5 h-5" />
                      <span className="text-xs">{t("install.iosInstructions.addToHome")}</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-semibold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {t("install.iosInstructions.step3")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => setShowInstructions(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {t("install.iosInstructions.gotIt")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Android Instructions (similar modal for Chrome on Android if needed) */}
      {isAndroid && !canInstall && showInstructions && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {t("install.androidInstructions.title")}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("install.androidInstructions.description")}
              </p>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {t("install.androidInstructions.step1")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button
                onClick={() => setShowInstructions(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {t("install.androidInstructions.gotIt")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
