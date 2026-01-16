"use client";

import * as React from "react";

const STORAGE_KEY = "sidebar-expanded-sections";

interface SidebarStateStore {
  expandedSections: string[];
  version: number;
}

function getStoredState(): SidebarStateStore | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 1 && Array.isArray(parsed.expandedSections)) {
        return parsed;
      }
    }
  } catch {
    // Invalid JSON, return null
  }
  return null;
}

function storeState(expandedSections: string[]): void {
  if (typeof window === "undefined") return;
  const state: SidebarStateStore = {
    expandedSections,
    version: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useSidebarState() {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    const stored = getStoredState();
    if (stored) {
      setExpandedSections(stored.expandedSections);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage when state changes (after hydration)
  React.useEffect(() => {
    if (hydrated) {
      storeState(expandedSections);
    }
  }, [expandedSections, hydrated]);

  const isExpanded = React.useCallback(
    (sectionKey: string) => {
      return expandedSections.includes(sectionKey);
    },
    [expandedSections]
  );

  const toggleSection = React.useCallback((sectionKey: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(sectionKey)) {
        return prev.filter((key) => key !== sectionKey);
      }
      return [...prev, sectionKey];
    });
  }, []);

  const expandSection = React.useCallback((sectionKey: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(sectionKey)) {
        return prev;
      }
      return [...prev, sectionKey];
    });
  }, []);

  const collapseSection = React.useCallback((sectionKey: string) => {
    setExpandedSections((prev) => prev.filter((key) => key !== sectionKey));
  }, []);

  const expandAll = React.useCallback((sectionKeys: string[]) => {
    setExpandedSections((prev) => {
      const newSections = new Set([...prev, ...sectionKeys]);
      return Array.from(newSections);
    });
  }, []);

  const collapseAll = React.useCallback(() => {
    setExpandedSections([]);
  }, []);

  return {
    expandedSections,
    isExpanded,
    toggleSection,
    expandSection,
    collapseSection,
    expandAll,
    collapseAll,
    hydrated,
  };
}
