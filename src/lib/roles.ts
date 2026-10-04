/**
 * User roles — dependency-free so it can be imported from both server code
 * (Mongoose models) and client code (shared Zod schemas) without pulling
 * mongoose into the browser bundle.
 */
export const ROLE_ENUM = ["CUSTOMER", "OWNER", "ADMIN", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLE_ENUM)[number];
