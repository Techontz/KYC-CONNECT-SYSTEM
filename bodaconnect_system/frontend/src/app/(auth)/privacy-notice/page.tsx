"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n";
import { Card, PageHeader } from "@/components/ui";
import { Logo } from "@/components/shell/Logo";
import { ActiveNotice } from "@/components/common/PrivacyNotice";
import { LanguageSelect } from "@/components/common/LanguageSelect";

export default function PublicPrivacyNoticePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <LanguageSelect />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/login" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {t("common.back")}
        </Link>
        <PageHeader eyebrow={t("privacy.eyebrow")} title={t("privacy.noticeTitle")} description={t("privacy.noticeIntro")} />
        <Card className="p-5 sm:p-8">
          <ActiveNotice />
        </Card>
      </main>
    </div>
  );
}
