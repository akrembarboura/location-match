import type { UserRole } from "@/components/auth/AuthProvider";

/**
 * Extracts 1-2 uppercase initials from a user's full name or email.
 * - "Akrem Barboura" -> "AB"
 * - "Ahmed Ben Ali" -> "AB"
 * - "Akrem" -> "AK"
 * - "akrem@example.com" -> "A"
 */
export function getUserInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    const single = parts[0];
    return single.slice(0, Math.min(2, single.length)).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "U";
}

/**
 * Returns a clean display name:
 * 1. "FirstName LastName"
 * 2. "FirstName"
 * 3. email username (e.g. "akrem" from "akrem@example.com")
 */
export function getUserDisplayName(user?: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  if (!user) return "";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.email) return user.email.split("@")[0];
  return "Utilisateur";
}

/**
 * Returns user-friendly French label for each role.
 */
export function getRoleLabel(role?: UserRole | string): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "SUPER_ADMIN":
      return "Super Administrateur";
    case "OWNER":
      return "Propriétaire";
    case "CUSTOMER":
      return "Client";
    default:
      return "Membre";
  }
}
