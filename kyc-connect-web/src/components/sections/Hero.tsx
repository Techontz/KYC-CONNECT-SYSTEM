"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { getPhotoSlides, heroUi } from "@/lib/media";
import { useLang } from "../LangProvider";
import { HeroHand } from "../HeroHand";
import { ButtonLink, SYSTEM_URL } from "../ui";
import { useSlider } from "../useSlider";

/**
 * Hero slider: slide 1 is the solid green brand slide, the following slides are
 * photographs of rider activities blended into green on the text side.
 */
export function Hero() {
  const { t, lang } = useLang();
  const photos = getPhotoSlides(lang);
  const ui = heroUi[lang];
  const total = photos.length + 1;
  const s = useSlider(total, 6000);
  const startX = useRef<number | null>(null);

  // Swipe / drag to change slides
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    startX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx < -50 && s.index < total - 1) s.next();
    else if (dx > 50 && s.index > 0) s.prev();
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-brand text-white"
      aria-roledescription="carousel"
      aria-label="KYC Connect"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (startX.current = null)}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${s.index * 100}%)` }}
      >
        {/* Slide 1: green brand slide */}
        <div className={`slide relative w-full shrink-0 ${s.index === 0 ? "is-active" : ""}`} aria-hidden={s.index !== 0} aria-roledescription="slide" aria-label={`1 / ${total}`} inert={s.index !== 0}>
          <div className="pattern-arches-green absolute inset-0" aria-hidden="true" />
          <div className="container-x relative grid min-h-[680px] items-center gap-10 pb-28 pt-14 md:pt-16 lg:min-h-[max(720px,calc(100svh_-_76px))] lg:grid-cols-[1.1fr_1fr]">
            <div className="max-w-[640px]">
              <span className="rise inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/25" style={{ "--d": "0ms" } as React.CSSProperties}>
                <span className="size-2 rounded-full bg-white" aria-hidden="true" />
                {t.hero.eyebrow}
              </span>
              <h1 className="rise heading mt-6 text-[44px] sm:text-[60px] lg:text-[80px]" style={{ "--d": "120ms" } as React.CSSProperties}>{t.hero.title}</h1>
              <p className="rise mt-6 max-w-[540px] text-[18px] leading-relaxed text-white/90 md:text-[20px]" style={{ "--d": "240ms" } as React.CSSProperties}>{t.hero.subtitle}</p>
              <div className="rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "360ms" } as React.CSSProperties}>
                <ButtonLink href={SYSTEM_URL} variant="white" icon>
                  {t.hero.primary}
                </ButtonLink>
                <ButtonLink href="#how" variant="outline-light">
                  {t.hero.secondary}
                </ButtonLink>
              </div>

              {/* Bordered badge, in the style of an award strip */}
              <div className="rise mt-10 inline-flex max-w-full items-stretch border-[3px] border-[#f3e6b3] text-white" style={{ "--d": "480ms" } as React.CSSProperties}>
                <div className="flex flex-col justify-center gap-1 px-4 py-3">
                  <span className="text-[15px] font-bold tracking-tight">{ui.badgeLeft[0]}</span>
                  <span className="text-[12px] font-semibold text-white/80">{ui.badgeLeft[1]}</span>
                </div>
                <span className="my-3 w-px bg-white/70" aria-hidden="true" />
                <p className="flex max-w-[230px] items-center px-4 py-3 text-[15px] font-bold uppercase leading-tight tracking-wide">{ui.badgeMid}</p>
                <span className="my-3 w-px bg-white/70" aria-hidden="true" />
                <div className="flex flex-col items-center justify-center px-4 py-3">
                  <span className="text-[26px] font-bold leading-none">{ui.badgeRight[0]}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-white/85">{ui.badgeRight[1]}</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block" aria-hidden="true" />
          </div>
          <HeroHand className="hand-rise isolate absolute bottom-0 right-[max(0px,calc((100vw_-_1240px)/2))] hidden h-[min(90%,720px)] lg:block" />
        </div>

        {/* Photo slides */}
        {photos.map((p, i) => {
          const idx = i + 1;
          const active = s.index === idx;
          const right = p.align === "right";
          return (
            <div
              key={p.image}
              className={`slide relative w-full shrink-0 overflow-hidden ${active ? "is-active" : ""}`}
              aria-hidden={!active}
              aria-roledescription="slide"
              aria-label={`${idx + 1} / ${total}`}
              inert={!active}
            >
              <Image
                src={p.image}
                alt=""
                fill
                quality={90}
                sizes="100vw"
                loading={idx === 1 ? "eager" : "lazy"}
                className={`object-cover transition-transform duration-[7000ms] ease-out ${active ? "scale-100" : "scale-110"}`}
                style={{ objectPosition: p.pos }}
              />
              {/* green blend on the text side */}
              <div
                className="absolute inset-0"
                style={{
                  background: right
                    ? "linear-gradient(270deg, #2e9a3e 0%, rgba(46,154,62,0.93) 30%, rgba(57,181,74,0.55) 52%, rgba(57,181,74,0) 72%)"
                    : "linear-gradient(90deg, #2e9a3e 0%, rgba(46,154,62,0.93) 30%, rgba(57,181,74,0.55) 52%, rgba(57,181,74,0) 72%)",
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />

              <div className="container-x relative flex min-h-[680px] items-center pb-28 pt-14 lg:min-h-[max(720px,calc(100svh_-_76px))]">
                <div className={`max-w-[480px] ${right ? "ml-auto" : ""}`}>
                  <h2 className="rise heading text-[40px] drop-shadow-[0_2px_18px_rgba(0,0,0,0.18)] sm:text-[52px]" style={{ "--d": "250ms" } as React.CSSProperties}>{p.title}</h2>
                  <p className="rise mt-4 text-[18px] leading-relaxed text-white/95 md:text-[20px]" style={{ "--d": "370ms" } as React.CSSProperties}>{p.body}</p>
                  <div className="rise mt-8" style={{ "--d": "490ms" } as React.CSSProperties}>
                    <ButtonLink href={SYSTEM_URL} variant="outline-light">
                      {t.hero.primary}
                    </ButtonLink>
                  </div>
                  <div className="rise mt-10 inline-flex items-center gap-4 rounded-xl bg-white p-3 pr-5 text-ink shadow-chip" style={{ "--d": "610ms" } as React.CSSProperties}>
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-forest text-center text-white">
                      <span>
                        <span className="block text-[17px] font-bold leading-none">2K</span>
                        <span className="block text-[9px] font-semibold uppercase tracking-wider text-mint-200">{lang === "sw" ? "Awamu 1" : "Phase 1"}</span>
                      </span>
                    </span>
                    <span className="max-w-[230px]">
                      <span className="block text-[13px] text-muted">{t.hero.trustTitle}</span>
                      <span className="block text-[14px] font-semibold leading-snug">{t.hero.trustBody}</span>
                    </span>
                  </div>
                </div>
              </div>
              <p className="absolute bottom-3 left-4 text-[11px] text-white/60">{ui.credit}</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8">
        <div className="flex items-center justify-between px-4 md:px-6">
          <div className="pointer-events-auto flex items-center gap-2" role="group" aria-label="Slides">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => s.go(i)}
                aria-label={`${i + 1} / ${total}`}
                aria-current={i === s.index}
                className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-300 ${i === s.index ? "w-10 bg-white/35" : "w-2.5 bg-white/60 hover:bg-white"}`}
              >
                {i === s.index && (
                  <span
                    key={`p-${s.tick}`}
                    className="absolute inset-y-0 left-0 animate-progress rounded-full bg-white"
                    style={{ animationDuration: `${s.intervalMs}ms`, animationPlayState: s.running ? "running" : "paused" }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => s.setPaused(!s.paused)}
              aria-label={s.paused ? ui.play : ui.pause}
              className="mr-1 grid size-8 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {s.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
            {[
              { label: ui.prev, onClick: s.prev, disabled: s.index === 0, Icon: ArrowLeft },
              { label: ui.next, onClick: s.next, disabled: s.index === total - 1, Icon: ArrowRight },
            ].map(({ label, onClick, disabled, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`grid size-10 place-items-center rounded-full bg-white text-ink transition ${
                  disabled ? "cursor-not-allowed opacity-40" : "hover:scale-105"
                }`}
              >
                <Icon className="size-[18px]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
