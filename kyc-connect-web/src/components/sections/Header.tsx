"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLang } from "../LangProvider";
import { LangSelect } from "../LangSelect";
import { ButtonLink, Logo, SYSTEM_URL } from "../ui";

/**
 * Header matched to the reference site: 80px white bar, 1280px content width, logo left,
 * centred 18px/500 menu (dropdown chevrons, last link underlined), bordered language box right.
 */
export function Header() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const platformItems = t.features.items.map((f) => ({ href: "#platform", label: f.title }));
  const links = [
    { href: "#how", label: t.nav.how },
    { href: "#roles", label: t.nav.roles },
    { href: "#trust", label: t.nav.trust },
    { href: "#roadmap", label: t.nav.roadmap },
    { href: "#faq", label: t.nav.faq },
  ];
  const linkCls = "whitespace-nowrap text-[18px] font-medium leading-[25px] text-black transition-colors hover:text-brand";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-4 md:px-10 xl:px-20">
          <a href="#top" aria-label="KYC Connect home" className="shrink-0">
            <Logo />
          </a>

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-8">
              <li ref={menuRef} className="relative">
                <button
                  type="button"
                  className={`${linkCls} inline-flex items-center gap-2`}
                  aria-expanded={menu}
                  aria-haspopup="true"
                  onClick={() => setMenu((m) => !m)}
                >
                  {t.nav.platform}
                  <ChevronDown className={`size-[18px] transition-transform ${menu ? "rotate-180" : ""}`} strokeWidth={2.25} aria-hidden="true" />
                </button>
                {menu && (
                  <ul className="absolute left-1/2 top-full mt-5 w-64 -translate-x-1/2 rounded-[12px] border border-line bg-white p-2 shadow-chip">
                    {platformItems.map((i) => (
                      <li key={i.label}>
                        <a href={i.href} onClick={() => setMenu(false)} className="block rounded-[8px] px-3 py-2.5 text-[16px] text-black hover:bg-mint-50 hover:text-brand-700">
                          {i.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={SYSTEM_URL} className={`${linkCls} underline decoration-[1.5px] underline-offset-[6px]`}>
                  BodaConnect OS
                </a>
              </li>
            </ul>
          </nav>

          <div className="hidden xl:block">
            <LangSelect />
          </div>

          <button
            type="button"
            className="grid size-11 place-items-center rounded-[8px] text-black xl:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="size-6" />
          </button>
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
            {[{ href: "#platform", label: t.nav.platform }, ...links].map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-4 text-[22px] font-medium text-black">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="space-y-3 p-4 md:px-10">
            <LangSelect full />
            <ButtonLink href={SYSTEM_URL} className="w-full">
              {t.nav.open}
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
