import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  CalendarDays,
  Calculator,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnalysisResult } from "../components/AnalysisResult";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";
import { formatDateOnly } from "../lib/format";
import type {
  Currency,
  ExchangeRateQuoteBundle,
  LoanApplication,
  LoanApplicationPayload,
} from "../types/api";

const configuredOperatingCurrency =
  import.meta.env.VITE_DEFAULT_OPERATING_CURRENCY?.trim().toUpperCase() ||
  "ARS";
const configuredFinancingCurrency =
  import.meta.env.VITE_DEFAULT_FINANCING_CURRENCY?.trim().toUpperCase() ||
  "USD";

const resolveDefaultCurrency = (
  currencies: Currency[],
  configuredCode: string,
  fallbackCode: string,
) =>
  [configuredCode, fallbackCode, currencies[0]?.code].find(
    (code): code is string =>
      Boolean(code) && currencies.some((currency) => currency.code === code),
  ) ?? "";

const rateLimitLabels: Record<string, string> = {
  ITPM: "de tokens de entrada por minuto",
  OTPM: "de tokens de salida por minuto",
  TPM: "de tokens por minuto",
  TPD: "diario de tokens",
  RPM: "de solicitudes por minuto",
  RPD: "diario de solicitudes",
};

const formatRetryDelay = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
    : `${remainingSeconds} s`;
};

