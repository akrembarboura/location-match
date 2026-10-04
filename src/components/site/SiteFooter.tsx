"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { t } from "@/lib/i18n";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const f = t.footer;
  const link = "hover:text-primary";
  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{f.tagline}</p>
          {f.subtagline && (
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground/80">{f.subtagline}</p>
          )}
          <div className="mt-4 flex gap-2">
            <a href="https://facebook.com" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary"><Facebook className="h-4 w-4" /></a>
            <a href="https://instagram.com" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary"><Instagram className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <p className="eyebrow">{f.explore}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/houses" className={link}>{f.browse}</Link></li>
            <li><Link href="/" className={link}>{f.destinations}</Link></li>
            <li><Link href="/student" className={link}>{f.student}</Link></li>
            <li><Link href="/owner" className={link}>{f.list}</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">{f.company}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className={link}>{f.about}</Link></li>
            <li><a href="tel:+21690000000" className={link}>{f.contact} · +216 90 000 000</a></li>
            <li><Link href="/terms" className={link}>{f.terms}</Link></li>
            <li><Link href="/privacy" className={link}>{f.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        LOC MAISON · {f.notice}
      </div>
    </footer>
  );
}
