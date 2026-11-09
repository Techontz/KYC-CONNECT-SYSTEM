"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { PORTAL_LIVE } from "@/lib/content";

export const PORTAL_URL = process.env.NEXT_PUBLIC_SYSTEM_URL ?? "http://localhost:3011";
export const WHATSAPP_URL = "https://wa.me/255753452222";
/** Until the portal is operational, registration buttons go to the contact route. */
export const REGISTER_URL = PORTAL_LIVE ? PORTAL_URL : WHATSAPP_URL;
export const LOGIN_URL = `${PORTAL_URL}/login`;
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@kycconnect.co.tz";

/** Official BodaKonnect logo. On dark backgrounds it sits on a white plate. */
export function Logo({ light = false, size = 40 }: { light?: boolean; size?: number }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/bodakonnect-logo.png" alt="BodaKonnect: Identity. Trust. Connection." width={Math.round(size * 3.5)} height={size} style={{ height: size, width: "auto" }} className="block select-none" draggable={false} />
  );
  return light ? <span className="inline-flex rounded-[10px] bg-white px-3 py-2">{img}</span> : <span className="inline-flex">{img}</span>;
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


export const COMPANY = {
  name: "KYC CONNECT LTD",
  brela: "211723971",
  phone: "+255 753 452 222",
  office: "Tz Wedding Plaza, Bwawani Street, Kinondoni, Dar es Salaam",
  website: "https://www.kycconnect.co.tz",
  websiteLabel: "www.kycconnect.co.tz",
};
