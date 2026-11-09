"use client";

import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PORTAL_LIVE } from "@/lib/content";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { COMPANY, CONTACT_EMAIL, LOGIN_URL, Logo, REGISTER_URL, WHATSAPP_URL } from "../ui";

/** Footer as a dark rounded card sitting inside the white page. */
export function Footer() {
  const { lang, t } = useLang();
  const f = getBands(lang).footer;
  const year = new Date().getFullYear();
  const linkCls = "text-[16px] text-white/90 transition hover:text-brand";
  const explore = [
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#associations", label: t.nav.associations },
    { href: "#partners", label: t.nav.partners },
    { href: "#updates", label: t.nav.updates },
  ];

  return (
    <footer id="contact" className="scroll-mt-24 bg-white px-4 md:px-10">
      <div className="mx-auto max-w-[1200px] rounded-t-[18px] bg-forest-900 px-6 pb-8 pt-14 text-white md:px-11">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.7fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-6 text-[18px] font-bold">{f.tagline}</p>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/85">{f.operated}</p>
            <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-white/65">{f.dates}</p>
            <a href={COMPANY.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[15px] text-brand hover:underline">
              {COMPANY.websiteLabel}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div>
            <nav aria-label={f.explore}>
              <p className="text-[18px] font-bold">{f.explore}</p>
              <ul className="mt-4 space-y-3">
                {explore.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className={linkCls}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-8 text-[18px] font-bold">{f.account}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a href={REGISTER_URL} className={linkCls}>
                  {t.nav.register}
                </a>
              </li>
              {PORTAL_LIVE && (
                <li>
                  <a href={LOGIN_URL} className={linkCls}>
                    {t.nav.login}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-[18px] font-bold">{f.contact}</p>
            <ul className="mt-4 space-y-3 text-[16px] text-white/90">
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-brand">
                  <Phone className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {COMPANY.phone}
                    <span className="block text-[13px] text-white/60">{f.phoneLabel}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-brand">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
                {COMPANY.office}
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-1 size-4 shrink-0" aria-hidden="true" />
                {f.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/15 pt-7 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-7 gap-y-2 text-[15px] text-white/90">
            <li>
              <a href="#faq" className="hover:text-brand">
                {f.privacy}
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-brand">
                {f.terms}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}?subject=Data%20rights%20request`} className="hover:text-brand">
                {f.data}
              </a>
            </li>
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                {f.complaints}
              </a>
            </li>
          </ul>
          <p className="text-[14px] text-white/70">{f.copyright.replace("{year}", String(year))}</p>
        </div>
      </div>
    </footer>
  );
}
