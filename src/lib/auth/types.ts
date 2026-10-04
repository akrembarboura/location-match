import type { ROLE_ENUM } from "@/lib/roles";

export type UserRole = (typeof ROLE_ENUM)[number];

/** Shape of the private user DTO returned by /api/auth/{me,login,register}. */
export type User = {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
};
