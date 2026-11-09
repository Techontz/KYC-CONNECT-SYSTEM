"use client";

import Image from "next/image";
import { Bike, KeyRound, MapPin } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { ButtonLink, REGISTER_URL, Reveal } from "../ui";

/** Vertical "road" divider: three lanes of dashes with small vehicle icons. */
function RoadLanes() {
  const lane = (colour: string, pattern: number[], offset = 0) => (
    <div className="flex h-full w-[18px] flex-col gap-[10px]" style={{ paddingTop: offset }}>
      {pattern.map((h, i) => (
        <span key={i} className="w-full shrink-0 rounded-[2px]" style={{ height: h, background: colour }} />
      ))}
    </div>
  );
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 gap-[10px] overflow-hidden lg:flex" aria-hidden="true">
      {lane("#1f3e35", [70, 70, 70, 22, 70, 70, 70, 70, 34, 70, 70, 70, 70, 70])}
      <div className="relative">
        {lane("#39b54a", [64, 64, 64, 64, 64, 14, 64, 64, 64, 64, 64, 64, 64], 18)}
        <span className="absolute left-1/2 top-[44%] grid size-6 -translate-x-1/2 place-items-center rounded-full bg-white text-forest"><Bike className="size-3.5" /></span>
        <span className="absolute left-1/2 top-[72%] grid size-6 -translate-x-1/2 place-items-center rounded-full bg-white text-forest"><MapPin className="size-3.5" /></span>
      </div>
      {lane("#14291f", [90, 90, 90, 90, 90, 90, 90, 90, 90, 90], 40)}
    </div>
  );
}

export function VehicleBand() {
  const { lang, t } = useLang();
  const v = getBands(lang).vehicle;
  return (
    <section className="relative overflow-hidden bg-[#d9ece3]">
      <RoadLanes />
      <div className="container-x relative grid items-center gap-14 py-14 md:py-28 lg:grid-cols-2 lg:gap-28">
        <Reveal variant="left">
          <h2 className="heading text-[40px] text-forest md:text-[60px]">
            <span className="text-brand-700">{v.accent}</span> {v.title}
          </h2>
          <p className="mt-7 max-w-[560px] text-[18px] leading-relaxed text-forest md:text-[21px]">
            {v.before}
            <a href="#services" className="font-medium text-brand-700 hover:underline">
              {v.link}
            </a>
            {v.after}
          </p>
          <ButtonLink href={REGISTER_URL} icon className="mt-10">
            {t.hero.primary}
          </ButtonLink>
        </Reveal>

        <Reveal variant="right">
          <div className="relative mx-auto flex aspect-[5/4] w-full max-w-[520px] items-center justify-center rounded-[22px] bg-[#f2f5f3] p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <Image src="/images/bajaji.png" alt="" width={1324} height={1141} sizes="(min-width: 1024px) 460px, 80vw" className="h-auto w-[92%] drop-shadow-[0_18px_18px_rgba(0,0,0,0.18)]" />
            <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-chip">
              <span className="grid size-9 place-items-center rounded-xl bg-mint text-brand-700">
                <KeyRound className="size-4" aria-hidden="true" />
              </span>
              <span className="text-[13px] leading-tight">
                <span className="block text-muted">MC 482 DFT</span>
                <span className="block font-bold text-ink">{lang === "sw" ? "Mmiliki ≠ Dereva" : "Owner ≠ Operator"}</span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
