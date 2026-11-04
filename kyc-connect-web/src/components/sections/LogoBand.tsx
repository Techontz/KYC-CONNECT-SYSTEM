"use client";

import { useLang } from "../LangProvider";
import { Reveal } from "../ui";

/**
 * Logo band in the style of an "investors" strip.
 *
 * These are the banks and mobile-money services riders already use and that BodaKonnect is
 * being built to connect to. They are NOT investors or signed partners, so the copy says so.
 * When a partnership is signed, move it to a "Partners" heading and update the note.
 * Logo files: /public/partners (official files from the companies' websites or Wikimedia Commons).
 */
const logos = [
  { name: "CRDB Bank", src: "/partners/crdb.svg", h: 58 },
  { name: "M-Pesa", src: "/partners/mpesa.svg", h: 66 },
  { name: "NBC Bank", src: "/partners/nbc.svg", h: 72 },
  { name: "Airtel Money", src: "/partners/airtel.svg", h: 70 },
  { name: "Equity Bank", src: "/partners/equity.png", h: 62 },
  { name: "Yas", src: "/partners/yas.svg", h: 62 },
  { name: "Absa", src: "/partners/absa.svg", h: 66 },
  { name: "Halotel", src: "/partners/halotel.png", h: 38 },
];

const copy = {
  en: {
    title: "Built for Tanzania's financial services",
    body: "The banks and mobile-money services riders use every day, which BodaKonnect is being built to connect to.",
    note: "Logos are shown to illustrate planned integrations. They do not indicate a partnership or endorsement until an agreement is signed.",
  },
  sw: {
    title: "Imejengwa kwa huduma za kifedha za Tanzania",
    body: "Benki na huduma za pesa kwa simu ambazo madereva wanazitumia kila siku, na ambazo BodaKonnect inajengwa kuunganishwa nazo.",
    note: "Nembo zinaonyesha miunganiko inayopangwa. Hazimaanishi ushirikiano wala uidhinishaji hadi mkataba usainiwe.",
  },
};

export function LogoBand() {
  const { lang } = useLang();
  const c = copy[lang];
  const loop = [...logos, ...logos];

  return (
    <section className="bg-white py-20 md:py-28" aria-labelledby="logo-band-title">
      <Reveal className="container-x text-center">
        <h2 id="logo-band-title" className="heading mx-auto max-w-[900px] text-[36px] md:text-[60px]">
          {c.title}
        </h2>
        <p className="mx-auto mt-5 max-w-[720px] text-[17px] text-ink/80 md:text-[18px]">{c.body}</p>
      </Reveal>

      <div className="relative mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max animate-marquee items-center gap-16 hover:[animation-play-state:paused] md:gap-24">
          {loop.map((l, i) => (
            <li key={`${l.name}-${i}`} className="shrink-0" aria-hidden={i >= logos.length}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={i < logos.length ? l.name : ""} style={{ height: l.h }} className="w-auto select-none" draggable={false} />
            </li>
          ))}
        </ul>
      </div>

      <p className="container-x mt-12 text-center text-[13px] text-muted">{c.note}</p>
    </section>
  );
}
