import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleHelp,
  CirclePlus,
  ShieldAlert,
} from "lucide-react";
import type { LoanApplication } from "../types/api";
import { formatCurrency, formatDate, formatPercent } from "../lib/format";
import {
  analysisToneClasses,
  healthLabels,
  riskLabels,
} from "../lib/analysisPresentation";

interface AnalysisResultProps {
  application: LoanApplication;
  compact?: boolean;
}

export const AnalysisResult = ({
  application,
  compact = false,
}: AnalysisResultProps) => {
  const analysis = application.analysis;
  if (!analysis) return null;

  const metrics = analysis.financialMetrics;
  const valuationCurrencyCode =
    metrics.valuationCurrencyCode ?? application.monthlyRevenueCurrencyCode;
  const exchangeRateCount = metrics.exchangeRates?.length ?? 0;
  const metricCards = [
    {
      label: "Flujo neto mensual",
      value:
        typeof metrics.netMonthlyCashFlow === "number"
          ? formatCurrency(metrics.netMonthlyCashFlow, valuationCurrencyCode)
          : "No disponible",
      detail: "Ingresos menos gastos normalizados",
    },
    {
      label: "Ratio de gastos",
      value:
        typeof metrics.expenseRatio === "number"
          ? formatPercent(metrics.expenseRatio)
          : "No disponible",
      detail: "Gastos normalizados sobre ingresos",
    },
    {
      label: "Solicitud / ingresos",
      value:
        typeof metrics.requestedAmountToMonthlyRevenue === "number"
          ? `${metrics.requestedAmountToMonthlyRevenue.toFixed(2)}×`
          : "No disponible",
      detail: "Monto total solicitado sobre un mes",
    },
    {
      label: "Deuda mensual / ingresos",
      value:
        typeof metrics.monthlyDebtPaymentToMonthlyRevenue === "number"
          ? formatPercent(metrics.monthlyDebtPaymentToMonthlyRevenue)
          : "No disponible",
      detail:
        typeof metrics.monthlyDebtPaymentToMonthlyRevenue === "number"
          ? "Pago mensual de deuda sobre ingresos"
          : "Registro anterior sin cuota mensual",
    },
  ];

  return (
    <motion.section
      className="space-y-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      aria-label="Resultado del análisis financiero"
    >
      <div className="data-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.09em] text-on-surface-variant">
              <Bot size={15} /> Análisis de modelo · {analysis.model}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-primary">
              {application.business.name}
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Procesado {formatDate(analysis.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${analysisToneClasses[analysis.financialHealth]}`}
            >
              Salud {healthLabels[analysis.financialHealth]}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${analysisToneClasses[analysis.riskLevel]}`}
            >
              Riesgo {riskLabels[analysis.riskLevel]}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm leading-6 text-on-surface-variant">
            {analysis.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="data-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-on-surface-variant">
              {metric.label}
            </p>
            <p className="tabular-nums mt-2 text-2xl font-semibold tracking-tight text-primary">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>

      {exchangeRateCount > 0 ? (
        <p className="rounded-control border border-outline-variant/60 bg-surface-low px-4 py-3 text-xs leading-5 text-on-surface-variant">
          Métricas normalizadas a {valuationCurrencyCode} con{" "}
          {exchangeRateCount}{" "}
          {exchangeRateCount === 1
            ? "cotización web verificada"
            : "cotizaciones web verificadas"}
          .
        </p>
      ) : null}

      {compact ? null : (
        <div className="grid gap-4 xl:grid-cols-3">
          <ResultList
            title="Factores positivos"
            items={analysis.positiveFactors}
            icon={ArrowUpRight}
            iconClass="bg-secondary-bright/10 text-secondary"
          />
          <ResultList
            title="Factores de riesgo"
            items={analysis.riskFactors}
            icon={ShieldAlert}
            iconClass="bg-error/10 text-error"
          />
          <ResultList
            title="Preguntas de seguimiento"
            items={analysis.followUpQuestions}
            icon={CircleHelp}
            iconClass="bg-primary-container/8 text-primary-container"
          />
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 border-t border-outline-variant/60 pt-4 text-xs text-on-surface-variant sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2">
          <CirclePlus size={14} /> ID de solicitud
          <code className="rounded bg-surface-container px-2 py-1 text-primary">
            {application.id}
          </code>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ArrowDownRight size={14} /> Solicitud:{" "}
          {formatCurrency(
            application.requestedAmount,
            application.requestedAmountCurrencyCode,
          )}
        </span>
      </div>
    </motion.section>
  );
};

interface ResultListProps {
  title: string;
  items: string[];
  icon: typeof ArrowUpRight;
  iconClass: string;
}

const ResultList = ({
  title,
  items,
  icon: Icon,
  iconClass,
}: ResultListProps) => (
  <article className="data-card overflow-hidden">
    <header className="flex items-center gap-3 border-b border-outline-variant/60 px-5 py-4">
      <span
        className={`flex size-8 items-center justify-center rounded-control ${iconClass}`}
      >
        <Icon size={16} />
      </span>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
    </header>
    <ul className="space-y-3 p-5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 text-sm leading-5 text-on-surface-variant"
        >
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-outline" />
          {item}
        </li>
      ))}
    </ul>
  </article>
);
