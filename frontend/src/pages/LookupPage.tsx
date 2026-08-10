import { FileSearch, LoaderCircle, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AnalysisResult } from "../components/AnalysisResult";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";
import type { LoanApplication } from "../types/api";

export const LookupPage = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadApplication = useCallback(
    async (id: string, signal?: AbortSignal) => {
      if (!session) return;
      setLoading(true);
      setError("");
      setApplication(null);

      try {
        const response = await api.getById(id, session.accessToken, signal);
        setApplication(response.loanApplication);
      } catch (requestError) {
        if (signal?.aborted) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No fue posible recuperar la solicitud.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [session],
  );

  const queryId = searchParams.get("id")?.trim() ?? "";

  useEffect(() => {
    if (!queryId) return;
    const controller = new AbortController();
    void loadApplication(queryId, controller.signal);
    return () => controller.abort();
  }, [loadApplication, queryId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = String(formData.get("applicationId")).trim();
    setSearchParams({ id });
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <DashboardPageHeader
          eyebrow="Archivo de solicitudes"
          title="Consultar análisis"
          description="Recupera una solicitud almacenada utilizando su identificador UUID. Sólo podrás acceder a registros pertenecientes a tu cuenta."
        />

        <section className="mt-8">
          <form onSubmit={handleSubmit} className="data-card p-4 sm:p-5">
            <label htmlFor="applicationId" className="field-label">
              ID de la solicitud
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FileSearch
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
                  size={17}
                />
                <input
                  id="applicationId"
                  name="applicationId"
                  type="text"
                  required
                  defaultValue={queryId}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="field-input pl-11 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="primary-button sm:min-w-36"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Search size={17} />
                )}
                {loading ? "Buscando…" : "Consultar"}
              </button>
            </div>
          </form>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-card border border-error/20 bg-error/7 px-5 py-4 text-sm text-error"
            >
              {error}
            </p>
          ) : null}

          {application ? (
            <div className="mt-7">
              <AnalysisResult application={application} />
            </div>
          ) : null}

          {!application && !error && !loading && !queryId ? (
            <div className="mt-7 flex min-h-60 flex-col items-center justify-center rounded-card border border-dashed border-outline-variant bg-surface-low/55 px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-on-surface-variant">
                <FileSearch size={21} />
              </span>
              <h2 className="mt-4 text-base font-semibold text-primary">
                Ingresa un identificador
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
                El ID aparece al final de cada resultado y permite recuperar
                exactamente el mismo análisis almacenado.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </PageTransition>
  );
};
