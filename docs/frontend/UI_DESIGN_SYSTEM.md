# 🎨 LOC MAISON — Frontend UI Design System & Component Architecture

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Frontend Engineering & UI Architecture
> - **Stack**: React 19, Next.js 15 App Router, Tailwind CSS, Lucide Icons, Radix UI
> - **Design System**: Dar Mahdia Front-Office Theme Tokens
> - **Authoritative Literature References**:
>   - 📚 *Refactoring UI* by Adam Wathan & Steve Schoger
>   - 📚 *Design Systems: With Atomic Design* by Brad Frost
>   - 📚 *Micro Frontends in Action* by Michael Geers

---

## 📌 Executive Summary

The LOC MAISON frontend UI architecture avoids unstructured "dashboard chaos". It strictly implements a **Token-Driven Atomic Design System** built on top of the front-office **Dar Mahdia Property Card** visual language.

---

## 🎨 1. Design Tokens & Color Palette

### Token Architecture (`tailwind.config.js` / `globals.css`)

```css
@layer base {
  :root {
    --background: 210 40% 98%;          /* #F8FAFC - Soft Slate 50 Workspace */
    --foreground: 222 47% 11%;          /* #0F172A - High-Contrast Text Slate 900 */
    --card: 0 0% 100%;                  /* #FFFFFF - Pure White Surface */
    --card-foreground: 222 47% 11%;
    --primary: 174 84% 32%;             /* #0D9488 - Dar Mahdia Teal Brand Primary */
    --primary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;             /* #F1F5F9 - Soft Badge Container */
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;        /* Subtle border stroke */
    --radius: 0.75rem;                  /* 12px Rounded Corners */
  }
}
```

### Color Token Reference Table

| Token Name | Tailwind Class | Hex Code | Visual Application |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `bg-primary` / `text-primary` | `#0D9488` (Teal 600) | Primary buttons, active tab indicators, brand accents. |
| **Workspace Background** | `bg-background` | `#F8FAFC` (Slate 50) | Neutral background across admin and owner portals. |
| **Card Surface** | `bg-card` / `border-border/80` | `#FFFFFF` (White) | Elevation cards, form panels, modal content containers. |
| **Slate Data Typography** | `text-foreground font-mono` | `#0F172A` (Slate 900) | Financial figures, currency amounts, numerical metrics. |
| **Soft Metric Badges** | `bg-primary/10 text-primary` | Teal 10% Alpha | Metric container icons & category indicators. |

---

## 🧩 2. Component Hierarchy (Atomic Structure)

Following Brad Frost's *Atomic Design* principles:

```
src/components/
├── ui/                         <-- Atoms (Button, Input, Badge, Dialog)
├── shared/                     <-- Molecules (AsyncStateContainer, StatusBadge)
├── admin/                      <-- Organisms (AdminShell, CommissionNegotiationPanel)
└── properties/                 <-- Templates (HouseCard, PropertyGrid)
```

### Atom Example: Standardized Action Button
```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        outline: "border border-border bg-background hover:bg-muted text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

---

## 📐 3. UI Layout Guidelines & Restraint Rules

> 💡 **Design Principles from *Refactoring UI***:

1. **No Colored Numbers**: Numbers in dashboards should inherit the restrained text hierarchy (`text-foreground font-mono`) instead of receiving arbitrary rainbow colors (green for money, orange for pending, pink for views).
2. **Consistent Card Spacing**: Cards use `p-6` padding with `rounded-2xl` borders and `shadow-sm` depth.
3. **Semantic Status Color Rules**:
   - `VERIFIED` / `CONFIRMED`: Soft emerald badge (`bg-emerald-50 text-emerald-700`).
   - `PENDING`: Soft amber badge (`bg-amber-50 text-amber-700`).
   - `REJECTED`: Soft rose badge (`bg-rose-50 text-rose-700`).

---

## 📚 4. Engineering Literature References

- 📘 **Wathan, A., & Schoger, S.** (2018). *Refactoring UI*. Application of visual hierarchy, contrast ratios, and color token systems.
- 📙 **Frost, B.** (2016). *Atomic Design*. Designing modular component systems from atoms to templates.
