"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Plus, X } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { PhoneMockup } from "../PhoneMockup";
import { Reveal } from "../ui";

/**
 * Mission as an interactive step list on a dark band: numbered pill tabs (active one filled
 * with a close icon, others with a plus), the active step's heading and text, and a phone
 * with floating panels that change with the step. Advances automatically.
 */
export function MissionSteps() {
  const { lang } = useLang();
  const m = getBands(lang).mission;
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setActive((a) => (a + 1) % m.steps.length), 6500);
    return () => window.clearTimeout(id);
  }, [active, tick, m.steps.length]);

  const choose = (i: number) => {
    setActive(i);
    setTick((t) => t + 1);
  };
  const step = m.steps[active];

  return (
    <section className="relative overflow-hidden bg-forest-900 text-white" aria-label={m.by}>
      <div className="container-x py-20 md:py-28">
        <Reveal className="max-w-[880px]">
          <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-mint-200">{m.by}</p>
          <blockquote className="mt-4 text-[24px] font-bold leading-snug md:text-[32px]">“{m.quote}”</blockquote>
        </Reveal>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
          {/* steps */}
          <ol className="space-y-4">
            {m.steps.map((st, i) => {
              const isActive = i === active;
              return (
                <li key={st.accent}>
                  <button
                    type="button"
                    onClick={() => choose(isActive ? (i + 1) % m.steps.length : i)}
                    aria-expanded={isActive}
                    className={`flex h-[54px] w-full items-center gap-3 rounded-full pl-1.5 pr-5 text-left text-[18px] transition-colors duration-300 md:text-[20px] ${
                      isActive ? "bg-brand-700 text-white" : "bg-white text-forest-900 hover:bg-mint"
                    }`}
                  >
                    <span className={`grid size-[42px] shrink-0 place-items-center rounded-full border-[1.5px] text-[18px] ${isActive ? "border-white/80" : "border-forest-900/25"}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className={isActive ? "text-mint" : "text-brand-700"}>{st.accent}</span> {st.rest}
                    </span>
                    {isActive ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                  </button>

                  <div className={`grid transition-[grid-template-rows] duration-500 ${isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <h3 className="heading pt-7 text-[36px] md:text-[48px]">
                        <span className="text-brand">{st.accent}</span> {st.rest}
                      </h3>
                      <p className="pb-4 pt-4 text-[17px] leading-relaxed text-white/90 md:text-[20px]">{st.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* phone with floating panels for the active step */}
          <div className="relative mx-auto w-full max-w-[520px] py-6">
            <PhoneMockup />
            <div key={`l-${lang}-${active}`} className="animate-slidein absolute left-0 top-[34%] hidden w-[210px] rounded-[10px] bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-md sm:block">
              <p className="text-[11px] text-white/70">{step.left[0]}</p>
              <p className="mt-0.5 text-[14px] font-semibold">{step.left[1]}</p>
            </div>
            <div key={`r-${lang}-${active}`} className="animate-slidein absolute -right-2 bottom-[18%] hidden items-center gap-2.5 rounded-[10px] bg-white p-3 text-ink shadow-chip sm:flex" style={{ animationDelay: "150ms" }}>
              <span className="grid size-8 place-items-center rounded-full bg-brand text-white">
                <BadgeCheck className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] text-muted">{step.right[0]}</span>
                <span className="block text-[14px] font-bold">{step.right[1]}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
