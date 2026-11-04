"use client";

import { ArrowUpRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getBands } from "@/lib/bands";
import { useLang } from "../LangProvider";
import { COMPANY, CONTACT_EMAIL, Logo, SYSTEM_URL } from "../ui";

/** Footer as a dark rounded card sitting inside the white page. */
export function Footer() {
  const { lang } = useLang();
  const f = getBands(lang).footer;
  const year = new Date().getFullYear();
  const linkCls = "text-[17px] text-white/90 transition hover:text-brand";

  return (
    <footer className="bg-white px-4 md:px-10">
      <div className="mx-auto max-w-[1200px] rounded-t-[18px] bg-forest-900 px-6 pb-8 pt-14 text-white md:px-11">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.8fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-8 max-w-[440px] text-[17px] leading-relaxed text-white/90">{f.tagline}</p>
            <p className="mt-8 text-[17px] leading-relaxed text-white/90">
              {f.copyright.replace("{year}", String(year))}
              <br />
              {f.powered} <span className="text-brand">{COMPANY.brela}</span>
              <br />
              {f.dates}
              <br />
              {f.rights}
            </p>
          </div>

          <nav aria-label={f.company}>
            <p className="text-[20px] font-bold">{f.company}</p>
            <ul className="mt-5 space-y-4">
              {f.companyLinks.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className={linkCls}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a href={`${SYSTEM_URL}/login`} className="inline-flex items-center gap-2 rounded-[8px] bg-brand-700 px-3 py-2 text-[16px] font-medium text-white transition hover:bg-brand">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  {f.staff}
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <nav aria-label={f.resources}>
              <p className="text-[20px] font-bold">{f.resources}</p>
              <ul className="mt-5 space-y-4">
                {f.resourceLinks.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className={linkCls}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-9 text-[20px] font-bold">{f.contact}</p>
            <ul className="mt-4 space-y-3 text-[17px] text-white/90">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-brand">
                  <Mail className="size-4" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-brand">
                  <Phone className="size-4" aria-hidden="true" />
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
                {COMPANY.office}
              </li>
            </ul>
            <a href={SYSTEM_URL} className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[16px] font-bold text-white transition hover:bg-brand-600">
              {f.open}
              <ArrowUpRight className="size-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-7 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[17px] text-white/90">
            <li>
              <a href={`${SYSTEM_URL}/privacy`} className="hover:text-brand">
                {f.privacy}
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-brand">
                {f.terms}
              </a>
            </li>
            <li>
              <a href="#trust" className="hover:text-brand">
                {f.data}
              </a>
            </li>
          </ul>
          <a href={COMPANY.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[15px] text-white/75 hover:text-white">
            <span aria-hidden="true">🇹🇿</span>
            {f.madeIn}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
