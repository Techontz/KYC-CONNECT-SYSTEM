"use client";

import { BadgeCheck, Bike, ChevronRight, MapPin, Users } from "lucide-react";
import { useLang } from "./LangProvider";

/** A stylised BodaKonnect rider screen, rendered in pure HTML/CSS. */
export function PhoneMockup({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const p = t.how.phone;
  return (
    <div
      className={`relative mx-auto w-[280px] rounded-[44px] border-[10px] border-[#101413] bg-[#101413] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:w-[300px] ${className}`}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#101413]" />
      <div className="overflow-hidden rounded-[34px] bg-surface">
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-ink">
          <span>9:41</span>
          <span className="flex gap-1">
            <span className="h-2.5 w-4 rounded-sm bg-ink/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/80" />
          </span>
        </div>

        <div className="bg-forest px-5 pb-12 pt-6 text-white">
          <p className="text-[12px] text-mint-200">BodaKonnect</p>
          <p className="mt-1 text-[20px] font-bold tracking-tight">{p.greeting} 👋</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[11px] font-bold">
            <BadgeCheck className="size-3.5" /> {p.status}
          </div>
        </div>

        <div className="-mt-8 space-y-3 px-4 pb-6">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-muted">{p.completeness}</span>
              <span className="font-bold text-brand-700">100%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-mint">
              <div className="h-2 w-full rounded-full bg-brand" />
            </div>
            <p className="mt-3 text-[11px] text-muted">ID</p>
            <p className="font-mono text-[14px] font-bold tracking-wide text-ink">BC-DOD-000214</p>
          </div>

          {[
            { icon: Users, k: p.group, v: "Jamatini" },
            { icon: MapPin, k: "Kijiwe", v: "Majengo Stand" },
            { icon: Bike, k: p.vehicle, v: "MC 482 DFT" },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
              <span className="grid size-9 place-items-center rounded-xl bg-mint text-brand-700">
                <Icon className="size-4" />
              </span>
              <span className="flex-1">
                <span className="block text-[11px] text-muted">{k}</span>
                <span className="block text-[13px] font-bold text-ink">{v}</span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </div>
          ))}

          <div className="rounded-full bg-brand py-3 text-center text-[13px] font-bold text-white">{p.action}</div>
        </div>
      </div>
    </div>
  );
}
