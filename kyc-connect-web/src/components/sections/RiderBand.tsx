"use client";

import Image from "next/image";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { REGISTER_URL, Reveal } from "../ui";

/** Rider spotlight: cut-out rider on an oval platform, outlined pill tags, two buttons. */
export function RiderBand() {
  const { lang, t } = useLang();
  const r = getBands(lang).rider;
  return (
    <section className="bg-[#eff1f3]">
      <div className="container-x grid items-center gap-12 py-14 md:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal variant="zoom" className="relative mx-auto w-full max-w-[460px] pb-6">
          <Image src="/images/rider.png" alt="" width={795} height={1193} sizes="(min-width: 1024px) 340px, 60vw" className="relative z-10 mx-auto h-auto w-[50%] sm:w-[66%]" />
          {/* oval platform */}
          <div className="absolute inset-x-0 bottom-0 z-0 h-[52px]" aria-hidden="true">
            <div className="absolute inset-0 rounded-[50%] bg-forest" />
            <div className="absolute inset-x-[16%] top-[18%] bottom-[22%] rounded-[50%] bg-mint-200" />
          </div>
        </Reveal>

        <Reveal variant="right">
          <h2 className="heading text-[36px] text-[#2b2b2b] md:text-[52px]">{r.title}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {r.chips.map((c) => (
              <li key={c} className="rounded-full border border-brand-700/80 px-3 py-1 text-[14px] font-normal text-brand-700 md:text-[16px]">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[600px] text-[16px] leading-relaxed text-[#3a3a3a] md:text-[18px]">{r.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#how" className="inline-flex h-[46px] items-center rounded-[6px] bg-forest-900 px-5 text-[15px] font-medium text-white transition hover:bg-forest">
              {r.learn}
            </a>
            <a href={REGISTER_URL} className="inline-flex h-[46px] items-center rounded-[6px] border border-forest-900 px-5 text-[15px] text-forest-900 transition hover:bg-forest-900 hover:text-white">
              {t.hero.primary}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
