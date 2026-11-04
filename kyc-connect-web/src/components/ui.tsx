"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export const SYSTEM_URL = process.env.NEXT_PUBLIC_SYSTEM_URL ?? "http://localhost:3011";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "pilot@bodaconnect.co.tz";

/** KYC Connect brand mark: an open "C" (connect) with a check (verified) sweeping out of it. */
export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="kc-mark" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4cc95e" />
          <stop offset="1" stopColor="#2a9139" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#kc-mark)" />
      <path d="M41.6 21.9A15.5 15.5 0 1 0 41.6 42.1" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M22.5 32.5l7 7L48 18" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="KYC Connect">
      <LogoMark size={32} />
      <span className={`text-[22px] leading-none tracking-[-0.02em] ${light ? "text-white" : "text-black"}`}>
        <span className="font-bold">KYC</span> <span className="font-medium">Connect</span>
      </span>
    </span>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "left" | "right" | "zoom";
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  // Visibility lives in React state so re-renders (e.g. switching language) never hide content again.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-variant={variant} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Counts a figure like "1,000" or "100%" up from zero when it scrolls into view. */
export function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  const target = match ? Number(match[2].replace(/,/g, "")) : 0;
  const [shown, setShown] = useState(match ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(`${match[1]}${Math.round(target * eased).toLocaleString("en-US")}${match[3]}`);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${
        dark ? "bg-white/10 text-mint" : "bg-mint text-forest"
      }`}
    >
      {children}
    </span>
  );
}

type BtnProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "outline-light" | "white";
  icon?: boolean;
  external?: boolean;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", icon = false, external = false, className = "" }: BtnProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-center md:whitespace-nowrap text-[16px] font-bold transition-all duration-200 active:scale-[0.98]";
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-600 shadow-[0_6px_20px_rgba(57,181,74,0.35)]",
    outline: "border-[1.5px] border-ink/80 text-ink hover:bg-ink hover:text-white",
    "outline-light": "border-[1.5px] border-white text-white hover:bg-white hover:text-forest",
    white: "bg-white text-forest hover:bg-mint",
  }[variant];
  return (
    <a
      href={href}
      className={`${base} ${styles} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {icon && <ArrowUpRight className="size-5" aria-hidden="true" />}
    </a>
  );
}

export function Chip({
  icon: Icon,
  label,
  title,
  sub,
  className = "",
  tone = "brand",
}: {
  icon: LucideIcon;
  label?: string;
  title: string;
  sub?: string;
  className?: string;
  tone?: "brand" | "blue" | "amber";
}) {
  const toneCls = {
    brand: "bg-mint text-brand-700",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  }[tone];
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-chip ${className}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneCls}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        {label && <span className="block text-[11px] font-medium text-muted">{label}</span>}
        <span className="block text-[14px] font-bold leading-tight text-ink">{title}</span>
        {sub && <span className="block text-[12px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}

