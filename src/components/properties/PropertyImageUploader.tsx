"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImages } from "@/lib/rentals/upload-images";

export interface PropertyImageItem {
  id?: string;
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder?: number;
}

interface PropertyImageUploaderProps {
  images: PropertyImageItem[];
  onChange: (images: PropertyImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function PropertyImageUploader({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: PropertyImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxImages} photos au total.`);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploaded = await uploadImages(Array.from(files));
      const newImages = uploaded.map((img, index) => ({
        id: `img-${Date.now()}-${index}`,
        url: img.url,
        publicId: img.publicId,
        alt: `Photo ${images.length + index + 1}`,
        sortOrder: images.length + index,
      }));

      onChange([...images, ...newImages]);
    } catch (err: any) {
      setError(err.message || "Impossible de téléverser les photos. Veuillez réessayer.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleSetCover(index: number) {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors cursor-pointer bg-surface/40 hover:bg-surface hover:border-primary/50",
          uploading && "opacity-60 cursor-not-allowed",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center py-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">
              Téléversement des photos en cours vers Cloudinary…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <div className="rounded-full bg-primary/10 p-3 text-primary mb-2">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Cliquez pour ajouter des photos de votre bien
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG ou WEBP jusqu'à 5 Mo par photo. {images.length}/{maxImages} photos ajoutées.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, idx) => (
            <div
              key={img.id || img.url || idx}
              className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-card shadow-xs"
            >
              <img
                src={img.url}
                alt={img.alt || `Photo ${idx + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Cover Photo Badge */}
              {idx === 0 ? (
                <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground shadow-xs">
                  <Star className="h-3 w-3 fill-current" />
                  Principale
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetCover(idx)}
                  title="Définir comme photo principale"
                  className="absolute left-1.5 top-1.5 hidden rounded bg-background/80 px-1.5 py-0.5 text-[0.65rem] font-medium text-foreground backdrop-blur hover:bg-background group-hover:flex"
                >
                  Définir principale
                </button>
              )}

              {/* Delete Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 text-muted-foreground backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Supprimer la photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

