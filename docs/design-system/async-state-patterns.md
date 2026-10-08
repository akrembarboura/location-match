# LOC MAISON — TASK 19 Async State Composition Patterns

**File Path:** `docs/design-system/async-state-patterns.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Declarative Container Composition

To eliminate boilerplate `if (isLoading) return ...` checks scattered across pages, LOC MAISON provides `<AsyncStateContainer />` (`src/components/shared/AsyncStateContainer.tsx`).

### Standard Usage Pattern:

```tsx
import { useQuery } from "@tanstack/react-query";
import { AsyncStateContainer } from "@/components/shared";

export function CustomerPropertyList() {
  const query = useQuery({ queryKey: ["properties"], queryFn: fetchProperties });

  return (
    <AsyncStateContainer
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      data={query.data}
      onRetry={() => query.refetch()}
      emptyProps={{
        title: "Aucun logement disponible",
        description: "Modifiez vos dates ou vos critères de recherche.",
        actionLabel: "Réinitialiser les filtres",
        onAction: () => resetFilters(),
      }}
    >
      {(properties) => (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </AsyncStateContainer>
  );
}
```
