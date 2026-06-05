import type { PendingImage } from "./types";

/**
 * Module-level registry for images extracted during the transformer phase
 * and written during the emitter phase.
 *
 * Encapsulated behind helper functions so the mutable Map isn't exposed directly.
 */
const imageRegistry = new Map<string, PendingImage[]>();

export const registerImages = (url: string, images: PendingImage[]): void => {
  const existing = imageRegistry.get(url) ?? [];
  imageRegistry.set(url, [...existing, ...images]);
};

export const drainImages = (): Map<string, PendingImage[]> => {
  const snapshot = new Map(imageRegistry);
  imageRegistry.clear();
  return snapshot;
};

export const hasImages = (): boolean => imageRegistry.size > 0;
