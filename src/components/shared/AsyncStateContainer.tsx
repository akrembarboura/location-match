"use client";

import React from "react";
import { EmptyState, EmptyStateProps } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { NetworkErrorState } from "./NetworkErrorState";
import { UnauthorizedState } from "./UnauthorizedState";
import { ForbiddenState } from "./ForbiddenState";
import { SkeletonGrid } from "./SkeletonGrid";

export interface AsyncStateContainerProps<T> {
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  data?: T[] | null;
  isEmpty?: boolean;
  isUnauthorized?: boolean;
  isForbidden?: boolean;
  isNetworkError?: boolean;
  onRetry?: () => void;
  
  // Custom Fallbacks
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  emptyProps?: EmptyStateProps;
  emptyFallback?: React.ReactNode;
  
  children: (data: T[]) => React.ReactNode;
}

export function AsyncStateContainer<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
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
    return <>{loadingFallback || <SkeletonGrid />}</>;
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
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  // 6. Empty State
  const resolvedEmpty =
    isEmpty !== undefined ? isEmpty : Array.isArray(data) ? data.length === 0 : !data;

  if (resolvedEmpty) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return (
      <EmptyState
        title={emptyProps?.title || "Aucun résultat disponible"}
        description={
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
  return <>{children((data || []) as T[])}</>;
}
