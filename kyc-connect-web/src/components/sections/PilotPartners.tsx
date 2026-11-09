"use client";

import { useEffect, useState } from "react";
import { BusFront, FileBadge, GraduationCap, Handshake, IdCard, Info, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { Reveal } from "../ui";

type Tile = { kind: "org" | "ward" | "more"; name: string; sub: string };
const PER_PAGE = 8;

/** Icon per collaborator, showing the area of work. These are not the organisations' own logos. */
const roleIcons: Record<string, { Icon: LucideIcon; tone: string }> = {
  UMAPIDO: { Icon: Users, tone: "bg-mint text-brand-700" },
  VETA: { Icon: GraduationCap, tone: "bg-[#e6f0ff] text-[#2f5fb3]" },
  RITA: { Icon: FileBadge, tone: "bg-[#fff1cc] text-[#a86b00]" },
  NIDA: { Icon: IdCard, tone: "bg-[#e4f6f5] text-[#14807a]" },
  LATRA: { Icon: BusFront, tone: "bg-[#fde8e8] text-[#b3261e]" },
  "MUA Insurance": { Icon: ShieldCheck, tone: "bg-[#eee8fb] text-[#5b3fb0]" },
};

/** Two-tone heading, stat cards and a paged logo-tile grid of the real pilot partners and target wards. */
export function PilotPartners() {
  const { lang } = useLang();
  const p = getBands(lang).pilot;

  const tiles: Tile[] = p.collaborators.map(([name, sub], i) => ({
    kind: i === 0 ? "org" : i === p.collaborators.length - 1 ? "more" : "ward",
    name,
    sub,
  }));
  const pages = Math.ceil(tiles.length / PER_PAGE);
  const [page, setPage] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover) return;
    const id = window.setTimeout(() => setPage((x) => (x + 1) % pages), 5000);
    return () => window.clearTimeout(id);
  }, [page, hover, pages]);

  const Tile = ({ t }: { t: Tile }) => (
    <li className="flex h-[150px] min-w-0 flex-col items-center justify-center gap-2 bg-white px-2 py-3 text-center md:h-[180px]">
      {t.kind === "org" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/bodakonnect-logo.png" alt="" className="h-9 w-auto" />
      ) : t.kind === "ward" ? (
        (() => {
          const { Icon, tone } = roleIcons[t.name];
          return (
            <span className={`grid size-12 place-items-center rounded-full ${tone}`}>
              <Icon className="size-6" aria-hidden="true" />
            </span>
          );
        })()
      ) : (
        <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-dashed border-forest-900/30 text-forest-900/60">
          <Handshake className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className={`w-full font-bold uppercase leading-tight tracking-tight text-forest-900 ${t.kind === "org" ? "text-[14px] md:text-[15px]" : "text-[12px] md:text-[13px]"}`}>{t.name}</span>
      <span className="w-full text-[11px] leading-tight text-muted">{t.sub}</span>
    </li>
  );

  return (
    <section id="updates" className="bg-[#eff1f3] py-14 md:py-28">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[1fr_1.05fr]">
        <Reveal variant="left">
          <h2 className="heading text-[34px] text-[#2b2b2b] md:text-[48px]">
            <span>{p.accent}</span> <span className="text-brand-700">{p.title}</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-[#2b2b2b] md:text-[20px]">{p.body}</p>
          <p className="mt-7 text-[18px] font-bold text-forest-900">{p.featureTitle}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {p.stats.map((s) => (
              <div key={s.title} className="bg-white px-4 py-5 text-center">
                <p className="text-[32px] text-[#2b2b2b]">{s.value}</p>
                <p className="mt-1 text-[16px] text-brand-700">{s.title}</p>
                <p className="mt-1 text-[14px] leading-snug text-[#2b2b2b]">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <svg viewBox="0 0 30 30" className="size-16 overflow-hidden rounded-full" aria-hidden="true">
              <rect width="30" height="30" fill="#1eb53a" />
              <path d="M30 0v30H0z" fill="#00a3dd" />
              <path d="M0 30 30 0" stroke="#fcd116" strokeWidth="12" />
              <path d="M0 30 30 0" stroke="#000" strokeWidth="7.5" />
            </svg>
            <span className="text-[17px] font-medium text-[#2b2b2b]">{p.place}</span>
          </div>
        </Reveal>

        <Reveal variant="right">
          <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
                {Array.from({ length: pages }).map((_, pi) => (
                  <ul key={pi} className="grid w-full min-w-0 shrink-0 grid-cols-[repeat(2,minmax(0,1fr))] content-start gap-2.5 sm:grid-cols-[repeat(4,minmax(0,1fr))]" aria-hidden={pi !== page}>
                    {tiles.slice(pi * PER_PAGE, pi * PER_PAGE + PER_PAGE).map((t) => (
                      <Tile key={t.name} t={t} />
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            <p className="mt-5 flex items-start gap-2 text-[13px] leading-snug text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {p.note}
            </p>
            <div className={`mt-5 justify-center gap-2.5 ${pages > 1 ? "flex" : "hidden"}`}>
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-label={`${i + 1} / ${pages}`}
                  aria-current={i === page}
                  className={`size-3.5 rounded-full transition-colors ${i === page ? "bg-brand-700" : "bg-white hover:bg-mint-200"}`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
