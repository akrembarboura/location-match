# LOC MAISON — Responsive Breakpoints & Mobile Design Rules

**File Path:** `docs/design-system/responsive-rules.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Official Breakpoint Hierarchy

| Tailwind Prefix | Minimum Viewport Width | Typical Device Class | Layout Behavior |
|---|---|---|---|
| `default` | 0px – 639px | Mobile phones (375px–414px) | Single-column stack, fixed bottom tab bar, full-width inputs, drawer filters. |
| `sm:` | 640px – 767px | Large phones / phablets | 2-column forms, 2-column property grids. |
| `md:` | 768px – 1023px | Tablets (portrait) | 2-column grids, inline filter bars. |
| `lg:` | 1024px – 1279px | Tablets (landscape) / Laptops | Desktop header, desktop sidebar, 3-column property grid. |
| `xl:` | 1280px+ | Desktop monitors | Max-width container (`max-w-6xl` / `max-w-7xl`), multi-column dashboards. |

---

## 2. Non-Negotiable Mobile Rules

1. **44 × 44px Minimum Touch Target:** Every clickable button, link, and input MUST provide at least a 44px height/width touch area (`min-h-[44px]`).
2. **16px Input Font Size on Mobile:** All `<input>`, `<select>`, and `<textarea>` elements on mobile viewports MUST use `text-base` (16px) to prevent iOS Safari auto-zoom.
3. **Safe Area Inset Handling:** All fixed bottom elements (e.g. `<MobileTabBar />` or sticky CTAs) MUST include `pb-[env(safe-area-inset-bottom)]`.
4. **Bottom Padding on Page Containers:** Page containers on mobile MUST specify `pb-24` to prevent content from being hidden behind the fixed bottom tab bar.
5. **Mobile Drawer Filters:** Mobile search filters MUST use `<Sheet>` or `<Drawer>` overlays rather than expanding long inline lists.
