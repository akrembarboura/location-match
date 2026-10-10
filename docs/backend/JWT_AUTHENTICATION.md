# Guide de l'Authentification JWT & Gestion des Sessions

Ce document détaille la stratégie d'authentification utilisée dans le projet **LOC MAISON**. L'architecture repose sur des JSON Web Tokens (JWT) stateless (sans état), assurant sécurité, rapidité et compatibilité avec l'architecture serverless de Next.js (Vercel).

---

## 1. Vue d'ensemble de la stratégie

Le système d'authentification ne s'appuie pas sur des sessions persistées en base de données. 
Il utilise :
- Un **JWT chiffré unique** (faisant office de jeton d'accès et de session).
- Un stockage sécurisé via **Cookie HttpOnly**.
- Une vérification **stateless** à chaque requête via la bibliothèque légère `jose` (compatible avec l'Edge Runtime de Next.js).

---

## 2. Implémentation du JWT (Access Token)

### Contenu (Payload)
Le token contient uniquement les informations nécessaires pour identifier l'utilisateur et ses droits sans interroger la base de données :

```typescript
export interface AuthJwtPayload {
  sub: string;    // L'ID de l'utilisateur (User ID)
  role: Role;     // Le rôle (CUSTOMER, OWNER, ADMIN, SUPER_ADMIN)
  email: string;  // L'adresse e-mail (pour l'affichage rapide)
  iat?: number;   // Timestamp de création
  exp?: number;   // Timestamp d'expiration (7 jours)
}
```

### Signature et Chiffrement
- **Librairie** : `jose` (remplace `jsonwebtoken` car `jose` est conçu pour les Edge Functions Next.js).
- **Algorithme** : `HS256` (HMAC avec SHA-256).
- **Clé secrète** : Variable d'environnement `JWT_SECRET`.

---

## 3. Stratégie de Stockage & Sécurité

### Le Cookie de Session
Dès qu'un utilisateur se connecte ou s'inscrit (`AuthService.ts`), le JWT est généré et placé dans un cookie sécurisé appelé `loc_maison_session`.

```typescript
export const AUTH_CONFIG = {
  SESSION_COOKIE_NAME: "loc_maison_session",
  COOKIE_OPTIONS: {
    httpOnly: true, // Protège contre les attaques XSS (JavaScript ne peut pas lire le cookie)
    sameSite: "lax", // Protège contre les attaques CSRF
    secure: process.env.NODE_ENV === "production", // Limité au HTTPS en production
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // Expire automatiquement dans 7 jours
  },
};
```

---

## 4. Gestion de l'Expiration et "Refresh Tokens"

Dans beaucoup d'applications traditionnelles, on utilise un duo :
- *Access Token* (durée courte, 15 min, envoyé en mémoire)
- *Refresh Token* (durée longue, 30 jours, stocké en cookie ou base de données)

### L'approche choisie par LOC MAISON
Nous avons opté pour une approche simplifiée, moderne et parfaitement adaptée aux marketplaces : **Un jeton unique glissant (Sliding Session) sans Refresh Token.**

**Pourquoi ne pas utiliser de Refresh Token séparé ?**
1. **Complexité Inutile** : Gérer la rotation des refresh tokens (Refresh Token Rotation) en environnement Serverless (Vercel) ajoute un surcoût en appels base de données.
2. **Double Sécurité Déjà Active** : L'utilisation de cookies `HttpOnly` + `SameSite=lax` supprime déjà 95% des failles motivant l'utilisation d'access tokens de courte durée en mémoire.

**Comment les sessions sont-elles prolongées ("Refreshed") ?**
1. Le JWT actuel est configuré pour expirer après **7 jours** (`JWT_EXPIRES_IN: "7d"`).
2. Si un utilisateur change de rôle (par exemple, un `CUSTOMER` termine son onboarding et devient `OWNER`), le backend génère immédiatement un nouveau JWT avec le nouveau rôle et écrase l'ancien cookie. Cela agit comme un mécanisme de rafraîchissement "Just-In-Time".
3. Lors d'une réinitialisation de mot de passe, un horodatage `passwordChangedAt` est mis à jour en base de données. (Optionnellement, le backend peut comparer l'attribut `iat` du JWT avec ce champ pour révoquer instantanément tous les JWT existants sans avoir de base de données de sessions).

---

## 5. Middleware & Auth Guards (Validation)

La validation des tokens s'effectue via des **Auth Guards** dans le backend, et non via des appels API depuis le client.

1. **Extraction** : Le serveur récupère le cookie `loc_maison_session`.
2. **Vérification cryptographique** : `jwtVerify()` s'assure que le token n'a pas été falsifié.
3. **Contrôle d'Expiration** : `jose` rejette automatiquement les tokens dont le champ `exp` est dépassé.

### Fonctions Utilitaires (`src/server/utils/auth-guards.ts`)
Le backend utilise des fonctions déclaratives pour protéger les routes API Serverless :

- `requireAuth(req)` : S'assure que le visiteur a un token valide.
- `requireRole(req, roles)` : Vérifie que le `role` contenu dans le payload correspond (ex: `ADMIN`, `OWNER`).
- `requireOwner(req)` : Raccourci pour valider qu'un propriétaire est connecté.

```typescript
// Exemple de protection d'une route API
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  // Si le token est absent ou expiré, une erreur 401 est levée automatiquement.
  // L'utilisateur (session.sub) est maintenant authentifié.
}
```

---

## 6. Révocation des Tokens (Logout)

Puisque les tokens sont stateless (non stockés en base), la déconnexion se fait côté client en demandant au navigateur de supprimer le cookie.

```typescript
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.SESSION_COOKIE_NAME);
}
```
Lors de l'appel à la route `/api/auth/logout`, le serveur renvoie un en-tête `Set-Cookie` qui écrase et expire instantanément le cookie de session de l'appareil.