export const AnalyzePage = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [currencyError, setCurrencyError] = useState("");
  const [currencyRefreshIndex, setCurrencyRefreshIndex] = useState(0);
  const [selectedCurrencies, setSelectedCurrencies] = useState<
    Record<string, string>
  >({});
  const [exchangeRateQuote, setExchangeRateQuote] =
    useState<ExchangeRateQuoteBundle | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteRefreshIndex, setQuoteRefreshIndex] = useState(0);
  const [quoteRetryAt, setQuoteRetryAt] = useState<number | null>(null);
  const [quoteRetrySeconds, setQuoteRetrySeconds] = useState(0);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setCurrenciesLoading(true);
    setCurrencyError("");

    api
      .getCurrencies(session.accessToken, controller.signal)
      .then(({ currencies: responseCurrencies }) =>
        setCurrencies(responseCurrencies),
      )
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setCurrencyError(
          requestError instanceof ApiError
            ? requestError.message
            : "No fue posible cargar el catálogo de divisas.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCurrenciesLoading(false);
      });

    return () => controller.abort();
  }, [currencyRefreshIndex, session]);

  const operatingCurrencyCode = resolveDefaultCurrency(
    currencies,
    configuredOperatingCurrency,
    "USD",
  );
  const financingCurrencyCode = resolveDefaultCurrency(
    currencies,
    configuredFinancingCurrency,
    "USD",
  );
  const getSelectedCurrency = (field: string, fallback: string) => {
    const selected = selectedCurrencies[field];
    return currencies.some(({ code }) => code === selected)
      ? selected
      : fallback;
  };
  const financialCurrencyCodes = {
    monthlyRevenue: getSelectedCurrency(
      "monthlyRevenue",
      operatingCurrencyCode,
    ),
    monthlyExpenses: getSelectedCurrency(
      "monthlyExpenses",
      operatingCurrencyCode,
    ),
    existingDebt: getSelectedCurrency("existingDebt", financingCurrencyCode),
    monthlyDebtPayment: getSelectedCurrency(
      "monthlyDebtPayment",
      financingCurrencyCode,
    ),
    requestedAmount: getSelectedCurrency(
      "requestedAmount",
      financingCurrencyCode,
    ),
  };
  const exchangeRateTargets = [
    financialCurrencyCodes.monthlyRevenue,
    financialCurrencyCodes.monthlyExpenses,
    financialCurrencyCodes.existingDebt,
    financialCurrencyCodes.monthlyDebtPayment,
    financialCurrencyCodes.requestedAmount,
  ].filter(
    (code, index, values) =>
      /^[A-Z]{3}$/.test(code) &&
      code !== "USD" &&
      values.indexOf(code) === index,
  );
  const exchangeRateTargetKey = [...exchangeRateTargets].sort().join(",");
  const quotedTargetKey = exchangeRateQuote?.quotes
    .map(({ toCurrencyCode }) => toCurrencyCode)
    .sort()
    .join(",");
  const activeExchangeRateQuote =
    quotedTargetKey === exchangeRateTargetKey ? exchangeRateQuote : null;

  useEffect(() => {
    if (quoteRetryAt === null) return;

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((quoteRetryAt - Date.now()) / 1000),
      );
      setQuoteRetrySeconds(remaining);

      if (remaining === 0) {
        setQuoteRetryAt(null);
        setQuoteRefreshIndex((value) => value + 1);
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [quoteRetryAt]);

  useEffect(() => {
    if (!session || currenciesLoading || currencyError) return;
    if (quoteRetryAt !== null && quoteRetryAt > Date.now()) return;

    if (!exchangeRateTargetKey) {
      setExchangeRateQuote(null);
      setQuoteError("");
      setQuoteLoading(false);
      return;
    }

    const controller = new AbortController();
    const targets = exchangeRateTargetKey.split(",");
    const timeoutId = window.setTimeout(() => {
      setQuoteLoading(true);
      setQuoteError("");
      setExchangeRateQuote(null);

      api
        .getExchangeRateQuote(
          targets,
          session.accessToken,
          controller.signal,
        )
        .then(({ quote }) => {
          setExchangeRateQuote(quote);
          setQuoteRetryAt(null);
          setQuoteRetrySeconds(0);
        })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          if (requestError instanceof ApiError) {
            const localizedMessages: Record<string, string> = {
              AI_TIMEOUT:
                "La búsqueda de cotizaciones tardó demasiado. Vuelve a intentarlo.",
              AI_PROVIDER_ERROR:
                "El proveedor no pudo completar la búsqueda de cotizaciones.",
            };
            if (requestError.code === "AI_RATE_LIMIT") {
              const retryAfter = requestError.retryAfterSeconds ?? 30;
              const limitLabel = requestError.limitType
                ? rateLimitLabels[requestError.limitType]
                : "temporal";
              setQuoteRetrySeconds(retryAfter);
              setQuoteRetryAt(Date.now() + retryAfter * 1000);
              setQuoteError(
                `El proveedor alcanzó su límite ${limitLabel}. El reintento será automático.`,
              );
              return;
            }

            setQuoteError(
              localizedMessages[requestError.code] ?? requestError.message,
            );
            return;
          }

          setQuoteError("No fue posible buscar las cotizaciones.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false);
        });
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    currenciesLoading,
    currencyError,
    exchangeRateTargetKey,
    quoteRetryAt,
    quoteRefreshIndex,
    session,
  ]);

  const handleCurrencyChange = (field: string, currencyCode: string) => {
    setSelectedCurrencies((current) => ({
      ...current,
      [field]: currencyCode,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || currencies.length === 0) return;

    if (exchangeRateTargets.length > 0 && !activeExchangeRateQuote) {
      setError("Espera a que finalice la búsqueda de cotizaciones.");
      return;
    }

    setLoading(true);
    setError("");
    setApplication(null);
    const formData = new FormData(event.currentTarget);

    const payload: LoanApplicationPayload = {
      business: {
        name: String(formData.get("businessName")),
        industry: String(formData.get("industry")),
        yearsInBusiness: Number(formData.get("yearsInBusiness")),
      },
      financialData: {
        monthlyRevenue: Number(formData.get("monthlyRevenue")),
        monthlyRevenueCurrencyCode: String(
          formData.get("monthlyRevenueCurrencyCode"),
        ),
        monthlyExpenses: Number(formData.get("monthlyExpenses")),
        monthlyExpensesCurrencyCode: String(
          formData.get("monthlyExpensesCurrencyCode"),
        ),
        existingDebt: Number(formData.get("existingDebt")),
        existingDebtCurrencyCode: String(
          formData.get("existingDebtCurrencyCode"),
        ),
        monthlyDebtPayment: Number(formData.get("monthlyDebtPayment")),
        monthlyDebtPaymentCurrencyCode: String(
          formData.get("monthlyDebtPaymentCurrencyCode"),
        ),
        requestedAmount: Number(formData.get("requestedAmount")),
        requestedAmountCurrencyCode: String(
          formData.get("requestedAmountCurrencyCode"),
        ),
        loanPurpose: String(formData.get("loanPurpose")),
        exchangeRateQuoteToken: activeExchangeRateQuote?.quoteToken,
      },
    };

    try {
      const response = await api.analyze(payload, session.accessToken);
      setApplication(response.loanApplication);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible generar el análisis financiero.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <DashboardPageHeader
          eyebrow="Nueva evaluación"
          title="Analizar solicitud"
          description={
            <>
              Proporciona el perfil del negocio y sus{" "}
              <strong className="font-semibold text-primary">
                Datos financieros.
              </strong>{" "}
              El backend conserva la divisa ISO de cada importe y calcula
              únicamente métricas financieramente comparables antes de consultar
              al modelo.
            </>
          }
        />

        <AnimatePresence mode="wait">
          {application ? (
            <motion.div
              key="result"
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-6 flex flex-col justify-between gap-4 rounded-card border border-secondary-bright/25 bg-secondary-bright/8 p-4 sm:flex-row sm:items-center">
                <span className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <CircleCheck size={18} /> Análisis generado y almacenado
                  correctamente.
                </span>
                <button
                  type="button"
                  onClick={() => setApplication(null)}
                  className="secondary-button min-h-9 bg-transparent px-3 py-2 text-xs"
                >
                  Analizar otra solicitud
                </button>
              </div>
              <AnalysisResult application={application} />
              <div className="mt-6 flex justify-end">
                <Link
                  to={`/app/lookup?id=${application.id}`}
                  className="primary-button"
                >
                  Consultar registro guardado
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection
                  icon={Building2}
                  title="Perfil del negocio"
                  description="Identidad y madurez operativa de la empresa."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nombre del negocio"
                      name="businessName"
                      placeholder="Café Norte SAS"
                      minLength={2}
                      maxLength={120}
                      defaultValue="Café Norte SAS"
                    />
                    <Field
                      label="Industria"
                      name="industry"
                      placeholder="Alimentos y bebidas"
                      minLength={2}
                      maxLength={80}
                      defaultValue="Alimentos y bebidas"
                    />
                    <Field
                      label="Años en operación"
                      name="yearsInBusiness"
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      defaultValue="5"
                    />
                  </div>
                </FormSection>

                <FormSection
                  icon={Calculator}
                  title="Datos financieros"
                  description="Cada importe conserva su moneda ISO; no se realizan conversiones implícitas."
                >
                  {currenciesLoading ? (
                    <div className="flex min-h-40 items-center justify-center text-sm text-on-surface-variant">
                      <LoaderCircle className="mr-2 animate-spin" size={18} />
                      Cargando divisas…
                    </div>
                  ) : null}

                  {!currenciesLoading && currencyError ? (
                    <div
                      role="alert"
                      className="flex min-h-40 flex-col items-center justify-center rounded-control border border-error/20 bg-error/7 p-5 text-center text-sm text-error"
                    >
                      <p>{currencyError}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrencyRefreshIndex((value) => value + 1)
                        }
                        className="secondary-button mt-4 min-h-9 bg-transparent px-3 py-2 text-xs"
                      >
                        <RefreshCw size={14} /> Reintentar
                      </button>
                    </div>
                  ) : null}

                  {!currenciesLoading && !currencyError ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CurrencyAmountField
                        label="Ingresos mensuales"
                        name="monthlyRevenue"
                        currencies={currencies}
                        currencyCode={financialCurrencyCodes.monthlyRevenue}
                        onCurrencyChange={handleCurrencyChange}
                        min="0.0001"
                        defaultValue="85000000"
                      />
                      <CurrencyAmountField
                        label="Gastos mensuales"
                        name="monthlyExpenses"
                        currencies={currencies}
                        currencyCode={financialCurrencyCodes.monthlyExpenses}
                        onCurrencyChange={handleCurrencyChange}
                        min="0"
                        defaultValue="57000000"
                      />
                      <CurrencyAmountField
                        label="Deuda existente"
                        name="existingDebt"
                        currencies={currencies}
                        currencyCode={financialCurrencyCodes.existingDebt}
                        onCurrencyChange={handleCurrencyChange}
                        min="0"
                        defaultValue="22000"
                      />
                      <CurrencyAmountField
                        label="Pago mensual de deuda"
                        name="monthlyDebtPayment"
                        currencies={currencies}
                        currencyCode={financialCurrencyCodes.monthlyDebtPayment}
                        onCurrencyChange={handleCurrencyChange}
                        min="0"
                        defaultValue="2000"
                      />
                      <CurrencyAmountField
                        label="Monto solicitado"
                        name="requestedAmount"
                        currencies={currencies}
                        currencyCode={financialCurrencyCodes.requestedAmount}
                        onCurrencyChange={handleCurrencyChange}
                        min="0.0001"
                        defaultValue="110000"
                      />
                      <div className="sm:col-span-2">
                        <ExchangeRateFields
                          targets={exchangeRateTargets}
                          quote={activeExchangeRateQuote}
                          loading={quoteLoading}
                          error={quoteError}
                          retryAfterSeconds={quoteRetrySeconds}
                          onRetry={() =>
                            setQuoteRefreshIndex((value) => value + 1)
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="loanPurpose" className="field-label">
                          Propósito del préstamo
                        </label>
                        <textarea
                          id="loanPurpose"
                          name="loanPurpose"
                          required
                          minLength={3}
                          maxLength={500}
                          rows={4}
                          defaultValue="Comprar equipamiento productivo y ampliar la distribución mayorista"
                          className="field-input resize-y"
                        />
                      </div>
                    </div>
                  ) : null}
                </FormSection>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-control border border-error/20 bg-error/7 px-4 py-3 text-sm text-error"
                  >
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    currenciesLoading ||
                    currencies.length === 0 ||
                    quoteLoading ||
                    Boolean(quoteError) ||
                    (exchangeRateTargets.length > 0 &&
                      !activeExchangeRateQuote)
                  }
                  className="primary-button w-full sm:w-auto sm:min-w-60"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  {loading
                    ? "Analizando con IA…"
                    : "Generar análisis financiero"}
                </button>
              </form>

              <aside className="space-y-4">
                <div className="data-card sticky top-6 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                    Qué obtendrás
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-primary">
                    Una lectura estructurada
                  </h2>
                  <ul className="mt-5 space-y-4">
                    {[
                      "Importes asociados a códigos ISO 4217",
                      "Flujo de caja y ratios compatibles",
                      "Salud financiera y nivel de riesgo",
                      "Factores positivos y alertas",
                      "Preguntas para revisión humana",
                      "Registro persistido con ID único",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-5 text-on-surface-variant"
                      >
                        <CircleCheck
                          className="mt-0.5 shrink-0 text-secondary"
                          size={16}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-outline-variant/60 pt-5 text-xs leading-5 text-on-surface-variant">
                    El sistema consulta cotizaciones con USD como moneda base,
                    conserva fecha y fuente, y normaliza los importes antes del
                    análisis. El resultado apoya una evaluación humana.
                  </p>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

interface FormSectionProps {
  icon: typeof Building2;
  title: string;
  description: string;
  children: ReactNode;
}

const FormSection = ({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) => (
  <section className="data-card overflow-hidden">
    <header className="flex items-center gap-4 border-b border-outline-variant/60 px-5 py-4">
      <span className="flex size-9 items-center justify-center rounded-control bg-surface-low text-primary-container">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>
      </div>
    </header>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}

const Field = ({ label, name, type = "text", ...inputProps }: FieldProps) => (
  <div>
    <label htmlFor={name} className="field-label">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      required
      className="field-input"
      {...inputProps}
    />
  </div>
);

interface CurrencyAmountFieldProps {
  label: string;
  name: string;
  currencies: Currency[];
  currencyCode: string;
  onCurrencyChange: (field: string, currencyCode: string) => void;
  min: string;
  defaultValue: string;
}

const CurrencyAmountField = ({
  label,
  name,
  currencies,
  currencyCode,
  onCurrencyChange,
  min,
  defaultValue,
}: CurrencyAmountFieldProps) => (
  <div>
    <label htmlFor={name} className="field-label">
      {label}
    </label>
    <div className="money-field">
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        required
        min={min}
        step="any"
        defaultValue={defaultValue}
        className="money-field-input"
      />
      <select
        name={`${name}CurrencyCode`}
        value={currencyCode}
        onChange={(event) => onCurrencyChange(name, event.target.value)}
        required
        aria-label={`Divisa para ${label}`}
        className="money-field-select"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const ExchangeRateFields = ({
  targets,
  quote,
  loading,
  error,
  retryAfterSeconds,
  onRetry,
}: {
  targets: string[];
  quote: ExchangeRateQuoteBundle | null;
  loading: boolean;
  error: string;
  retryAfterSeconds: number;
  onRetry: () => void;
}) => {
  const formatRate = (rate: number) =>
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    }).format(rate);

  return (
    <fieldset className="rounded-control border border-outline-variant/70 bg-surface-low/55 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
        Cotizaciones para la valuación
      </legend>
      <p className="mb-4 text-xs leading-5 text-on-surface-variant">
        USD es la moneda base. El backend busca las tasas, firma la respuesta y
        guarda su fecha y fuente; estos valores no pueden editarse.
      </p>

      {targets.length === 0 ? (
        <div className="flex items-center gap-2 rounded-control border border-secondary-bright/20 bg-secondary-bright/7 px-4 py-3 text-sm text-secondary">
          <CircleCheck size={17} /> Todos los importes ya están expresados en USD.
        </div>
      ) : null}

      {loading ? (
        <div
          className="flex min-h-28 items-center justify-center text-sm text-on-surface-variant"
          aria-live="polite"
        >
          <LoaderCircle className="mr-2 animate-spin" size={18} /> Buscando
          cotizaciones USD…
        </div>
      ) : null}

      {!loading && error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-control border border-error/20 bg-error/7 p-5 text-center text-sm text-error"
        >
          <p>{error}</p>
          {retryAfterSeconds > 0 ? (
            <p className="mt-2 text-xs text-on-surface-variant">
              Próximo intento en {formatRetryDelay(retryAfterSeconds)}.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onRetry}
            disabled={retryAfterSeconds > 0}
            className="secondary-button mt-4 min-h-9 bg-transparent px-3 py-2 text-xs"
          >
            <RefreshCw size={14} />
            {retryAfterSeconds > 0
              ? `Reintentar en ${formatRetryDelay(retryAfterSeconds)}`
              : "Reintentar búsqueda"}
          </button>
        </div>
      ) : null}

      {!loading && !error && quote ? (
        <div className="space-y-3">
          {quote.cacheStatus === "database" ||
          quote.cacheStatus === "rate-limit-fallback" ? (
            <p className="rounded-control border border-secondary-bright/20 bg-secondary-bright/7 px-3 py-2 text-xs leading-5 text-on-surface-variant">
              {quote.cacheStatus === "rate-limit-fallback"
                ? "Se reutilizó la última cotización trazable porque el proveedor alcanzó su límite temporal."
                : "Se reutilizó una cotización reciente para evitar consumo innecesario del proveedor."}
            </p>
          ) : null}
          {quote.quotes.map((exchangeRate) => {
            const pair = `USD → ${exchangeRate.toCurrencyCode}`;
            return (
              <article
                key={exchangeRate.toCurrencyCode}
                className="rounded-control border border-outline-variant/70 bg-white p-4"
              >
                <div className="grid gap-3 md:grid-cols-[0.75fr_1.25fr_1fr]">
                  <div>
                    <label
                      htmlFor={`quote-pair-${exchangeRate.toCurrencyCode}`}
                      className="field-label"
                    >
                      Par consultado
                    </label>
                    <input
                      id={`quote-pair-${exchangeRate.toCurrencyCode}`}
                      value={pair}
                      readOnly
                      aria-readonly="true"
                      className="field-input font-semibold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`quote-rate-${exchangeRate.toCurrencyCode}`}
                      className="field-label"
                    >
                      Cotización
                    </label>
                    <input
                      id={`quote-rate-${exchangeRate.toCurrencyCode}`}
                      value={`1 USD = ${formatRate(exchangeRate.rate)} ${exchangeRate.toCurrencyCode}`}
                      readOnly
                      aria-readonly="true"
                      className="field-input tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`quote-date-${exchangeRate.toCurrencyCode}`}
                      className="field-label"
                    >
                      Fecha de cotización
                    </label>
                    <div className="relative">
                      <input
                        id={`quote-date-${exchangeRate.toCurrencyCode}`}
                        value={formatDateOnly(exchangeRate.quotedAt)}
                        readOnly
                        aria-readonly="true"
                        className="field-input pr-10"
                      />
                      <CalendarDays
                        aria-hidden="true"
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-outline-variant/50 pt-3 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Fuente: {exchangeRate.sourceName} · {exchangeRate.model}
                  </span>
                  <a
                    href={exchangeRate.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                  >
                    Ver fuente <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </fieldset>
  );
};
