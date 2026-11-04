import type { Lang } from "@/i18n";
import type { LookupEntry, RiderListItem } from "./types";

export const TZ = "Africa/Dar_es_Salaam";

const localeFor = (lang: Lang) => (lang === "sw" ? "sw-TZ" : "en-GB");

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: string | null | undefined, lang: Lang): string {
  const d = parse(value);
  if (!d) return "-";
  return new Intl.DateTimeFormat(localeFor(lang), {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDate(value: string | null | undefined, lang: Lang): string {
  const d = parse(value);
  if (!d) return "-";
  // Date-only strings (YYYY-MM-DD) are calendar dates; avoid shifting them across time zones.
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) opts.timeZone = "UTC";
  else opts.timeZone = TZ;
  return new Intl.DateTimeFormat(localeFor(lang), opts).format(d);
}

export function formatShortDay(value: string, lang: Lang): string {
  const d = parse(value);
  if (!d) return value;
  return new Intl.DateTimeFormat(localeFor(lang), { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function formatNumber(n: number | null | undefined, lang: Lang): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat(localeFor(lang)).format(n);
}

export function formatPercent(n: number | null | undefined, lang: Lang): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  // Accept both 0–1 ratios and 0–100 percentages.
  const pct = n <= 1 ? n * 100 : n;
  return `${new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: 1 }).format(pct)}%`;
}

/** Age in whole days/hours for queue items. */
export function ageLabel(value: string | null | undefined, lang: Lang): string {
  const d = parse(value);
  if (!d) return "-";
  const hours = Math.max(0, Math.floor((Date.now() - d.getTime()) / 3_600_000));
  if (hours < 24) return lang === "sw" ? `saa ${hours}` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return lang === "sw" ? `siku ${days}` : `${days}d`;
}

export function ageHours(value: string | null | undefined): number {
  const d = parse(value);
  return d ? (Date.now() - d.getTime()) / 3_600_000 : 0;
}

export function formatBytes(n?: number | null): string {
  if (!n && n !== 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function completenessPercent(c: RiderListItem["completeness"]): number | null {
  if (c === null || c === undefined) return null;
  const v = typeof c === "number" ? c : c.percent;
  if (typeof v !== "number") return null;
  return Math.round(v <= 1 && v > 0 && !Number.isInteger(v) ? v * 100 : v);
}

/** Converts `snake_case` keys to "Sentence case" as a last-resort label. */
export function humanize(key?: string | null): string {
  if (!key) return "-";
  const s = key.replace(/[._]/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface Option {
  value: string;
  label: string;
}

export function toOptions(entries: LookupEntry[] | undefined | null, lang: Lang): Option[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => {
    if (typeof e === "string") return { value: e, label: humanize(e) };
    const value = String(e.key ?? e.code ?? e.value ?? e.id ?? e.name ?? "");
    const label = (lang === "sw" ? e.labelSw : e.labelEn) ?? e.label ?? e.name ?? humanize(value);
    return { value, label };
  });
}

/** Normalises a Tanzanian phone number to E.164 for display/validation hints. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("255")) return `+${digits}`;
  if (digits.startsWith("0")) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;
  return digits;
}

export const TZ_PHONE_RE = /^\+255[67]\d{8}$/;

export function normalisePlate(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export function personName(p?: { legalName?: string | null; preferredName?: string | null; name?: string | null } | null): string {
  if (!p) return "-";
  return p.preferredName || p.legalName || p.name || "-";
}
