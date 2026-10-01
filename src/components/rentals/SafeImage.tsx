import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Image with loading shimmer and broken-image fallback. */
export function SafeImage({ className, src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");
  if (state === "error") {
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">{t.gallery.unavailable}</span>
      </div>
    );
  }
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      loading={props.loading ?? "lazy"}
      decoding="async"
      onLoad={() => setState("ok")}
      onError={() => setState("error")}
      className={cn("h-full w-full transition-opacity duration-300", state === "loading" ? "animate-pulse bg-muted opacity-0" : "opacity-100", className)}
    />
  );
}
