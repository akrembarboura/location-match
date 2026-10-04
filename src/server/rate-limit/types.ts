export type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; reset: number }>;
}
