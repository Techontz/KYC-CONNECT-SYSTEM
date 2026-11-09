"use client";

import Image from "next/image";
import { Bell, ClipboardEdit, UserCheck } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { Reveal } from "../ui";

/** One horizontal lane: alternating bars with icons, scrolling slowly sideways. */
function Lane({ items, reverse = false, speed = 60 }: { items: (number | string)[]; reverse?: boolean; speed?: number }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max items-center gap-4 animate-marquee"
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {row.map((it, i) =>
          typeof it === "number" ? (
            <span key={i} className="h-[46px] shrink-0 md:h-[54px]" style={{ width: Math.abs(it), background: it > 0 ? "#1f3e35" : "#39b54a" }} />
          ) : (
            <span key={i} className="grid size-[54px] shrink-0 place-items-center text-[34px] leading-none" aria-hidden="true">
              {it}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export function LanesBand() {
  const { lang } = useLang();
  const l = getBands(lang).lanes;
  const icons = [Bell, UserCheck, ClipboardEdit];

  return (
    <section className="relative overflow-hidden bg-white pt-20 md:pt-28">
      <div className="container-x">
        <Reveal variant="left">
          <h2 className="heading max-w-[600px] text-[44px] text-forest-900 md:text-[68px]">{l.title}</h2>
        </Reveal>
      </div>

      <div className="relative mt-12 lg:mt-16">
        {/* road lanes */}
        <div className="space-y-4" aria-hidden="true">
          <Lane items={[220, -220, 220, "🇹🇿", 46, "🏍️", 220, 220, -220, "🛺", 220, -60, "📍"]} speed={70} />
          <Lane items={[-220, 22, "✅", 220, -220, 22, "🏍️", -220, 220, "🪪", -220, 220]} reverse speed={80} />
          <Lane items={[-200, 230, "🛺", 230, -230, "📱", 230, -230, "🏍️", 230, -40]} speed={90} />
        </div>

        {/* hand + phone with floating callouts */}
        <div className="container-x relative mt-10 lg:absolute lg:inset-x-0 lg:-top-[300px] lg:mt-0">
          <div className="relative ml-auto w-full max-w-[600px] lg:mr-0">
            <div className="relative mx-auto w-[86%] lg:ml-auto lg:mr-0">
              <div className="hidden [mask-image:linear-gradient(to_bottom,#000_78%,transparent_97%)] lg:block">
                <Image src="/images/hero-hand.png" alt="" width={1237} height={1120} sizes="(min-width: 1024px) 520px, 80vw" className="h-auto w-full" />
              </div>

              {/* compact notification cards attached to the phone's left edge */}
              <ul className="mt-0 space-y-3 lg:mt-0 lg:space-y-0">
                {l.callouts.map((c, i) => {
                  const Icon = icons[i];
                  const pos = ["lg:right-[41%] lg:top-[13%]", "lg:right-[45%] lg:top-[32%]", "lg:right-[40%] lg:top-[51%]"][i];
                  return (
                    <Reveal as="li" key={c.title} delay={250 + i * 220} variant="right" className={`lg:absolute lg:w-[285px] ${pos}`}>
                      <div className="flex items-center gap-3 rounded-[14px] border-r-4 border-brand bg-white py-3 pl-3 pr-3.5 shadow-[0_12px_32px_rgba(11,15,13,0.16)]">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white">
                          <Icon className="size-[18px]" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-bold leading-tight text-ink">{c.title}</span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-muted">{c.body}</span>
                        </span>
                      </div>
                    </Reveal>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-20 md:pb-28" />

      {/* diagonal stripes, bottom right */}
      <div className="pointer-events-none absolute -bottom-6 right-[6%] hidden h-[150px] w-[260px] lg:block" aria-hidden="true">
        <div className="absolute inset-0 origin-bottom-right -skew-x-[35deg] bg-forest-900" />
        <div className="absolute bottom-6 right-24 h-5 w-20 -skew-x-[35deg] bg-white" />
        <div className="absolute bottom-16 right-10 h-5 w-20 -skew-x-[35deg] bg-white" />
      </div>
    </section>
  );
}
