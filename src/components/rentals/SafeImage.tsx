import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Optimizes Cloudinary URLs on the fly using Cloudinary's native URL transformation API.
 * Adds f_auto (best format: AVIF/WebP), q_auto (intelligent quality compression),
 * and width constraints to prevent serving oversized images without relying on Next.js local proxy.
 */
function getOptimizedSrc(src: unknown, width?: number | string): string | undefined {
  if (!src || typeof src !== "string") return typeof src === "string" ? src : undefined;
  if (!src.includes("res.cloudinary.com")) return src;
  if (src.includes("/upload/f_auto") || src.includes("/upload/q_auto") || src.includes("/upload/c_")) {
    return src;
  }
  const w = Number(width) || 800;
  return src.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${w}/`);
}

/** Image with loading shimmer, broken-image fallback, and native Cloudinary CDN optimization. */
export function SafeImage({
  className,
  src,
  alt,
  width,
  height,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");

  if (state === "error" || !src) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">{t.gallery.unavailable}</span>
      </div>
    );
  }

  const finalSrc = getOptimizedSrc(src, width);

  return (
    <img
      {...props}
      src={finalSrc}
      alt={alt}
      loading={props.loading ?? "lazy"}
      decoding="async"
      width={width}
      height={height}
      onLoad={() => setState("ok")}
      onError={() => setState("error")}
      className={cn(
        "h-full w-full transition-opacity duration-300",
        state === "loading" ? "animate-pulse bg-muted opacity-0" : "opacity-100",
        className
      )}
    />
  );
}
