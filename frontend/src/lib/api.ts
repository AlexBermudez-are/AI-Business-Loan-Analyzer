import type {
  ApiErrorShape,
  AnalysisHistoryPage,
  AuthResponse,
  Currency,
  ExchangeRateQuoteBundle,
  LoanApplication,
  LoanApplicationPayload,
} from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000/api";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterSeconds?: number;
  readonly limitType?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: NonNullable<ApiErrorShape["error"]>["details"],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    const parsedRetryAfter = Number(details?.retryAfter);
    if (Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0) {
      this.retryAfterSeconds = Math.ceil(parsedRetryAfter);
    }
    this.limitType = details?.limitType;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorShape;

  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? "No fue posible completar la solicitud.",
      payload.error?.code ?? "REQUEST_ERROR",
      response.status,
      payload.error?.details,
    );
  }

  return payload as T;
};

export const api = {
  login: (credentials: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (account: { fullName: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(account),
    }),

  getCurrencies: (token: string, signal?: AbortSignal) =>
    request<{ currencies: Currency[] }>("/currencies", { token, signal }),

  getExchangeRateQuote: (
    targetCurrencyCodes: string[],
    token: string,
    signal?: AbortSignal,
  ) =>
    request<{ quote: ExchangeRateQuoteBundle }>("/exchange-rates/quote", {
      method: "POST",
      body: JSON.stringify({ targetCurrencyCodes }),
      token,
      signal,
    }),

  analyze: (payload: LoanApplicationPayload, token: string) =>
    request<{ message: string; loanApplication: LoanApplication }>(
      "/loan-applications/analyze",
      {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      },
    ),

  getLatest: (token: string, signal?: AbortSignal) =>
    request<{ loanApplication: LoanApplication | null }>(
      "/loan-applications/latest",
      { token, signal },
    ),

  getHistory: (
    token: string,
    options: { limit?: number; cursor?: string; signal?: AbortSignal } = {},
  ) => {
    const searchParams = new URLSearchParams({
      limit: String(options.limit ?? 3),
    });
    if (options.cursor) searchParams.set("cursor", options.cursor);

    return request<{ history: AnalysisHistoryPage }>(
      `/loan-applications/history?${searchParams.toString()}`,
      { token, signal: options.signal },
    );
  },

  getById: (id: string, token: string, signal?: AbortSignal) =>
    request<{ loanApplication: LoanApplication }>(
      `/loan-applications/${encodeURIComponent(id)}`,
      { token, signal },
    ),
};
