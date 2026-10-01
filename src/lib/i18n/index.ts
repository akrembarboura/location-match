/**
 * Minimal translation layer. French is the only locale for now; add `ar.ts`
 * / `en.ts` with the same shape and switch `current` (or read it from context).
 */
import { fr } from "./fr";

export type Dictionary = typeof fr;
const current: Dictionary = fr;

export function useT() {
  return current;
}

export const t = current;
