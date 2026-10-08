# LOC MAISON — TASK 19 Domain Empty State Guidelines

**File Path:** `docs/design-system/empty-state-guidelines.md`  
**Date:** October 8, 2026  
**Auditor & Architect:** Antigravity AI  

---

## 1. Domain Empty State Standards

Empty states MUST be tailored to the user's role and domain context. Generic "No Data" messages are forbidden.

### 1.1 Customer Domain Empty States
- **Public Search:** `"Aucun logement ne correspond à votre recherche. Essayez de modifier vos dates ou d'élargir votre budget."` ➔ CTA: `[Modifier mes critères]`
- **Favorites:** `"Vous n'avez pas encore de logements favoris. Cliquez sur le cœur d'un bien pour le sauvegarder."` ➔ CTA: `[Explorer les logements]`
- **Reservations:** `"Vous n'avez aucune réservation en cours."` ➔ CTA: `[Rechercher une location]`

### 1.2 Owner Domain Empty States
- **My Properties:** `"Vous n'avez encore publié aucun bien. Ajoutez votre première annonce pour commencer à recevoir des demandes."` ➔ CTA: `[Ajouter mon premier bien]`
- **Pending Requests:** `"Aucune demande de location en attente."` ➔ Contextual explanation.
- **Reservations Calendar:** `"Aucune réservation planifiée pour cette période."`

### 1.3 Admin Domain Empty States
- **Moderation Queue:** `"Aucun bien en attente de validation. La file d'attente est totalement à jour !"`
- **Client Users:** `"Aucun utilisateur ne correspond à ce filtre."`
