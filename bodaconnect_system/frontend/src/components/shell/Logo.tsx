import { cn } from "@/components/ui/cn";

/** Motorbike-wheel mark: green rim, mint spokes, green hub. */
export function LogoMark({ className }: { className?: string }) {
  const spokes = [-90, -30, 30, 90, 150, 210].map((a) => {
    const r = (a * Math.PI) / 180;
    return { x: 16 + 7.4 * Math.cos(r), y: 16 + 7.4 * Math.sin(r) };
  });
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#14291F" />
      <circle cx="16" cy="16" r="9.4" fill="none" stroke="#39B54A" strokeWidth="2.8" />
      <g stroke="#D6EDE3" strokeWidth="0.9" strokeLinecap="round">
        {spokes.map((p, i) => (
          <line key={i} x1="16" y1="16" x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} />
        ))}
      </g>
      <circle cx="16" cy="16" r="2.4" fill="#39B54A" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[17px] font-extrabold tracking-[-0.02em]", dark ? "text-white" : "text-ink")}>
        BodaConnect <span className="text-brand">OS</span>
      </span>
    </span>
  );
}
