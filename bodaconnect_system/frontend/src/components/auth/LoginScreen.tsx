"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, BadgeCheck, Code2, Lock, ShieldCheck, Smartphone, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { normalisePhone, TZ_PHONE_RE } from "@/lib/format";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/shell/Logo";
import { OtpInput } from "./OtpInput";
import { LanguageSelect } from "@/components/common/LanguageSelect";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";
const RESEND_SECONDS = 60;

const DEMO_ACCOUNTS = [
  { phone: "+255700000001", role: "platform_admin" },
  { phone: "+255700000002", role: "verifier" },
  { phone: "+255700000003", role: "field_agent" },
  { phone: "+255700000004", role: "association_admin" },
  { phone: "+255700000005", role: "group_leader" },
  { phone: "+255700000006", role: "rider" },
];

interface Envelope {
  data?: { sent?: boolean; expiresInSeconds?: number; devCode?: string };
  error?: { code: string; message: string; fieldErrors?: Record<string, string>; requestId?: string };
}

function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0;
}

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LoginScreen({ showDemo }: { showDemo: boolean }) {
  const { t, tx } = useI18n();
  const params = useSearchParams();
  const next = params.get("next");
  const expired = params.get("expired") === "1";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; requestId?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const resendIn = useCountdown(resendAt);
  const expiresIn = useCountdown(expiresAt);

  const schema = z.object({
    phoneNumber: z
      .string()
      .trim()
      .min(1, t("login.phoneRequired"))
      .refine((v) => TZ_PHONE_RE.test(normalisePhone(v)) || /^\+\d{9,15}$/.test(normalisePhone(v)), t("login.phoneInvalid")),
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { phoneNumber: "" } });

  async function requestOtp(phoneNumber: string) {
    setBanner(null);
    let res: Response;
    try {
      res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      setBanner({ message: t("error.offlineBody") });
      return false;
    }
    const body = (await res.json().catch(() => ({}))) as Envelope;
    if (!res.ok) {
      if (res.status === 429) {
        const retry = Number(res.headers.get("retry-after")) || 60;
        setResendAt(Date.now() + retry * 1000);
        setBanner({ message: t("login.rateLimited", { seconds: retry }), requestId: body.error?.requestId });
      } else if (body.error?.fieldErrors?.phoneNumber) {
        form.setError("phoneNumber", { message: body.error.fieldErrors.phoneNumber });
      } else {
        setBanner({ message: body.error?.message ?? t("error.body"), requestId: body.error?.requestId });
      }
      return false;
    }
    setDevCode(body.data?.devCode ?? null);
    setExpiresAt(Date.now() + (body.data?.expiresInSeconds ?? 300) * 1000);
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    return true;
  }

  const onPhone = form.handleSubmit(async ({ phoneNumber }) => {
    const e164 = normalisePhone(phoneNumber);
    if (await requestOtp(e164)) {
      setPhone(e164);
      setCode("");
      setOtpError(null);
      setStep("otp");
    }
  });

  async function verify(value = code) {
    if (value.length !== 6) {
      setOtpError(t("login.codeIncomplete"));
      return;
    }
    setVerifying(true);
    setOtpError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phoneNumber: phone, code: value }),
      });
      const body = (await res.json().catch(() => ({}))) as Envelope;
      if (!res.ok) {
        if (res.status === 429) setBanner({ message: t("login.tooManyAttempts"), requestId: body.error?.requestId });
        else setOtpError(body.error?.fieldErrors?.code ?? body.error?.message ?? t("login.codeWrong"));
        setVerifying(false);
        return;
      }
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.assign(dest);
    } catch {
      setBanner({ message: t("error.offlineBody") });
      setVerifying(false);
    }
  }

  const masked = phone.replace(/^(\+\d{3})(\d{3})\d{3}(\d{3})$/, "$1 $2 *** $3");

  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-forest px-12 py-12 text-white lg:flex lg:flex-col">
        <Logo dark />
        <div className="my-auto max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
            UMAPIDO · Dodoma
          </span>
          <h1 className="mt-5 text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em]">{t("login.heroTitle")}</h1>
          <p className="mt-4 text-lg text-white/80">{t("login.heroBody")}</p>
          <ul className="mt-8 flex flex-col gap-3 text-[15px] text-white/90">
            {[
              [<Users key="a" className="size-5" aria-hidden />, t("login.point1")],
              [<ShieldCheck key="b" className="size-5" aria-hidden />, t("login.point2")],
              [<Lock key="c" className="size-5" aria-hidden />, t("login.point3")],
            ].map(([icon, text], i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-brand">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-10 inline-flex items-center gap-3 rounded-[16px] bg-white px-4 py-3 text-ink shadow-float">
            <span className="flex size-9 items-center justify-center rounded-full bg-mint text-forest">
              <BadgeCheck className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold">{t("login.chipTitle")}</p>
              <p className="text-xs text-muted">{t("login.chipBody")}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-white/60">
          <Link href="/privacy-notice" className="font-semibold text-white underline underline-offset-4">
            {t("login.privacyLink")}
          </Link>{" "}
          · Wadonge Group Limited
        </p>
        <svg className="pointer-events-none absolute -right-24 -bottom-24 size-[420px] opacity-[0.08]" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#39B54A" strokeWidth="8" />
          <circle cx="50" cy="50" r="8" fill="#39B54A" />
        </svg>
      </section>

      {/* Form panel */}
      <section className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-2">
          <span className="lg:hidden">
            <Logo />
          </span>
          <div className="ml-auto">
            <LanguageSelect />
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-6 rounded-[20px] bg-forest p-5 text-white lg:hidden">
            <p className="text-lg font-bold tracking-[-0.02em]">{t("login.heroTitle")}</p>
            <p className="mt-1 text-sm text-white/80">{t("login.heroBodyShort")}</p>
          </div>

          {expired && step === "phone" && (
            <p role="status" className="mb-4 rounded-[12px] bg-info-50 px-4 py-3 text-sm text-info-900">
              {t("login.sessionExpired")}
            </p>
          )}

          {banner && (
            <div role="alert" className="mb-4 rounded-[12px] border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger-900">
              {banner.message}
              {banner.requestId && (
                <span className="mt-1 block text-xs">
                  {t("error.requestId")}: <code className="font-mono">{banner.requestId}</code>
                </span>
              )}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={onPhone} noValidate>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">{t("login.eyebrow")}</span>
              <h2 className="mt-3 text-[30px] leading-tight font-extrabold tracking-[-0.02em]">{t("login.title")}</h2>
              <p className="mt-2 text-[15px] text-muted">{t("login.subtitle")}</p>
              <div className="mt-6">
                <Input
                  label={t("login.phoneLabel")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0712 345 678"
                  hint={t("login.phoneHint")}
                  required
                  error={form.formState.errors.phoneNumber?.message}
                  {...form.register("phoneNumber")}
                />
              </div>
              <Button type="submit" size="lg" block className="mt-5" loading={form.formState.isSubmitting} icon={<Smartphone className="size-5" aria-hidden />}>
                {t("login.sendCode")}
              </Button>
              <p className="mt-4 text-center text-[13px] text-muted">
                {t("login.privacyPrefix")}{" "}
                <Link href="/privacy-notice" className="font-semibold text-forest underline underline-offset-2">
                  {t("login.privacyLink")}
                </Link>
                .
              </p>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
              noValidate
            >
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setBanner(null);
                }}
                className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden /> {t("login.changeNumber")}
              </button>
              <h2 className="text-[30px] leading-tight font-extrabold tracking-[-0.02em]">{t("login.otpTitle")}</h2>
              <p className="mt-2 text-[15px] text-muted">{t("login.otpSubtitle", { phone: masked })}</p>

              {devCode && (
                <div className="mt-5 flex items-start gap-3 rounded-[12px] border-2 border-dashed border-amber bg-amber-50 px-4 py-3 text-sm text-ink" role="note">
                  <Code2 className="mt-0.5 size-4 shrink-0 text-amber-900" aria-hidden />
                  <p>
                    <strong className="font-bold">{t("login.devBanner")}</strong> {t("login.devCode")}{" "}
                    <button type="button" className="font-mono text-base font-bold tracking-[0.2em] underline" onClick={() => setCode(devCode)}>
                      {devCode}
                    </button>
                  </p>
                </div>
              )}

              <div className="mt-6">
                <OtpInput
                  label={t("login.codeLabel")}
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    setOtpError(null);
                  }}
                  onComplete={(v) => void verify(v)}
                  invalid={Boolean(otpError)}
                  disabled={verifying}
                />
                {otpError && (
                  <p role="alert" className="mt-2 text-sm font-medium text-danger-900">
                    {otpError}
                  </p>
                )}
                <p className="mt-3 text-[13px] text-muted" aria-live="polite">
                  {expiresIn > 0 ? t("login.expiresIn", { time: mmss(expiresIn) }) : t("login.codeExpired")}
                </p>
              </div>

              <Button type="submit" size="lg" block className="mt-5" loading={verifying}>
                {t("login.verify")}
              </Button>
              <div className="mt-4 text-center text-sm">
                {resendIn > 0 ? (
                  <span className="text-muted" aria-live="polite">
                    {t("login.resendIn", { seconds: resendIn })}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center font-semibold text-forest underline-offset-4 hover:underline"
                    onClick={async () => {
                      if (await requestOtp(phone)) {
                        setCode("");
                        setOtpError(null);
                      }
                    }}
                  >
                    {t("login.resend")}
                  </button>
                )}
              </div>
            </form>
          )}

          {showDemo && step === "phone" && (
            <div className="mt-8 rounded-[20px] border border-dashed border-line bg-surface p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Code2 className="size-4 text-amber-900" aria-hidden /> {t("login.demoTitle")}
              </p>
              <p className="mt-0.5 text-xs text-muted">{t("login.demoBody")}</p>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.phone}>
                    <button
                      type="button"
                      onClick={() => form.setValue("phoneNumber", a.phone, { shouldValidate: true })}
                      className="flex min-h-11 w-full flex-col items-start rounded-[12px] bg-white px-3 py-1.5 text-left ring-1 ring-line hover:ring-brand"
                    >
                      <span className="font-mono text-[13px] font-semibold text-ink">{a.phone}</span>
                      <span className="text-xs text-muted">{tx(`role.${a.role}`, a.role)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted">
          <a href={LANDING_URL} className="font-semibold underline underline-offset-2">
            {t("nav.landing")}
          </a>{" "}
          · © Wadonge Group Limited
        </p>
      </section>
    </div>
  );
}
