"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { HouseImage } from "@/lib/rentals/types";
import { sortImages } from "@/lib/rentals/types";
import { SafeImage } from "./SafeImage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Props = {
  images: HouseImage[];
  className?: string;
  /** Aspect class for the frame, e.g. "aspect-[4/3]". */
  aspect?: string;
  /** Allow opening a fullscreen lightbox. */
  lightbox?: boolean;
  fit?: "cover" | "contain";
};

/** Swipeable (scroll-snap) gallery with arrows, counter and optional lightbox. Any number of images. */
export function HouseGallery({ images, className, aspect = "aspect-[4/3]", lightbox = true, fit = "cover" }: Props) {
  const list = sortImages(images);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <Slider images={list} className={cn(aspect, className)} fit={fit} onExpand={lightbox ? setOpen : undefined} />
      {open !== null && <Lightbox images={list} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Slider({
  images,
  className,
  fit,
  onExpand,
  start = 0,
  dark,
}: {
  images: HouseImage[];
  className?: string;
  fit: "cover" | "contain";
  onExpand?: ((i: number) => void) | undefined;
  start?: number;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const el = ref.current;
    if (el && start) el.scrollTo({ left: start * el.clientWidth });
  }, [start]);

  const go = useCallback(
    (dir: number) => {
      const el = ref.current;
      if (!el) return;
      const next = Math.max(0, Math.min(images.length - 1, index + dir));
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [index, images.length],
  );

  useEffect(() => {
    if (!dark) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, dark]);

  if (images.length === 0) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg", className)}>
        <SafeImage src="" alt="" />
      </div>
    );
  }

  return (
    <div className={cn("group/gal relative overflow-hidden", !dark && "rounded-lg bg-muted", className)}>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            tabIndex={onExpand ? 0 : -1}
            onClick={() => onExpand?.(i)}
            className={cn("h-full w-full shrink-0 snap-center", onExpand ? "cursor-zoom-in" : "cursor-default")}
            aria-label={onExpand ? t.gallery.open : img.alt}
          >
            <SafeImage
              src={img.url}
              alt={img.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className={fit === "cover" ? "object-cover" : "object-contain"}
            />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t.gallery.prev}
            onClick={() => go(-1)}
            disabled={index === 0}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-opacity disabled:opacity-0 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={t.gallery.next}
            onClick={() => go(1)}
            disabled={index === images.length - 1}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-opacity disabled:opacity-0 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
        <span className="rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background">
          {index + 1} / {images.length}
        </span>
      </div>
      {onExpand && (
        <button
          type="button"
          onClick={() => onExpand(index)}
          aria-label={t.gallery.open}
          className="absolute bottom-3 left-3 flex h-8 items-center gap-1.5 rounded-full bg-card/90 px-3 text-xs font-medium text-foreground shadow-card"
        >
          <Expand className="h-3.5 w-3.5" /> {images.length}
        </button>
      )}
    </div>
  );
}

function Lightbox({ images, start, onClose }: { images: HouseImage[]; start: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex flex-col bg-foreground">
      <div className="flex justify-end p-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.gallery.close}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background/15 text-background"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Slider images={images} start={start} fit="contain" dark className="flex-1" />
    </div>
  );
}
