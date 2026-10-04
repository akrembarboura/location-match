"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentUserQuery, useAuthMutations } from "@/lib/auth/api";
import type { User } from "@/lib/auth/types";

export type { User, UserRole } from "@/lib/auth/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending, refetch } = useQuery(currentUserQuery());
  const { mutateAsync: logoutAsync } = useAuthMutations().logout;

  const value = useMemo<AuthContextValue>(() => {
    const user = data ?? null;
    return {
      user,
      loading: isPending,
      isAuthenticated: user !== null,
      refreshUser: async () => {
        await refetch();
      },
      logout: async () => {
        await logoutAsync();
      },
    };
  }, [data, isPending, refetch, logoutAsync]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}