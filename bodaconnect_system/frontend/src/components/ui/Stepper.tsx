import { Check } from "lucide-react";
import { cn } from "./cn";

export function Stepper({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  done ? "bg-brand text-white" : active ? "bg-forest text-white" : "bg-surface text-muted border border-line",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
                <span className="sr-only">{done ? " ✓" : ""}</span>
              </span>
              <span className={cn("hidden truncate text-sm font-semibold md:block", active ? "text-ink" : "text-muted")}>{s}</span>
              {i < steps.length - 1 && <span aria-hidden className={cn("h-0.5 min-w-2 flex-1 rounded", done ? "bg-brand" : "bg-line")} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-ink md:hidden">
        {current + 1}/{steps.length} · {steps[current]}
      </p>
    </nav>
  );
}
