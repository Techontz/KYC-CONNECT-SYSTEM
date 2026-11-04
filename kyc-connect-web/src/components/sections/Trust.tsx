"use client";

import { Lock } from "lucide-react";
import { useLang } from "../LangProvider";
import { ButtonLink, CountUp, Reveal } from "../ui";

export function Trust() {
  const { t } = useLang();
  const tr = t.trust;
  return (
    <section id="trust" className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_0%_100%,#1f3e35_0%,#0b1512_55%,#050908_100%)] text-white">
      <div className="dot-globe pointer-events-none absolute -right-40 top-0 h-full w-[1000px] opacity-90" aria-hidden="true" />
      <div className="container-x relative py-20 md:py-28">
        <Reveal className="max-w-[640px]">
          <h2 className="heading text-[40px] md:text-[64px]">{tr.title}</h2>
          <p className="mt-6 text-[18px] leading-relaxed text-white/85 md:text-[20px]">{tr.subtitle}</p>
          <div className="mt-8">
            <ButtonLink href="#faq" variant="outline-light">
              {tr.cta}
            </ButtonLink>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-white/10 lg:grid-cols-4">
          {tr.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 140} variant="zoom" className="bg-[#0d1a16]/80 p-6 backdrop-blur md:p-8">
              <p className="heading text-[40px] text-brand md:text-[56px]"><CountUp value={s.value} /></p>
              <p className="mt-2 text-[14px] leading-snug text-white/80 md:text-[16px]">{s.label}</p>
            </Reveal>
          ))}
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {tr.points.map((p, i) => (
            <Reveal as="li" key={p} delay={i * 110} variant={i % 2 ? "right" : "left"} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[16px]">
              <Lock className="size-5 shrink-0 text-brand" aria-hidden="true" />
              {p}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
