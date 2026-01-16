"use client";

import * as React from "react";

interface SwipeConfig {
  threshold?: number; // Min distance in px (default 50)
  velocity?: number; // Min velocity (default 0.3)
  edgeWidth?: number; // Edge detection zone in px (default 20)
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isEdgeSwipe: boolean;
  edge: "left" | "right" | null;
}

export function useSwipeGesture({
  threshold = 50,
  velocity = 0.3,
  edgeWidth = 20,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeConfig) {
  const touchState = React.useRef<TouchState | null>(null);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;

      // Detect if touch started from edge
      const isLeftEdge = touch.clientX <= edgeWidth;
      const isRightEdge = touch.clientX >= windowWidth - edgeWidth;

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isEdgeSwipe: isLeftEdge || isRightEdge,
        edge: isLeftEdge ? "left" : isRightEdge ? "right" : null,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;

      // If vertical movement is dominant, abort swipe detection
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.7) {
        touchState.current = null;
        return;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // Calculate velocity (px/ms)
      const swipeVelocity = Math.abs(deltaX) / deltaTime;

      // Check if swipe is valid
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const meetsThreshold = Math.abs(deltaX) >= threshold;
      const meetsVelocity = swipeVelocity >= velocity;
      const { isEdgeSwipe, edge } = touchState.current;

      // Reset state
      touchState.current = null;

      if (!isHorizontalSwipe || !meetsThreshold || !meetsVelocity) {
        return;
      }

      // Swipe right (from left edge)
      if (deltaX > 0 && onSwipeRight) {
        // Allow swipe right from left edge or anywhere (for closing TOC)
        if (isEdgeSwipe && edge === "left") {
          onSwipeRight();
        }
      }

      // Swipe left (from right edge)
      if (deltaX < 0 && onSwipeLeft) {
        // Allow swipe left from right edge or anywhere (for closing sidebar)
        if (isEdgeSwipe && edge === "right") {
          onSwipeLeft();
        }
      }
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, velocity, edgeWidth, onSwipeLeft, onSwipeRight]);

  return ref;
}

// Hook for detecting swipe anywhere (not just edges) - useful for closing drawers
export function useSwipeToClose({
  direction,
  onClose,
  enabled = true,
  threshold = 50,
  velocity = 0.3,
}: {
  direction: "left" | "right";
  onClose: () => void;
  enabled?: boolean;
  threshold?: number;
  velocity?: number;
}) {
  const touchState = React.useRef<{ startX: number; startY: number; startTime: number } | null>(null);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;
      const swipeVelocity = Math.abs(deltaX) / deltaTime;

      touchState.current = null;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const meetsThreshold = Math.abs(deltaX) >= threshold;
      const meetsVelocity = swipeVelocity >= velocity;

      if (!isHorizontalSwipe || !meetsThreshold || !meetsVelocity) {
        return;
      }

      if (direction === "left" && deltaX < 0) {
        onClose();
      } else if (direction === "right" && deltaX > 0) {
        onClose();
      }
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, direction, onClose, threshold, velocity]);

  return ref;
}
