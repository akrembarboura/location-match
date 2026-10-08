# LOC MAISON — Animation, Accessibility & Mobile Interaction Rules

**File Path:** `docs/design-system/interaction-rules.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Motion & Animation Standards

- **Standard Application (`Motion` / Framer Motion):**
  - Accordion, drawer, modal, and popover entrances (`duration: 0.2s`, `ease: "easeOut"`).
  - Photo gallery lightbox image transitions.
  - Micro-feedback on button clicks and hover states.
- **Branded Marketing (`GSAP`):** Reserved strictly for high-impact landing hero sequences and major brand presentations.
- **Motion Restraint:** 🛑 No bouncing KPI numbers, no perpetual card animations, no motion delays on operational tasks. `prefers-reduced-motion` CSS media query MUST be respected.

---

## 2. Accessibility Standards (WCAG 2.1 AA Compliance)

- **Keyboard Navigation:** All interactive elements (`Button`, `Input`, `Select`, `Dialog`, `Calendar`) MUST be focusable via `Tab` with a visible focus ring (`ring-2 ring-primary`).
- **Touch Target Size:** Minimum interactive touch target area is **44 × 44px** on all mobile viewports (375px+).
- **ARIA Semantics:** Dialogs use `role="dialog"`, buttons have explicit `aria-label` when rendering icon-only controls.

---

## 3. Mobile Navigation & Drawer Guidelines

- **Desktop (≥1024px):** Collapsible sidebar + header.
- **Mobile (<1024px):** Top header + bottom navigation bar + `Sheet`/`Drawer` for complex filters and forms.
- **Safe Areas:** Respect `env(safe-area-inset-bottom)` to ensure bottom actions are never obscured by mobile system navigation bars.

