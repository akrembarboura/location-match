import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/utils/auth-guards";
import { OnboardOwnerSchema } from "@/server/validations/property";
import { OwnerModel, UserModel } from "@/lib/models";
import { signJwtToken } from "@/server/utils/auth";
import { setSessionCookie } from "@/server/utils/session-cookie";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = OnboardOwnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if owner profile already exists
    let ownerDoc = await OwnerModel.findOne({
      $or: [{ userId: user.id }, { id: user.id }],
    });

    if (!ownerDoc) {
      ownerDoc = await OwnerModel.create({
        id: `OWNER-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        userId: user.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        area: parsed.data.area || "Mahdia",
        properties: 0,
        since: new Date().getFullYear().toString(),
      });
    } else {
      await OwnerModel.updateOne(
        { _id: ownerDoc._id },
        {
          $set: {
            name: parsed.data.name,
            phone: parsed.data.phone,
            area: parsed.data.area || ownerDoc.area || "Mahdia",
          },
        }
      );
    }

    // Upgrade user role in database if currently CUSTOMER
    if (user.role === "CUSTOMER") {
      await UserModel.updateOne(
        { id: user.id },
        {
          $set: {
            role: "OWNER",
            phone: parsed.data.phone,
          },
        }
      );

      // Refresh JWT cookie with updated OWNER role
      const newToken = await signJwtToken({
        sub: user.id,
        role: "OWNER",
        email: user.email,
      });
      await setSessionCookie(newToken);
    }

    return NextResponse.json({
      success: true,
      message: "Profil propriétaire activé avec succès.",
      owner: ownerDoc,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    console.error("POST /api/owner/onboard error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'activation du profil propriétaire." },
      { status: 500 }
    );
  }
}

