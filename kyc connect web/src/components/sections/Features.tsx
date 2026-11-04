"use client";

import { BadgeCheck, Bike, ClipboardCheck, Info, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useLang } from "../LangProvider";
import { ButtonLink, Chip, Eyebrow, Reveal, SYSTEM_URL } from "../ui";

function RegistrationVisual() {
  const steps = ["Taarifa binafsi", "Chama & kikundi", "Chombo", "Faragha", "Hakiki"];
  return (
    <div className="w-full max-w-[260px] rounded-2xl bg-white p-4 shadow-card">
      <p className="text-[12px] font-semibold text-muted">Usajili · Hatua 4/5</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 text-[13px]">
            <span
              className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                i < 3 ? "bg-brand text-white" : i === 3 ? "bg-forest text-white" : "bg-line text-muted"
              }`}
            >
              {i < 3 ? "✓" : i + 1}
            </span>
            <span className={i === 3 ? "font-bold text-ink" : "text-muted"}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function VehicleVisual() {
  return (
    <div className="w-full max-w-[260px] space-y-2 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Bike className="size-5 text-brand-700" />
        <span className="font-mono text-[14px] font-bold">MC 482 DFT</span>
      </div>
      {[
        { r: "Owner · Mmiliki", n: "Halima S.", c: "bg-sky-100 text-sky-700", icon: KeyRound },
        { r: "Operator · Dereva", n: "Juma M.", c: "bg-mint text-brand-700", icon: Bike },
      ].map(({ r, n, c, icon: Icon }) => (
        <div key={r} className="flex items-center gap-3 pt-1">
          <span className={`grid size-8 place-items-center rounded-full ${c}`}>
            <Icon className="size-4" />
          </span>
          <span>
            <span className="block text-[11px] text-muted">{r}</span>
            <span className="block text-[13px] font-bold">{n}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function RosterVisual() {
  const rows = [
    ["Juma Mwakyusa", "Verified"],
    ["Rehema Kibwana", "Review"],
    ["Baraka Ndege", "Verified"],
    ["Said Mrisho", "Draft"],
  ];
  const tone: Record<string, string> = {
    Verified: "bg-mint text-brand-700",
    Review: "bg-amber-100 text-amber-800",
    Draft: "bg-line text-muted",
  };
  return (
    <div className="w-full max-w-[300px] rounded-2xl bg-white p-4 shadow-card">
      <p className="text-[12px] font-semibold text-muted">Jamatini · Majengo Stand</p>
      <ul className="mt-2 divide-y divide-line">
        {rows.map(([n, s]) => (
          <li key={n} className="flex items-center justify-between py-2 text-[13px]">
            <span className="font-semibold">{n}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone[s]}`}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerifyVisual() {
  const checks = [
    ["Phone · Simu", "OTP"],
    ["Membership · Uanachama", "Association"],
    ["Vehicle · Chombo", "Document"],
  ];
  return (
    <div className="w-full max-w-[260px] rounded-2xl bg-white p-4 shadow-card">
      <p className="text-[12px] font-semibold text-muted">Case #VC-0391</p>
      <ul className="mt-2 space-y-2.5">
        {checks.map(([k, m]) => (
          <li key={k} className="flex items-start gap-2.5 text-[13px]">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              <span className="block font-bold">{k}</span>
              <span className="block text-[11px] text-muted">Method: {m}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] text-muted">Reviewer ≠ Submitter ✓</p>
    </div>
  );
}

export function Features() {
  const { t } = useLang();
  const f = t.features;
  const visuals = [RegistrationVisual, VehicleVisual, RosterVisual, VerifyVisual];
  const chipIcons = [UserPlus, Bike, Users, ClipboardCheck];
  const layout = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

  return (
    <section id="platform" className="pattern-arches py-20 md:py-28">
      <div className="container-x">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[640px]">
            <Eyebrow>{f.eyebrow}</Eyebrow>
            <h2 className="heading mt-5 text-[36px] md:text-[52px]">{f.title}</h2>
            <p className="mt-5 text-[18px] leading-relaxed text-ink/80 md:text-[20px]">{f.subtitle}</p>
          </div>
          <ButtonLink href={SYSTEM_URL} variant="outline" className="shrink-0">
            {f.cta}
          </ButtonLink>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {f.items.map((item, i) => {
            const Visual = visuals[i];
            return (
              <Reveal key={item.title} delay={i * 140} variant="zoom" className={layout[i]}>
                <article className="group relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-[24px] bg-mint p-7 transition-transform duration-300 hover:-translate-y-1 md:p-9">
                  <h3 className="heading text-[30px] md:text-[40px]">{item.title}</h3>
                  <p className="mt-3 max-w-[420px] text-[16px] leading-relaxed text-ink/80">{item.body}</p>
                  <div className="relative mt-8 flex flex-1 items-end justify-center sm:justify-end">
                    <div className="transition-transform duration-500 group-hover:-translate-y-1">
                      <Visual />
                    </div>
                    <Chip
                      icon={chipIcons[i]}
                      label={item.chipLabel}
                      title={item.chip}
                      className="absolute bottom-2 left-0 hidden max-w-[240px] sm:flex"
                    />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-8 flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-[15px] text-ink/80">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
          <span className="flex-1">{f.note}</span>
          <ShieldCheck className="hidden size-5 shrink-0 text-brand-700 sm:block" aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
