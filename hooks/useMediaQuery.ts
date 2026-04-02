"use client";

import { useSyncExternalStore } from "react";

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);

      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    getServerSnapshot,
  );
}
