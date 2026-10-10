# ⚡ LOC MAISON — Backend API Architecture & Route Handlers

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Backend Controller Architecture & Route Specifications
> - **Stack**: Next.js 15 App Router (`app/api/`), Node.js, Webpack/OXC, TypeScript
> - **Authoritative Literature References**:
>   - 📚 *RESTful Web APIs* by Leonard Richardson & Mike Amundsen
>   - 📚 *API Design Patterns* by JJ Geewax
>   - 📚 *Node.js Design Patterns* by Mario Casciaro & Luciano Mammino

---

## 📌 Executive Summary

LOC MAISON implements a RESTful API routing layer inside Next.js 15 App Router (`app/api/`). Controller actions handle HTTP transport, validate payloads via Zod, verify JWT/Session security guards, and delegate business processing to domain services.

---

## ⚡ 1. API Controller Route Structure

```
app/api/
├── admin/
│   ├── finance/               <-- Finance & Ledger Controller Actions
│   │   ├── commissions/
│   │   ├── overview/
│   │   └── transactions/
│   ├── properties/            <-- Property Verification & Moderation Actions
│   └── requests/              <-- Housing Request & Commission Negotiation Actions
├── auth/                      <-- Authentication Controller Actions (Login, Register, OTP)
├── owner/                     <-- Owner Listing & Cash Reporting Controller Actions
└── properties/                <-- Public Property Search & Discovery Endpoints
```

---

## 💻 2. Route Handler Implementation Pattern

Every API endpoint enforces a strict Try-Catch error normalization pipeline:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { requestService } from "@/server/services/RequestService";
import { RecordPaymentSchema } from "@/server/validations/negotiation";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization Guard Check (ADMIN or SUPER_ADMIN only)
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    // 2. Parse Path Parameters and Request Body
    const { id: requestId } = await params;
    const body = await req.json();

    // 3. Schema Input Validation
    const validatedData = RecordPaymentSchema.parse(body);

    // 4. Delegate to Domain Service
    const result = await requestService.recordCommissionPayment(requestId, validatedData);

    // 5. Standardized Success Response
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    // 6. Centralized Error Normalization
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Données de formulaire invalides.", details: error.errors }, { status: 400 });
    }

    console.error("POST /api/admin/requests/[id]/negotiation error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur." }, { status: 500 });
  }
}
```

---

## 📊 3. Standardized HTTP Response Format

All API routes emit structured JSON payloads matching this uniform contract:

```typescript
// Success Payload
{
  "success": true,
  "data": { /* Result DTO */ },
  "message": "Opération effectuée avec succès."
}

// Error Payload
{
  "error": "Message explicatif de l'erreur.",
  "code": "INVALID_STATE_TRANSITION",
  "statusCode": 400
}
```

---

## 📚 4. Engineering Literature References

- 📘 **Geewax, J. (2021).** *API Design Patterns*. Resource naming, error response design, and idempotent handler implementations.
- 📙 **Casciaro, M., & Mammino, L. (2020).** *Node.js Design Patterns*. Asynchronous control flows, factory patterns, and middleware composition.
