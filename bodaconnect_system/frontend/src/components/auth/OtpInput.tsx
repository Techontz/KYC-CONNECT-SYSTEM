"use client";

import { useRef } from "react";
import { cn } from "@/components/ui";

/** Six single-digit boxes with paste, auto-advance and backspace handling. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  invalid?: boolean;
  label: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
  };

  return (
    <div role="group" aria-label={label} className="flex justify-between gap-1.5 sm:gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={i === 0 ? 6 : 1}
          aria-label={`${label} ${i + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={d}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) {
              // Paste or SMS autofill into one box.
              set(v);
              refs.current[Math.min(5, v.length - 1)]?.focus();
              return;
            }
            const arr = digits.slice();
            arr[i] = v;
            set(arr.join(""));
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              const arr = digits.slice();
              arr[i - 1] = "";
              onChange(arr.join(""));
              refs.current[i - 1]?.focus();
              e.preventDefault();
            } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "");
            if (text) {
              e.preventDefault();
              set(text);
              refs.current[Math.min(5, text.length - 1)]?.focus();
            }
          }}
          className={cn(
            "h-14 w-full min-w-0 max-w-14 rounded-[12px] border-[1.5px] bg-white text-center text-2xl font-bold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20",
            invalid ? "border-danger" : d ? "border-forest" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
