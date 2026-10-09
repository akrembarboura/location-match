"use client";

import { useState } from "react";
import { MessageSquare, Share2, Copy, Check } from "lucide-react";
import {
  generatePropertyWhatsAppLink,
  generateWhatsAppShareLink,
} from "@/lib/utils/whatsapp-share";

interface PropertyWhatsAppButtonsProps {
  title: string;
  city: string;
  price: number;
  period: string;
  propertyUrl?: string;
  ownerPhone?: string | null;
}

export function PropertyWhatsAppButtons({
  title,
  city,
  price,
  period,
  propertyUrl,
  ownerPhone,
}: PropertyWhatsAppButtonsProps) {
  const [copied, setCopied] = useState(false);

  const currentUrl =
    propertyUrl || (typeof window !== "undefined" ? window.location.href : "https://locmaison.tn");

  const directWhatsAppUrl = generatePropertyWhatsAppLink({
    title,
    city,
    price,
    period,
    propertyUrl: currentUrl,
    ownerPhone,
  });

  const shareWhatsAppUrl = generateWhatsAppShareLink({
    title,
    city,
    price,
    period,
    propertyUrl: currentUrl,
  });

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2.5 pt-4 border-t border-border mt-5">
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 font-display text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        Contacter le propriétaire sur WhatsApp
      </a>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={shareWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          <Share2 className="h-3.5 w-3.5 text-emerald-600" />
          Partager
        </a>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-surface transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copié !
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              Copier lien
            </>
          )}
        </button>
      </div>
    </div>
  );
}
