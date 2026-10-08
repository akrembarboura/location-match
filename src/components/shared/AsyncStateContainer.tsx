"use client";

import React from "react";
import { EmptyState, EmptyStateProps } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { NetworkErrorState } from "./NetworkErrorState";
import { UnauthorizedState } from "./UnauthorizedState";
import { ForbiddenState } from "./ForbiddenState";
import { SkeletonGrid } from "./SkeletonGrid";

export interface AsyncStateContainerProps<T = any> {
  isLoading?: boolean;
  loadingText?: string;
  isError?: boolean;
  error?: unknown;
  errorMessage?: string;
  data?: T[] | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  isUnauthorized?: boolean;
  isForbidden?: boolean;
  isNetworkError?: boolean;
  onRetry?: () => void;
  
  // Custom Fallbacks
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  emptyProps?: EmptyStateProps;
  emptyFallback?: React.ReactNode;
  
  children?: React.ReactNode | ((data: T[]) => React.ReactNode);
}

export function AsyncStateContainer<T = any>({
  isLoading,
  loadingText,
  isError,
  error,
  errorMessage,
  data,
  isEmpty,
  emptyTitle,
  emptyDescription,
  isUnauthorized,
  isForbidden,
  isNetworkError,
  onRetry,
  loadingFallback,
  errorFallback,
  emptyProps,
  emptyFallback,
  children,
}: AsyncStateContainerProps<T>) {
  // 1. Loading State
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card text-center">
        <SkeletonGrid count={3} />
        {loadingText && <p className="mt-4 text-sm font-medium text-muted-foreground">{loadingText}</p>}
      </div>
    );
  }

  // 2. Unauthorized State
  if (isUnauthorized) {
    return <UnauthorizedState />;
  }

  // 3. Forbidden State
  if (isForbidden) {
    return <ForbiddenState />;
  }

  // 4. Network Failure State
  if (isNetworkError) {
    return <NetworkErrorState onRetry={onRetry} />;
  }

  // 5. Error State
  if (isError) {
    if (errorFallback) return <>{errorFallback}</>;
    const resolvedErrorMessage =
      errorMessage || (error instanceof Error ? error.message : "Une erreur inattendue est survenue.");
    return <ErrorState message={resolvedErrorMessage} onRetry={onRetry} />;
  }

  // 6. Empty State
  const resolvedEmpty =
    isEmpty !== undefined ? isEmpty : Array.isArray(data) ? data.length === 0 : !data;

  if (resolvedEmpty) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return (
      <EmptyState
        title={emptyTitle || emptyProps?.title || "Aucun résultat disponible"}
        description={
          emptyDescription ||
          emptyProps?.description ||
          "Aucune donnée ne correspond à vos critères pour le moment."
        }
        actionLabel={emptyProps?.actionLabel}
        onAction={emptyProps?.onAction}
        actionHref={emptyProps?.actionHref}
        icon={emptyProps?.icon}
      />
    );
  }

  // 7. Success State
  if (typeof children === "function") {
    return <>{children((data || []) as T[])}</>;
  }

  return <>{children}</>;
}
