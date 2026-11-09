"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PORTAL_LIVE } from "@/lib/content";
import { useLang } from "../LangProvider";
import { LangSelect } from "../LangSelect";
import { ButtonLink, LOGIN_URL, Logo, REGISTER_URL } from "../ui";

/** 80px white bar: logo, section links, registration button and language box. */
export function Header() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const links = [
    { href: "#top", label: t.nav.home },
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#associations", label: t.nav.associations },
    { href: "#partners", label: t.nav.partners },
    { href: "#updates", label: t.nav.updates },
    { href: "#contact", label: t.nav.contact },
  ];
  const linkCls = "whitespace-nowrap text-[15px] font-medium leading-[25px] text-black transition-colors hover:text-brand min-[90rem]:text-[18px]";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-5 px-4 md:px-10 min-[90rem]:px-20">
          <a href="#top" aria-label="BodaKonnect home" className="shrink-0">
            <Logo />
          </a>

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-5 min-[90rem]:gap-8">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            {PORTAL_LIVE && (
              <a href={LOGIN_URL} className={linkCls}>
                {t.nav.login}
              </a>
            )}
            <a href={REGISTER_URL} className="inline-flex h-[43px] items-center whitespace-nowrap rounded-[8px] bg-brand px-4 text-[15px] font-bold text-white transition hover:bg-brand-600">
              {t.nav.register}
            </a>
            <LangSelect />
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <a href={REGISTER_URL} className="inline-flex h-10 items-center whitespace-nowrap rounded-[8px] bg-brand px-3.5 text-[14px] font-bold text-white">
              {t.nav.register}
            </a>
            <button type="button" className="grid size-11 place-items-center rounded-[8px] text-black" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-20 items-center justify-between px-4 md:px-10">
            <Logo />
            <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4 md:px-10" aria-label="Mobile">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-4 text-[22px] font-medium text-black">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="space-y-3 p-4 md:px-10">
            <LangSelect full />
            {PORTAL_LIVE && (
              <ButtonLink href={LOGIN_URL} variant="outline" className="w-full">
                {t.nav.login}
              </ButtonLink>
            )}
            <ButtonLink href={REGISTER_URL} className="w-full">
              {t.nav.register}
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
