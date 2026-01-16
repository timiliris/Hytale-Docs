"use client";

import * as React from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MobileNavigationContextType {
  // Drawer states
  sidebarOpen: boolean;
  tocOpen: boolean;
  menuOpen: boolean;

  // Setters
  setSidebarOpen: (open: boolean) => void;
  setTocOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;

  // Convenience methods
  closeAll: () => void;
  openSidebar: () => void;
  openToc: () => void;
  openMenu: () => void;

  // TOC data (passed from page)
  tocItems: TocItem[];
  setTocItems: (items: TocItem[]) => void;

  // Active TOC item
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const MobileNavigationContext = React.createContext<MobileNavigationContextType | undefined>(undefined);

export function MobileNavigationProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [tocItems, setTocItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const closeAll = React.useCallback(() => {
    setSidebarOpen(false);
    setTocOpen(false);
    setMenuOpen(false);
  }, []);

  const openSidebar = React.useCallback(() => {
    closeAll();
    setSidebarOpen(true);
  }, [closeAll]);

  const openToc = React.useCallback(() => {
    closeAll();
    setTocOpen(true);
  }, [closeAll]);

  const openMenu = React.useCallback(() => {
    closeAll();
    setMenuOpen(true);
  }, [closeAll]);

  const value = React.useMemo<MobileNavigationContextType>(
    () => ({
      sidebarOpen,
      tocOpen,
      menuOpen,
      setSidebarOpen,
      setTocOpen,
      setMenuOpen,
      closeAll,
      openSidebar,
      openToc,
      openMenu,
      tocItems,
      setTocItems,
      activeId,
      setActiveId,
    }),
    [sidebarOpen, tocOpen, menuOpen, closeAll, openSidebar, openToc, openMenu, tocItems, activeId]
  );

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
    </MobileNavigationContext.Provider>
  );
}

export function useMobileNavigation() {
  const context = React.useContext(MobileNavigationContext);
  if (context === undefined) {
    throw new Error("useMobileNavigation must be used within a MobileNavigationProvider");
  }
  return context;
}
