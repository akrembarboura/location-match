# LOC MAISON — Typography Hierarchy & Rules

**File Path:** `docs/design-system/typography.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Font Family System

- **Display Headings (`--font-display`):** `Montserrat`, `ui-sans-serif`, `system-ui`, `sans-serif`. Used for hero titles, page headings, section headers, property titles, and eyebrow labels.
- **Body & Controls (`--font-sans`):** `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`. Used for body copy, form inputs, buttons, tables, and metadata.

---

## 2. Typography Scale & Semantic Usage

| Scale Level | Utility Class / Tailwind | Font Weight | Line Height | Application Context |
|---|---|---|---|---|
| **Eyebrow** | `text-xs uppercase tracking-widest font-display` | Medium (500) | 1.0 | Category headers, status badges, section subtitles (e.g. "LOGEMENTS DISPONIBLES") |
| **Display / H1** | `text-3xl sm:text-4xl font-display font-semibold tracking-tight` | Semibold (600) | 1.15 | Main landing title, detail page title, major dashboard headers |
| **H2 / Section** | `text-2xl font-display font-semibold` | Semibold (600) | 1.25 | Section titles ("À traiter aujourd'hui", "Mes biens") |
| **H3 / Card Title** | `text-lg font-display font-semibold` | Semibold (600) | 1.3 | Property card title, modal headers |
| **Body Large** | `text-base text-foreground font-sans font-normal` | Regular (400) | 1.5 | Property description text, main intro paragraphs |
| **Body Regular** | `text-sm text-foreground font-sans font-normal` | Regular (400) | 1.5 | Standard form labels, table cells, drawer text |
| **Small / Caption** | `text-xs text-muted-foreground font-sans` | Regular (400) | 1.4 | Property location tags, timestamps, secondary metadata |
| **Price Tag** | `font-display font-bold text-lg text-primary` | Bold (700) | 1.0 | Property pricing (`120 TND / nuit`) |

---

## 3. Strict Rules
- 🛑 **No Random Fonts:** Do not introduce third-party font packages (e.g. Roboto, Open Sans).
- 🛑 **No Heavy Typography Noise:** Avoid `font-black` (900) or excessive bolding on body paragraphs.

