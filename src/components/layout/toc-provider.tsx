"use client";

import * as React from "react";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
import type { TocItem } from "@/lib/extract-headings";

interface TocProviderProps {
  items: TocItem[];
  children: React.ReactNode;
}

export function TocProvider({ items, children }: TocProviderProps) {
  const { setTocItems } = useMobileNavigation();

  React.useEffect(() => {
    setTocItems(items);
    return () => setTocItems([]);
  }, [items, setTocItems]);

  return <>{children}</>;
}
