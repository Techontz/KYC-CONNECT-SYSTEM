"use client";

import Image from "next/image";
import { useLang } from "./LangProvider";

/**
 * Hero visual: hand holding a phone showing BodaConnect OS (image supplied by the client,
 * background removed with Apple Vision). File: public/images/hero-hand.png (1237 x 1120).
 */
export function HeroHand({ className = "" }: { className?: string }) {
  const { lang } = useLang();
  return (
    <div className={className || "relative"} style={{ aspectRatio: "1237 / 1120" }}>
      <Image
        src="/images/hero-hand.png"
        alt={lang === "sw" ? "Mkono ukishika simu yenye BodaConnect OS" : "A hand holding a phone running BodaConnect OS"}
        fill
        priority
        quality={90}
        sizes="(min-width: 1024px) 760px, 90vw"
        className="pointer-events-none select-none object-contain drop-shadow-[0_30px_50px_rgba(11,42,23,0.25)]"
      />
    </div>
  );
}
