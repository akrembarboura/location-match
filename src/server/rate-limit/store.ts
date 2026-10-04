import type { RateLimitStore } from "./types";

/**
 * Development and test-safe adapter.
 * DO NOT use in production across multiple instances unless
 * a shared store like Redis is implemented.
 */
export class MemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; reset: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; reset: number }> {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.reset < now) {
      const reset = now + windowMs;
      this.hits.set(key, { count: 1, reset });
      
      // Cleanup mechanism to prevent infinite map growth
      setTimeout(() => {
        const current = this.hits.get(key);
        if (current && current.reset === reset) {
          this.hits.delete(key);
        }
      }, windowMs).unref?.();

      return { count: 1, reset };
    }

    entry.count += 1;
    return { count: entry.count, reset: entry.reset };
  }
}
