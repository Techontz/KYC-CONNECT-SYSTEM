"use client";

import { ArrowUpRight, Check, Info, MessageCircle } from "lucide-react";
import { PORTAL_LIVE } from "@/lib/content";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { ButtonLink, CONTACT_EMAIL, REGISTER_URL, Reveal, WHATSAPP_URL } from "../ui";

/** For Associations and For Partners, side by side. */
export function Community() {
  const { lang } = useLang();
  const { associations: a, partners: p } = getBands(lang).community;
  return (
    <section className="bg-white py-14 md:py-28">
      <div className="container-x grid gap-6 lg:grid-cols-2">
        <Reveal variant="left" className="h-full">
          <article id="associations" className="flex h-full scroll-mt-24 flex-col rounded-[24px] bg-mint p-7 md:p-10">
            <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-brand-700">{a.eyebrow}</p>
            <h2 className="heading mt-4 text-[30px] text-forest-900 md:text-[40px]">{a.title}</h2>
            <p className="mt-4 flex-1 text-[16px] leading-relaxed text-ink/80 md:text-[18px]">{a.body}</p>
            <div className="mt-7">
              <ButtonLink href={WHATSAPP_URL} external icon>
                {a.cta}
              </ButtonLink>
            </div>
          </article>
        </Reveal>

        <Reveal variant="right" className="h-full">
          <article id="partners" className="flex h-full scroll-mt-24 flex-col rounded-[24px] bg-forest-900 p-7 text-white md:p-10">
            <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-mint-200">{p.eyebrow}</p>
            <h2 className="heading mt-4 text-[30px] md:text-[40px]">{p.title}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/85 md:text-[18px]">{p.body}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {p.routes.map((r) => (
                <li key={r} className="flex items-center gap-2 text-[15px]">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex flex-1 items-start gap-2 text-[13px] leading-snug text-white/70">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {p.compliance}
            </p>
            <div className="mt-7">
              <ButtonLink href={`mailto:${CONTACT_EMAIL}?subject=BodaKonnect%20partnership`} variant="white" icon>
                {p.cta}
              </ButtonLink>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

/** Final registration invitation. */
export function FinalCta() {
  const { lang, t } = useLang();
  const f = getBands(lang).community.final;
  return (
    <section className="bg-white px-4 pb-16 md:px-10">
      <Reveal className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 rounded-[24px] bg-brand p-8 text-white md:flex-row md:items-center md:p-12">
        <div className="max-w-[640px]">
          <h2 className="heading text-[32px] md:text-[44px]">{f.title}</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/95 md:text-[18px]">{PORTAL_LIVE ? f.live : f.soon}</p>
        </div>
        <div className="shrink-0">
          <a href={REGISTER_URL} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-forest transition hover:bg-mint">
            {t.hero.primary}
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </a>
          <a href="#contact" className="mt-3 flex items-center gap-2 text-[14px] text-white/95 underline underline-offset-4">
            <MessageCircle className="size-4" aria-hidden="true" />
            {f.help}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
