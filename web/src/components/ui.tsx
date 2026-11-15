import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ logo */

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-primary-container shadow-card"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M24 10C17.37 10 12 15.37 12 22C12 28.63 24 38 24 38C24 38 36 28.63 36 22C36 15.37 30.63 10 24 10Z"
          stroke="#47a1ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M24 6C15.16 6 8 13.16 8 22" stroke="#71f8e4" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 22C40 13.16 32.84 6 24 6" stroke="#47a1ff" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M24 2C12.95 2 4 10.95 4 22"
          stroke="#b1c7f0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 4"
        />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- cards */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-xl bg-surface-container-lowest shadow-card ring-1 ring-black/[0.03]",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "text-label-sm uppercase tracking-[0.08em] text-on-surface-variant",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- tones */

export type Tone = "critical" | "warning" | "safe" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  critical: "bg-error-container text-on-error-container ring-1 ring-[#fca5a5]",
  warning: "bg-warning-container text-warning-text ring-1 ring-warning-border",
  safe: "bg-safe-container text-safe-text ring-1 ring-safe-border",
  info: "bg-surface-container text-secondary ring-1 ring-secondary-fixed-dim",
  neutral: "bg-surface-container text-on-surface-variant ring-1 ring-line",
};

const iconToneClasses: Record<Tone, string> = {
  critical: "bg-error-container text-error",
  warning: "bg-warning-container text-warning-text",
  safe: "bg-safe-container text-safe-text",
  info: "bg-surface-container-high text-secondary",
  neutral: "bg-surface-container text-on-surface-variant",
};

export function Pill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function IconBadge({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        iconToneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- metrics */

export function Metric({
  label,
  value,
  unit,
  foot,
  tone = "neutral",
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  foot?: ReactNode;
  tone?: Tone;
  emphasis?: boolean;
}) {
  return (
    <Card className="flex min-w-0 flex-col justify-between gap-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-baseline gap-1">
        <span
          className={cx(
            "font-bold leading-none tabular-nums",
            emphasis ? "text-[1.75rem]" : "text-[1.55rem]",
            tone === "critical" ? "text-error" : "text-primary-container",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-label-lg font-medium text-on-surface-variant">{unit}</span>}
      </div>
      {foot && <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">{foot}</div>}
    </Card>
  );
}

/* --------------------------------------------------------------- headings */

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1">
      {eyebrow && (
        <div className="flex items-center gap-2 text-secondary">
          {eyebrow}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface md:text-headline-lg">
          {title}
        </h1>
        {right}
      </div>
      {subtitle && (
        <p className="max-w-prose text-body-sm text-on-surface-variant md:text-body-md">{subtitle}</p>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ misc */

export function SampleBanner({ text, label = "Sample" }: { text: string; label?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-warning-container px-3 py-2 ring-1 ring-warning-border">
      <span className="mt-0.5 shrink-0 text-label-sm font-bold uppercase tracking-wider text-warning-text">
        {label}
      </span>
      <p className="text-body-sm text-warning-text">{text}</p>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cx("h-px w-full bg-line", className)} />;
}
