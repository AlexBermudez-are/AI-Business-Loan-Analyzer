export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: User;
}

export interface Business {
  id: string;
  name: string;
  industry: string;
  yearsInBusiness: number;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  minorUnit: number;
}

export interface FinancialMetrics {
  valuationCurrencyCode?: string;
  exchangeRates?: ExchangeRateSnapshot[];
  normalizedAmounts?: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    existingDebt: number;
    monthlyDebtPayment: number;
    requestedAmount: number;
  };
  netMonthlyCashFlow: number | null;
  netMonthlyCashFlowCurrencyCode: string | null;
  expenseRatio: number | null;
  requestedAmountToMonthlyRevenue: number | null;
  existingDebtToMonthlyRevenue: number | null;
  monthlyDebtPaymentToMonthlyRevenue?: number | null;
}

export interface ExchangeRateSnapshot {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  quotedAt: string;
}

export interface ExchangeRateQuote extends ExchangeRateSnapshot {
  sourceName: string;
  sourceUrl: string;
  provider: string;
  model: string;
  retrievedAt: string;
}

export interface ExchangeRateQuoteBundle {
  quotes: ExchangeRateQuote[];
  quoteToken: string;
  provider: string;
  model: string;
  retrievedAt: string;
  cacheStatus:
    | "live"
    | "memory"
    | "database"
    | "rate-limit-fallback";
}

export interface LoanApplicationExchangeRate {
  id: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: string;
  quotedAt: string;
  sourceName: string;
  sourceUrl: string | null;
  provider: string;
  model: string;
  retrievedAt: string;
  fromCurrency: Currency;
  toCurrency: Currency;
}

export interface LoanAnalysis {
  id: string;
  provider: string;
  model: string;
  financialHealth: "strong" | "moderate" | "weak";
  riskLevel: "low" | "medium" | "high";
  summary: string;
  positiveFactors: string[];
  riskFactors: string[];
  followUpQuestions: string[];
  financialMetrics: FinancialMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface LoanApplication {
  id: string;
  businessId: string;
  monthlyRevenue: string;
  monthlyRevenueCurrencyCode: string;
  monthlyExpenses: string;
  monthlyExpensesCurrencyCode: string;
  existingDebt: string;
  existingDebtCurrencyCode: string;
  monthlyDebtPayment: string;
  monthlyDebtPaymentCurrencyCode: string;
  requestedAmount: string;
  requestedAmountCurrencyCode: string;
  loanPurpose: string;
  status: "analyzing" | "analyzed" | "failed";
  createdAt: string;
  updatedAt: string;
  business: Business;
  monthlyRevenueCurrency: Currency;
  monthlyExpensesCurrency: Currency;
  existingDebtCurrency: Currency;
  monthlyDebtPaymentCurrency: Currency;
  requestedAmountCurrency: Currency;
  exchangeRates: LoanApplicationExchangeRate[];
  analysis: LoanAnalysis | null;
}

export interface AnalysisHistoryEntry {
  id: string;
  userId: string;
  loanApplicationId: string;
  createdAt: string;
  updatedAt: string;
  loanApplication: LoanApplication;
}

export interface AnalysisHistoryPage {
  items: AnalysisHistoryEntry[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface LoanApplicationPayload {
  business: {
    name: string;
    industry: string;
    yearsInBusiness: number;
  };
  financialData: {
    monthlyRevenue: number;
    monthlyRevenueCurrencyCode: string;
    monthlyExpenses: number;
    monthlyExpensesCurrencyCode: string;
    existingDebt: number;
    existingDebtCurrencyCode: string;
    monthlyDebtPayment: number;
    monthlyDebtPaymentCurrencyCode: string;
    requestedAmount: number;
    requestedAmountCurrencyCode: string;
    loanPurpose: string;
    exchangeRateQuoteToken?: string;
  };
}

export interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
    details?: {
      fields?: Array<{ field: string; message: string }>;
      retryAfter?: string | number;
      limitType?: "ITPM" | "OTPM" | "TPM" | "TPD" | "RPM" | "RPD";
    };
  };
}
