"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, BadgeCheck, CopyCheck, Hourglass, MapPinned, UserPlus, Users, ShieldCheck, BarChart3 } from "lucide-react";
import { useI18n, type MessageKey } from "@/i18n";
import { useApi } from "@/lib/hooks";
import { hasRole, primaryOrganisation, primaryRole } from "@/lib/roles";
import { formatDateTime, formatNumber, formatPercent, formatShortDay, humanize } from "@/lib/format";
import type { DashboardSummary, ItemResponse, Me } from "@/lib/types";
import { ButtonLink, Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, SkeletonCards, cn } from "@/components/ui";
import { InfoTip } from "@/components/common/InfoTip";

const GREEN = "#39B54A";

function Kpi({
  label,
  value,
  icon,
  definition,
  href,
  tone = "default",
  sub,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  definition?: string;
  href?: string;
  tone?: "default" | "warning" | "success";
  sub?: string;
}) {
  const { t } = useI18n();
  return (
    <Card className="relative flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "warning" ? "bg-amber-50 text-amber-900" : tone === "success" ? "bg-mint text-forest" : "bg-mint-50 text-forest",
          )}
        >
          {icon}
        </span>
        {definition && <InfoTip label={t("dashboard.definitionOf", { metric: label })} text={definition} className="-mr-2 -mt-1" />}
      </div>
      <div>
        <p className="text-[28px] leading-none font-extrabold tracking-[-0.02em] text-ink">{value}</p>
        <p className="mt-1.5 text-sm font-semibold text-muted">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="absolute inset-0 rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35" aria-label={`${label}: ${t("common.viewAll")}`} />
      )}
    </Card>
  );
}

function ChartTooltip({ active, payload, label, lang, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; lang: "sw" | "en"; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-line bg-white px-3 py-2 text-sm shadow-float">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-muted">
        {formatNumber(payload[0].value, lang)} {unit}
      </p>
    </div>
  );
}

