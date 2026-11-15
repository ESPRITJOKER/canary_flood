import type { ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  Gauge,
  Info,
  Radar,
  Satellite,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/use-lang";
import { isSample, passCount } from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { Card, PageTitle, Pill, SectionLabel } from "../components/ui";

export function AboutPage() {
  const { stats } = useFloodData();
  const data = stats!;
  const { t } = useTranslation();
  const lang = useLang();

  const steps = [
    { title: t("about.step1"), body: t("about.step1Body") },
    { title: t("about.step2"), body: t("about.step2Body") },
    { title: t("about.step3"), body: t("about.step3Body") },
    { title: t("about.step4"), body: t("about.step4Body") },
    { title: t("about.step5"), body: t("about.step5Body") },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle
        eyebrow={
          <>
            <Info className="h-4 w-4" aria-hidden />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              {t("app.team")} · NASA Space Apps 2026
            </span>
          </>
        }
        title={t("about.title")}
        subtitle={t("about.subtitle")}
      />

      <Card className="flex flex-col gap-3 bg-surface-container">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="info" icon={<Radar className="h-3 w-3" aria-hidden />}>
            {t("app.disclaimer")}
          </Pill>
          <Pill tone="neutral">{data.meta.aoi ?? t("app.city")}</Pill>
          <Pill tone="neutral">
            {passCount(data)} {t("common.passes")}
          </Pill>
        </div>
        <p className="text-body-md leading-relaxed text-on-surface">{t("about.whatBody")}</p>
        <p className="border-l-[3px] border-tertiary-fixed-dim pl-3 text-body-sm leading-relaxed text-on-surface-variant">
          {t("app.tagline")}
        </p>
      </Card>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Satellite className="h-4 w-4 text-secondary" aria-hidden />
          <h2 className="text-headline-sm font-bold text-primary">{t("about.how")}</h2>
        </div>
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-bold text-tertiary-fixed">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-label-lg font-semibold text-primary-container">{step.title}</h3>
                  <p className="mt-0.5 text-body-sm leading-relaxed text-on-surface-variant">
                    {step.body}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-secondary" aria-hidden />
          <h2 className="text-headline-sm font-bold text-primary">{t("about.limits")}</h2>
        </div>
        <div className="flex flex-col gap-1.5">
          {data.limits.map((limit) => (
            <details
              key={limit.id}
              className="group rounded-xl bg-surface-container-lowest shadow-card ring-1 ring-black/[0.03]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left">
                <span className="text-label-lg font-semibold text-primary-container">
                  {limit.title[lang]}
                </span>
                <span className="shrink-0 text-label-sm text-secondary group-open:hidden">
                  +
                </span>
                <span className="hidden shrink-0 text-label-sm text-secondary group-open:inline">
                  −
                </span>
              </summary>
              <p className="border-t border-line px-4 py-3 text-body-sm leading-relaxed text-on-surface-variant">
                {limit.body[lang]}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <InfoCard
          icon={<Database className="h-4 w-4" aria-hidden />}
          label={t("about.data")}
          body={t("about.dataBody")}
        />
        <InfoCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          label={t("about.team")}
          body={t("about.teamBody")}
        />
        <InfoCard
          icon={<BookOpen className="h-4 w-4" aria-hidden />}
          label={t("about.licence")}
          body={t("about.licenceBody")}
        />
        <InfoCard
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          label={t("about.honesty")}
          body={t("about.honestyBody")}
          tone="safe"
        />
      </div>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>{t("stats.params")}</SectionLabel>
          <Pill tone={isSample(data) ? "warning" : "safe"}>
            {isSample(data) ? t("sample.badge") : "Final"}
          </Pill>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-sm sm:grid-cols-3">
          {Object.entries(data.params).map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1">
              <dt className="truncate text-label-sm text-on-surface-variant">{key}</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-on-surface">{String(value)}</dd>
            </div>
          ))}
        </dl>
        {data.meta.generated_at && (
          <p className="text-label-sm text-on-surface-variant">
            {t("sample.banner")} · {data.meta.generated_at}
          </p>
        )}
      </Card>

      <Card className="flex items-start gap-2.5 bg-gradient-to-b from-white to-surface">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
        <div className="min-w-0">
          <p className="text-label-lg font-semibold text-primary-container">{t("assistant.title")}</p>
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            {t("app.tagline")}
          </p>
          <p className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
            <CheckCircle2 className="h-3.5 w-3.5 text-safe-text" aria-hidden />
            {t("assistant.disclaimer")}
          </p>
        </div>
      </Card>

      {isSample(data) && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-container px-3 py-2 ring-1 ring-warning-border">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-text" aria-hidden />
          <p className="text-body-sm text-warning-text">{data.meta.source ?? t("sample.banner")}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  body,
  tone = "info",
}: {
  icon: ReactNode;
  label: string;
  body: string;
  tone?: "info" | "safe";
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span
        className={
          tone === "safe"
            ? "flex items-center gap-1.5 text-label-sm font-semibold uppercase tracking-[0.08em] text-safe-text"
            : "flex items-center gap-1.5 text-label-sm font-semibold uppercase tracking-[0.08em] text-secondary"
        }
      >
        {icon}
        {label}
      </span>
      <p className="text-body-sm leading-relaxed text-on-surface-variant">{body}</p>
    </Card>
  );
}
