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
  const link =
    "flex min-h-10 items-center rounded-md text-sm leading-snug text-foreground/75 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  return (
    <footer className="mt-12 border-t border-border bg-sand sm:mt-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-5 gap-y-7 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 rounded-2xl border border-border/70 bg-card/60 p-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/80">
            <span className="sm:hidden">{f.taglineMobile}</span>
            <span className="hidden sm:inline">{f.tagline}</span>
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            <span className="sm:hidden">{f.subtaglineMobile}</span>
            <span className="hidden sm:inline">{f.subtagline}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-10 sm:w-10"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-10 sm:w-10"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        <nav aria-label={f.explore} className="min-w-0">
          <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">{f.explore}</h2>
          <ul className="mt-2">
            <li><Link href="/houses" className={link}>{f.browse}</Link></li>
            <li><Link href="/" className={link}>{f.destinations}</Link></li>
            <li><Link href="/student" className={link}>{f.student}</Link></li>
            <li><Link href="/owner" className={link}>{f.list}</Link></li>
          </ul>
        </nav>
        <nav aria-label={f.company} className="min-w-0">
          <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">{f.company}</h2>
          <ul className="mt-2">
            <li><Link href="/about" className={link}>{f.about}</Link></li>
            <li><a href="tel:+21626574203" className={link}>{f.contact} · +216 26 574 203</a></li>
            <li><Link href="/terms" className={link}>{f.terms}</Link></li>
            <li><Link href="/privacy" className={link}>{f.privacy}</Link></li>
            <li>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("loc_maison_open_consent"));
                  }
                }}
                  className={`${link} w-full text-left`}
              >
                Gestion des cookies
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs leading-relaxed text-muted-foreground sm:px-6 sm:py-5">
        &copy; 2026 LOC MAISON <span className="hidden sm:inline">&mdash; Un projet de </span>
        <span className="sm:hidden">· </span>
        <a href="https://microedition.tn/" className="font-medium text-foreground/75 transition-colors hover:text-primary" target="_blank" rel="noopener noreferrer">
          Micro Edition
        </a>
      </div>
    </footer>
  );
}
