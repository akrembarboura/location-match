import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.8rem] font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field-input", props.className)} />;
}

export function SelectField({
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }) {
  return (
    <select {...props} className={cn("field-input appearance-none pr-8", props.className)}>
      <option value="">{placeholder ?? "Select an option"}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-colors",
              active
                ? "border-primary bg-primary-soft font-medium text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
