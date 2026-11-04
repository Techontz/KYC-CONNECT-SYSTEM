"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Bike, Building2, Check, ClipboardCheck, Lock, ShieldCheck, Sparkles, UserCog, Users } from "lucide-react";
import { useLang } from "../LangProvider";
import { Eyebrow, Reveal } from "../ui";

const px = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

/** Per-role visuals and access rules (PRD section 2). Photos: Pexels (free licence). */
const extras = {
  rider: {
    Icon: Bike,
    image: px("16341045"),
    pos: "30% 35%",
    en: { scope: "Own profile only", limit: "Cannot approve own verification or see another rider's record.", stat: ["Profile", "100% complete"] },
    sw: { scope: "Wasifu wake tu", limit: "Hawezi kuidhinisha uhakiki wake wala kuona rekodi ya dereva mwingine.", stat: ["Wasifu", "Umekamilika 100%"] },
  },
  leader: {
    Icon: Users,
    image: px("37483951"),
    pos: "55% 35%",
    en: { scope: "Assigned group only", limit: "No access to identity documents or members outside their group.", stat: ["Jamatini", "48 members"] },
    sw: { scope: "Kikundi chake tu", limit: "Hana ufikiaji wa nyaraka za utambulisho wala wanachama nje ya kikundi chake.", stat: ["Jamatini", "Wanachama 48"] },
  },
  assoc: {
    Icon: Building2,
    image: px("36875803"),
    pos: "center 40%",
    en: { scope: "Own association", limit: "Cannot access other associations or bulk-export personal data by default.", stat: ["Verification backlog", "12 cases"] },
    sw: { scope: "Chama chake", limit: "Hawezi kufikia vyama vingine wala kutoa taarifa binafsi kwa wingi bila idhini.", stat: ["Foleni ya uhakiki", "Kesi 12"] },
  },
  agent: {
    Icon: ClipboardCheck,
    image: px("4042143"),
    pos: "center 30%",
    en: { scope: "Assigned organisation", limit: "Cannot self-approve verification. Every action is logged.", stat: ["Duplicate check", "No match found"] },
    sw: { scope: "Taasisi aliyopangiwa", limit: "Hawezi kujiidhinishia uhakiki. Kila hatua inarekodiwa.", stat: ["Ukaguzi wa marudio", "Hakuna marudio"] },
  },
  verifier: {
    Icon: ShieldCheck,
    image: px("5439400"),
    pos: "center 35%",
    en: { scope: "Review queue", limit: "Must never decide a case they submitted. No unlogged status changes.", stat: ["Separation of duties", "Reviewer ≠ Submitter"] },
    sw: { scope: "Foleni ya uhakiki", limit: "Hawezi kuamua kesi aliyowasilisha mwenyewe. Hakuna mabadiliko yasiyorekodiwa.", stat: ["Mgawanyo wa majukumu", "Mhakiki ≠ Mwasilishaji"] },
  },
  admin: {
    Icon: UserCog,
    image: px("9301502"),
    pos: "center 40%",
    en: { scope: "Platform, fully audited", limit: "Privileged actions need strong sign-in and are always audit-logged.", stat: ["Audit trail", "Every action logged"] },
    sw: { scope: "Mfumo mzima, unakaguliwa", limit: "Hatua nyeti zinahitaji uthibitisho imara na zinarekodiwa kila mara.", stat: ["Kumbukumbu za ukaguzi", "Kila hatua imerekodiwa"] },
  },
} as const;

type RoleKey = keyof typeof extras;
const INTERVAL = 7000;

export function Roles() {
  const { t, lang } = useLang();
  const r = t.roles;
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % r.items.length), INTERVAL);
    return () => window.clearTimeout(id);
  }, [active, tick, hover, r.items.length]);

  const choose = (i: number) => {
    setActive(i);
    setTick((x) => x + 1);
  };

  const current = r.items[active];
  const cx = extras[current.key as RoleKey];
  const info = cx[lang];
  const labels = lang === "sw" ? { access: "Ufikiaji", can: "Anachoweza kufanya" } : { access: "Access", can: "What they can do" };

  return (
    <section id="roles" className="bg-white py-20 md:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <Eyebrow>{r.eyebrow}</Eyebrow>
          <h2 className="heading mt-5 text-[34px] text-forest-900 md:text-[48px]">{r.title}</h2>
          <p className="mt-4 text-[16px] text-muted md:text-[18px]">{r.subtitle}</p>
        </Reveal>

        <Reveal className="mt-12 grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-8" variant="zoom">
          {/* role menu */}
          <div
            role="tablist"
            aria-label={r.title}
            aria-orientation="vertical"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {r.items.map((item, i) => {
              const ex = extras[item.key as RoleKey];
              const selected = i === active;
              return (
                <button
                  key={item.key}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="role-panel"
                  onClick={() => choose(i)}
                  className={`relative flex min-w-[230px] shrink-0 items-center gap-3.5 overflow-hidden rounded-[16px] px-4 py-3.5 text-left transition-all duration-300 lg:min-w-0 ${
                    selected ? "bg-white shadow-[0_10px_30px_rgba(11,15,13,0.10)] ring-1 ring-line" : "hover:bg-surface"
                  }`}
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-[12px] transition-colors ${selected ? "bg-brand text-white" : "bg-mint text-brand-700"}`}>
                    <ex.Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-bold leading-tight text-forest-900">{item.name}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{ex[lang].scope}</span>
                  </span>
                  {selected && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-mint">
                      <span
                        key={`${active}-${tick}`}
                        className="block h-full animate-progress bg-brand"
                        style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: hover ? "paused" : "running" }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* role panel */}
          <div id="role-panel" role="tabpanel" className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-forest-900 lg:min-h-[600px]">
            {r.items.map((item, i) => {
              const ex = extras[item.key as RoleKey];
              return (
                <Image
                  key={item.key}
                  src={ex.image}
                  alt=""
                  fill
                  quality={85}
                  sizes="(min-width: 1024px) 800px, 100vw"
                  className={`object-cover transition-[opacity,transform] duration-[1200ms] ${i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
                  style={{ objectPosition: ex.pos }}
                />
              );
            })}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a14]/90 via-[#0b1a14]/25 to-transparent" aria-hidden="true" />

            {/* access badge */}
            <div
              key={`a-${active}-${lang}`}
              className="animate-slidein absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/30 backdrop-blur-md md:left-7 md:top-7"
            >
              <Lock className="size-3.5" aria-hidden="true" />
              {labels.access}: {info.scope}
            </div>

            {/* floating stat */}
            <div
              key={`s-${active}-${lang}`}
              className="animate-slidein absolute right-5 top-5 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-chip sm:flex md:right-7 md:top-7"
              style={{ animationDelay: "120ms" }}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-mint text-brand-700">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] text-muted">{info.stat[0]}</span>
                <span className="block text-[14px] font-bold text-ink">{info.stat[1]}</span>
              </span>
            </div>

            {/* glass content card */}
            <div
              key={`c-${active}-${lang}`}
              className="animate-slidein absolute inset-x-4 bottom-4 rounded-[22px] bg-white/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md md:inset-x-7 md:bottom-7 md:p-7"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[12px] bg-brand text-white">
                  <cx.Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-700">{labels.can}</p>
                  <h3 className="text-[22px] font-bold leading-tight text-forest-900 md:text-[26px]">{current.name}</h3>
                </div>
              </div>
              <ul className="mt-5 grid gap-2.5 md:grid-cols-3 md:gap-4">
                {current.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[15px] leading-snug text-ink/85">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white">
                      <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-[13px] text-muted">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {info.limit}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
