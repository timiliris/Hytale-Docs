"use client";

import * as React from "react";
import { usePathname } from "@/i18n/routing";
import { MobileNavigationProvider } from "@/contexts/mobile-navigation-context";
import { BottomNavigation } from "./bottom-navigation";
import { MobileSidebarDrawer } from "./sidebar";
import { MobileToc } from "./mobile-toc";
import { MobileMenu } from "./mobile-menu";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";

function SwipeHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openSidebar, openToc, tocItems } = useMobileNavigation();
  const isDocsPage = pathname.startsWith("/docs");

  const swipeRef = useSwipeGesture({
    enabled: isDocsPage,
    onSwipeRight: openSidebar,
    onSwipeLeft: tocItems.length > 0 ? openToc : undefined,
  });

  return (
    <div ref={swipeRef as React.RefObject<HTMLDivElement>} className="flex-1 flex flex-col">
      {children}
    </div>
  );
}

export function DocsMobileNavigation({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavigationProvider>
      <SwipeHandler>
        {children}
      </SwipeHandler>
      <MobileSidebarDrawer />
      <MobileToc />
      <MobileMenu />
      <BottomNavigation />
    </MobileNavigationProvider>
  );
}
