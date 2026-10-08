# LOC MAISON — Design System Color Tokens & Elevation

**File Path:** `docs/design-system/tokens.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Brand Identity & OKLCH Color Palette

LOC MAISON uses an authentic Mediterranean coastal palette defined in OKLCH color space (`src/styles.css`):
- **Teal (Primary):** `oklch(0.5313 0.0921 210.67)` — Primary action buttons, active navigation states, links.
- **Sand (Secondary/Neutral):** `oklch(0.9483 0.0136 78.26)` — Card backgrounds, secondary badges, soft warm fills.
- **Coral (Accent):** `oklch(0.7116 0.1812 22.84)` — Highlight badges, promotional callouts, featured items.

---

## 2. Semantic Token Mapping

| Token Name | OKLCH Value | UI Role & Intent |
|---|---|---|
| `--color-background` | `oklch(0.994 0 89.88)` | Main application background (soft off-white canvas) |
| `--color-foreground` | `oklch(0.2972 0 89.88)` | Primary text, titles, headings |
| `--color-card` | `oklch(1 0 89.88)` | Elevated card containers, modals, dialog surfaces |
| `--color-muted` | `oklch(0.9672 0 89.88)` | Inactive tab fills, disabled input backgrounds |
| `--color-muted-foreground` | `oklch(0.5221 0.0359 227.88)` | Secondary body text, metadata, captions, subtitles |
| `--color-primary` | `oklch(0.5313 0.0921 210.67)` | Primary CTAs ("Demander une réservation", "Publier") |
| `--color-primary-foreground` | `oklch(1 0 89.88)` | Text on primary buttons (White) |
| `--color-primary-soft` | `oklch(0.9528 0.013 208.77)` | Soft primary pill fills, subtle hover highlights |
| `--color-border` | `oklch(0.8853 0.0185 78.23)` | Card borders, input outlines, table dividers |
| `--color-success` | `oklch(0.6423 0.1467 133.01)` | Active, Published, Verified, Paid status indicators |
| `--color-warning` | `oklch(0.8391 0.1615 84.38)` | Pending Review, Under Review, Cash Reported warnings |
| `--color-destructive` | `oklch(0.568 0.2002 26.41)` | Rejected, Unpaid, Cancelled, Delete actions |

---

## 3. Elevation & Corner Radius Scale

- **Border Radius:** `--radius`: `0.5rem` (8px base).
  - Small: `calc(var(--radius) - 4px)` (4px) ➔ Badges, small inputs.
  - Medium: `calc(var(--radius) - 2px)` (6px) ➔ Buttons, dropdown menus.
  - Large: `var(--radius)` (8px) ➔ Standard cards, input fields.
  - Extra Large: `calc(var(--radius) + 8px)` (16px) ➔ Modals, drawers, featured property cards.
- **Elevation Shadows:**
  - `--shadow-card`: `0 1px 2px oklch(0.2972 0 89.88 / 6%), 0 8px 24px -16px oklch(0.2972 0 89.88 / 18%)`
  - `--shadow-raised`: `0 2px 6px oklch(0.2972 0 89.88 / 8%), 0 18px 40px -22px oklch(0.2972 0 89.88 / 30%)`

