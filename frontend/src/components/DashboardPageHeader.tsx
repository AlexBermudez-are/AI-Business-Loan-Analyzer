import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}

export const DashboardPageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: DashboardPageHeaderProps) => (
  <header className="flex flex-col gap-5 border-b border-outline-variant/65 pb-7 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-[36px]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);