export function StaffDashboard({ me }: { me: Me }) {
  const { t, tx, lang } = useI18n();
  const q = useApi<ItemResponse<DashboardSummary>>("/dashboard/summary");
  const [showDefs, setShowDefs] = useState(false);
  const role = primaryRole(me);
  const org = primaryOrganisation(me);
  const name = (me.person?.preferredName || me.person?.legalName || me.displayName)?.split(" ")[0];

  const header = (
    <PageHeader
      eyebrow={role === "association_admin" && org ? t("dashboard.associationEyebrow", { org: org.name }) : t("dashboard.eyebrow")}
      title={name ? t("dashboard.greeting", { name }) : t("dashboard.title")}
      description={t("dashboard.subtitle")}
      actions={
        <>
          {hasRole(me, "field_agent", "association_admin", "platform_admin") && (
            <ButtonLink href="/riders/new" icon={<UserPlus className="size-4" aria-hidden />}>
              {t("nav.register")}
            </ButtonLink>
          )}
          {hasRole(me, "verifier", "platform_admin") && (
            <ButtonLink href="/verification" variant="secondary" icon={<ShieldCheck className="size-4" aria-hidden />}>
              {t("nav.verification")}
            </ButtonLink>
          )}
        </>
      }
    />
  );

  if (q.isPending)
    return (
      <>
        {header}
        <SkeletonCards count={6} className="lg:grid-cols-3 xl:grid-cols-6" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-[20px] lg:col-span-2" />
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
      </>
    );
  if (q.isError)
    return (
      <>
        {header}
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </>
    );

  const d = q.data.data;
  const defs = d.definitions ?? {};
  const tot = d.totals;
  const funnelMax = Math.max(1, ...(d.funnel ?? []).map((f) => f.count));
  const reg = (d.registrationsByDay ?? []).map((r) => ({ ...r, label: formatShortDay(r.date, lang) }));
  const reg30 = reg.reduce((s, r) => s + r.count, 0);
  const byGroup = [...(d.byGroup ?? [])].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <>
      {header}

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          {t("dashboard.kpis")}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label={t("dashboard.riders")} value={formatNumber(tot.riders, lang)} icon={<Users className="size-5" aria-hidden />} definition={defs.riders} href="/riders" />
          <Kpi
            label={t("dashboard.verified")}
            value={formatNumber(tot.verified, lang)}
            icon={<BadgeCheck className="size-5" aria-hidden />}
            definition={defs.verified}
            tone="success"
            sub={tot.riders ? formatPercent(tot.verified / tot.riders, lang) : undefined}
            href="/riders?status=verified"
          />
          <Kpi
            label={t("dashboard.pending")}
            value={formatNumber(tot.pendingVerification, lang)}
            icon={<Hourglass className="size-5" aria-hidden />}
            definition={defs.pendingVerification}
            href={hasRole(me, "verifier", "platform_admin") ? "/verification" : "/riders?status=submitted"}
          />
          <Kpi
            label={t("dashboard.correction")}
            value={formatNumber(tot.correctionRequired, lang)}
            icon={<AlertTriangle className="size-5" aria-hidden />}
            definition={defs.correctionRequired}
            tone="warning"
            href="/riders?status=correction_required"
          />
          <Kpi
            label={t("dashboard.duplicates")}
            value={formatNumber(tot.openDuplicates, lang)}
            icon={<CopyCheck className="size-5" aria-hidden />}
            definition={defs.openDuplicates ?? defs.duplicateRate}
            tone={tot.openDuplicates ? "warning" : "default"}
            href={hasRole(me, "verifier", "platform_admin", "association_admin") ? "/duplicates" : undefined}
          />
          <Kpi
            label={t("dashboard.coverage")}
            value={`${formatNumber(d.groupCoverage?.covered, lang)}/${formatNumber(d.groupCoverage?.total, lang)}`}
            icon={<MapPinned className="size-5" aria-hidden />}
            definition={defs.groupCoverage}
            sub={d.groupCoverage?.total ? formatPercent(d.groupCoverage.covered / d.groupCoverage.total, lang) : undefined}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] bg-white px-4 py-3 text-sm text-muted ring-1 ring-line">
          <span>
            {t("dashboard.completionRate")}: <strong className="text-ink">{formatPercent(d.completionRate, lang)}</strong>
          </span>
          <span>
            {t("dashboard.duplicateRate")}: <strong className="text-ink">{formatPercent(d.duplicateRate, lang)}</strong>
          </span>
          <span>
            {t("dashboard.turnaround")}:{" "}
            <strong className="text-ink">{d.medianTurnaroundHours === null || d.medianTurnaroundHours === undefined ? "-" : t("dashboard.hours", { n: Math.round(d.medianTurnaroundHours * 10) / 10 })}</strong>
          </span>
          <button type="button" className="ml-auto font-semibold text-forest underline-offset-4 hover:underline" aria-expanded={showDefs} onClick={() => setShowDefs((s) => !s)}>
            {showDefs ? t("dashboard.hideDefinitions") : t("dashboard.showDefinitions")}
          </button>
        </div>
        {showDefs && (
          <Card className="mt-3 p-5">
            <h3 className="mb-3 text-base font-bold">{t("dashboard.definitionsTitle")}</h3>
            {Object.keys(defs).length ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(defs).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm font-semibold text-ink">{tx(`metric.${k}`, humanize(k))}</dt>
                    <dd className="text-sm text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">{t("dashboard.noDefinitions")}</p>
            )}
          </Card>
        )}
      </section>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("dashboard.registrations30")} description={t("dashboard.registrations30Desc", { n: formatNumber(reg30, lang) })} />
          <CardBody>
            {reg.length ? (
              <>
                <div className="h-60 w-full" aria-hidden>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reg} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GREEN} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#E3E8E5" strokeDasharray="0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5B6B63", fontSize: 12 }} minTickGap={24} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5B6B63", fontSize: 12 }} />
                      <Tooltip cursor={{ stroke: "#1F3E35", strokeWidth: 1 }} content={<ChartTooltip lang={lang} unit={t("dashboard.registrationsUnit")} />} />
                      <Area type="monotone" dataKey="count" stroke={GREEN} strokeWidth={2} fill="url(#regFill)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <table className="sr-only">
                  <caption>{t("dashboard.registrations30")}</caption>
                  <tbody>
                    {reg.map((r) => (
                      <tr key={r.date}>
                        <th scope="row">{r.label}</th>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <EmptyState title={t("dashboard.noRegistrations")} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.funnel")} description={t("dashboard.funnelDesc")} />
          <CardBody>
            {d.funnel?.length ? (
              <ol className="flex flex-col gap-3">
                {d.funnel.map((f, i) => {
                  const pct = (f.count / funnelMax) * 100;
                  return (
                    <li key={f.stage}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-ink">
                          {i + 1}. {tx(`status.${f.stage}`, tx(`funnel.${f.stage}`, humanize(f.stage)))}
                        </span>
                        <span className="text-muted">
                          <strong className="text-ink">{formatNumber(f.count, lang)}</strong> · {formatPercent(pct / 100, lang)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-mint-50" aria-hidden>
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(pct, f.count ? 2 : 0)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("dashboard.byGroup")} description={t("dashboard.byGroupDesc")} />
          <CardBody>
            {byGroup.length ? (
              <>
                <div className="w-full" style={{ height: Math.max(180, byGroup.length * 36) }} aria-hidden>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byGroup} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
                      <CartesianGrid horizontal={false} stroke="#E3E8E5" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5B6B63", fontSize: 12 }} />
                      <YAxis type="category" dataKey="groupName" width={120} tickLine={false} axisLine={false} tick={{ fill: "#0B0F0D", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#EEF7F2" }} content={<ChartTooltip lang={lang} unit={t("dashboard.ridersUnit")} />} />
                      <Bar dataKey="count" fill={GREEN} radius={[0, 4, 4, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <table className="sr-only">
                  <caption>{t("dashboard.byGroup")}</caption>
                  <tbody>
                    {byGroup.map((g) => (
                      <tr key={g.groupName}>
                        <th scope="row">{g.groupName}</th>
                        <td>{g.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.activity")} />
          <CardBody>
            {d.recentActivity?.length ? (
              <ul className="flex flex-col gap-4">
                {d.recentActivity.slice(0, 8).map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-ink">{tx(`audit.${a.action}`, humanize(a.action))}</p>
                      <p className="text-muted">
                        {a.actorName ?? t("common.system")} · {formatDateTime(a.at, lang)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t("dashboard.noActivity")} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(
          [
            ["/riders", "dashboard.quickRoster", <Users key="u" className="size-5" aria-hidden />],
            ["/vehicles", "dashboard.quickVehicles", <BadgeCheck key="v" className="size-5" aria-hidden />],
            hasRole(me, "association_admin", "platform_admin")
              ? ["/reports", "dashboard.quickReports", <BarChart3 key="r" className="size-5" aria-hidden />]
              : ["/support", "dashboard.quickSupport", <AlertTriangle key="s" className="size-5" aria-hidden />],
          ] as [string, MessageKey, ReactNode][]
        ).map(([href, label, icon]) => (
          <Link key={href} href={href} className="group flex min-h-14 items-center gap-3 rounded-[20px] bg-forest px-5 py-4 text-white hover:bg-forest-900">
            <span className="text-brand">{icon}</span>
            <span className="flex-1 font-semibold">{t(label)}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  );
}
