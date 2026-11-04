"use client";

import { useI18n } from "@/i18n";
import { ButtonLink, Card, EmptyState } from "@/components/ui";

export default function AppNotFound() {
  const { t } = useI18n();
  return (
    <Card>
      <EmptyState
        kind="search"
        title={t("error.pageNotFound")}
        description={t("error.pageNotFoundBody")}
        action={<ButtonLink href="/">{t("error.goHome")}</ButtonLink>}
      />
    </Card>
  );
}
