"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Optimizes Cloudinary URLs on the fly using Cloudinary's native URL transformation API.
 * Adds f_auto (best format: AVIF/WebP), q_auto (intelligent quality compression),
 * and width constraints to prevent serving oversized images without relying on Next.js local proxy.
 */
type SafeImageProps = Omit<
  ImageProps,
  "src" | "alt" | "fill" | "width" | "height" | "onLoad" | "onError"
> & {
  src?: string;
  alt: string;
};

/** Image with loading shimmer, broken-image fallback, and Next.js image optimization. */
export function SafeImage({
  className,
  src,
  alt,
  ...props
}: SafeImageProps) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");

  useEffect(() => {
    setState(src ? "loading" : "error");
  }, [src]);

  if (state === "error" || !src) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">{t.gallery.unavailable}</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Image
        {...props}
        src={src}
        alt={alt}
        fill
        loading={props.loading ?? "lazy"}
        sizes={props.sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        onLoad={() => setState("ok")}
        onError={() => setState("error")}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          state === "loading" ? "animate-pulse bg-muted opacity-0" : "opacity-100",
          className
        )}
      />
    </div>
  );
}
