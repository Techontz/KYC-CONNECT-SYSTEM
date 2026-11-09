"use client";

import { CheckCircle2 } from "lucide-react";
import { useLang } from "../LangProvider";
import { PhoneMockup } from "../PhoneMockup";
import { Reveal } from "../ui";

export function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how" className="relative overflow-hidden bg-brand text-white">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-100 900 C 200 300, 900 80, 1600 160" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
        <path d="M-100 980 C 300 420, 1000 220, 1600 300" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="2" />
        <ellipse cx="1300" cy="80" rx="520" ry="180" fill="#fff" fillOpacity="0.05" />
      </svg>
      <div className="container-x relative pt-20 md:pt-28">
        <Reveal className="max-w-[640px]">
          <h2 className="heading text-[36px] md:text-[52px]">{t.how.title}</h2>
          <p className="mt-5 text-[18px] leading-relaxed text-white/90 md:text-[20px]">{t.how.subtitle}</p>
        </Reveal>

        <div className="mt-9 grid items-end gap-12 lg:mt-14 lg:grid-cols-2">
          <Reveal variant="left" className="order-2 hidden lg:order-1 lg:block">
            <div className="relative mx-auto max-w-[460px]">
              <div className="animate-float">
                <PhoneMockup className="translate-y-10" />
              </div>
              <div className="pop-in absolute left-1/2 top-8 w-[86%] -translate-x-1/2 rounded-2xl bg-white p-4 text-ink shadow-chip">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand text-white">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-bold">{t.chips.verified}</span>
                    <span className="block text-[12px] text-muted">{t.chips.verifiedSub}</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <ol className="order-1 space-y-7 pb-14 lg:order-2 lg:pb-24">
            {t.how.steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 160} variant="right" className="flex gap-5">
                <span className="pt-1.5 text-[20px] font-medium tabular-nums text-white/85">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="heading block text-[28px] md:text-[34px]">{s.title}</span>
                  <span className="mt-2 block max-w-[460px] text-[17px] leading-relaxed text-white/90 md:text-[19px]">{s.body}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
