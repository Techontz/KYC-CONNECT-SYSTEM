"use client";

import Image from "next/image";
import { Boxes, CreditCard, HeartPulse, LineChart, Store, Wallet } from "lucide-react";
import { useLang } from "../LangProvider";
import { Reveal } from "../ui";

const px = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

/** Photo + icon per phase, in the same order as content.roadmap.items. Photos: Pexels (free licence). */
const visuals = [
  { image: px("4042143"), pos: "center 30%", Icon: Boxes }, // MVP: registering on a phone
  { image: px("7362949"), pos: "70% 30%", Icon: CreditCard }, // 2A: payments & SMS
  { image: px("33679981"), pos: "30% 35%", Icon: HeartPulse }, // 2B: insurance
  { image: px("16341045"), pos: "center 45%", Icon: Wallet }, // 2C: fair finance
  { image: px("38191102"), pos: "center 40%", Icon: Store }, // 3A: garages & marketplace
  { image: px("36875803"), pos: "center 45%", Icon: LineChart }, // 3B: insights
];

const statusTone = [
  "bg-mint text-brand-700", // Now
  "bg-[#e6f0ff] text-[#2f5fb3]", // Next
  "bg-surface text-ink/70",
  "bg-surface text-ink/70",
  "bg-surface text-ink/60",
  "bg-surface text-ink/60",
];

/** Roadmap as destination-style photo cards: photo, colour band, round icon badge, two-line label and status pill. */
export function Roadmap() {
  const { t, lang } = useLang();
  const r = t.roadmap;
  const labels = lang === "sw" ? { phase: "awamu", status: "hali" } : { phase: "phase", status: "status" };

  return (
    <section id="roadmap" className="bg-white py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <h2 className="heading border-b border-line pb-2 text-[38px] text-forest-900 md:text-[64px]">{r.title}</h2>
          <p className="mt-3 max-w-[860px] text-[18px] text-forest-900 md:text-[22px]">{r.subtitle}</p>
        </Reveal>

        <ul className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {r.items.map((item, i) => {
            const { image, pos, Icon } = visuals[i];
            return (
              <Reveal as="li" key={item.phase} delay={(i % 3) * 140} variant="zoom">
                <article className="group h-full overflow-hidden rounded-[6px] bg-white shadow-[0_2px_10px_rgba(11,15,13,0.08)] transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(11,15,13,0.14)]">
                  {/* photo with colour band */}
                  <div className="relative">
                    <div className="relative h-[220px] overflow-hidden md:h-[240px]">
                      <Image
                        src={image}
                        alt=""
                        fill
                        quality={85}
                        sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ objectPosition: pos }}
                      />
                    </div>
                    <div className="h-2 bg-brand-700" />
                    <span className="absolute -bottom-6 right-5 grid size-14 place-items-center rounded-full bg-forest-900 text-white ring-4 ring-white">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                  </div>

                  {/* label row */}
                  <div className="flex items-end justify-between gap-4 px-5 pb-6 pt-11">
                    <div className="min-w-0">
                      <p className="text-[22px] font-medium leading-tight text-forest-900 md:text-[24px]">{item.title}</p>
                      <p className="mt-1 text-[17px] text-forest-900">
                        <span className="text-[15px] text-muted">{labels.phase} </span>
                        <span className="text-[22px] font-medium md:text-[24px]">{item.phase}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[15px] text-forest-900">{labels.status}</p>
                      <p className={`mt-1 rounded-[6px] px-3 py-1.5 text-[17px] font-semibold md:text-[19px] ${statusTone[i]}`}>{item.status}</p>
                    </div>
                  </div>
                  <p className="border-t border-line px-5 py-4 text-[15px] leading-relaxed text-muted">{item.body}</p>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
