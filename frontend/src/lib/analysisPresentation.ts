import type { LoanAnalysis } from "../types/api";

export const healthLabels: Record<LoanAnalysis["financialHealth"], string> = {
  strong: "Sólida",
  moderate: "Moderada",
  weak: "Débil",
};

export const riskLabels: Record<LoanAnalysis["riskLevel"], string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export const analysisToneClasses: Record<
  LoanAnalysis["financialHealth"] | LoanAnalysis["riskLevel"],
  string
> = {
  strong: "bg-secondary-bright/10 text-secondary",
  moderate: "bg-amber-500/12 text-amber-700",
  weak: "bg-error/10 text-error",
  low: "bg-secondary-bright/10 text-secondary",
  medium: "bg-amber-500/12 text-amber-700",
  high: "bg-error/10 text-error",
};
