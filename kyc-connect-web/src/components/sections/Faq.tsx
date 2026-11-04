"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { Reveal } from "../ui";

/** FAQ as stacked, bordered cards with large bold questions. */
export function Faq() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  const f = getBands(lang).faq;
  return (
    <section id="faq" className="bg-white py-20 md:py-28">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="heading text-[30px] text-forest-900 md:text-[40px]">{f.title}</h2>
          <p className="mx-auto mt-3 max-w-[700px] text-[16px] text-muted md:text-[18px]">{f.subtitle}</p>
        </Reveal>
        <div className="mx-auto mt-10 max-w-[960px] space-y-3">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 70}>
                <div className="rounded-[14px] border border-[#e1e5e3] bg-white">
                  <h3>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-[17px] font-bold leading-snug text-forest-900 md:px-6 md:text-[20px]"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      {item.q}
                      <ChevronDown className={`size-5 shrink-0 text-forest-900 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`faq-${i}`} role="region" className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <p className="overflow-hidden px-5 text-[15px] leading-[1.7] text-ink/80 md:px-6 md:text-[17px]">
                      <span className="block pb-5">{item.a}</span>
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
