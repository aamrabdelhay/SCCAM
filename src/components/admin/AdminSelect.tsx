"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export type AdminSelectOption = { value: string; label: string };

export function AdminSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "اختر",
  disabled = false,
}: {
  id: string;
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={root} className="relative min-w-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id + "-options"}
        onClick={() => setOpen((current) => !current)}
        className={cn("field flex w-full items-center justify-between gap-2 text-start", disabled && "cursor-not-allowed opacity-60")}
      >
        <span className={cn("min-w-0 truncate", !selected && "text-[var(--muted)]")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--muted)] transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id + "-options"}
          role="listbox"
          aria-labelledby={id}
          className="absolute inset-x-0 top-[calc(100%+5px)] z-[100] max-h-64 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-1.5 shadow-xl"
        >
          {options.length ? options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-start text-[13px] transition-colors hover:bg-[var(--surface)]",
                option.value === value ? "font-bold text-[var(--primary)]" : "text-[var(--text)]",
              )}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </button>
          )) : (
            <p className="px-3 py-2 text-[12px] text-[var(--muted)]">لا توجد خيارات متاحة</p>
          )}
        </div>
      )}
    </div>
  );
}
