import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "LOC MAISON — Locations d'été à Mahdia",
  description: "Villas, maisons et appartements de vacances à Mahdia. Vraies photos et prix clairs en dinars.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            <SiteFooter />
            <MobileTabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
