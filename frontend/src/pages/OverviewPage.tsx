import { motion } from "motion/react";
import {
  ArrowRight,
  CircleDollarSign,
  FileSearch,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnalysisResult } from "../components/AnalysisResult";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";
import type { LoanApplication } from "../types/api";

export const OverviewPage = () => {
  const { session } = useAuth();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .getLatest(session.accessToken, controller.signal)
      .then((response) => setApplication(response.loanApplication))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No fue posible recuperar el último análisis.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshIndex, session]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <DashboardPageHeader
          eyebrow="Workspace financiero"
          title={`Hola, ${session?.user.fullName.split(" ")[0] ?? "analista"}`}
          description="Revisa el estado de tu evaluación más reciente o inicia una nueva solicitud empresarial."
          action={
            <Link to="/app/analyze" className="primary-button">
              <Plus size={17} /> Nueva solicitud
            </Link>
          }
        />

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-primary">
                Último análisis
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Respuesta más reciente almacenada en PostgreSQL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshIndex((value) => value + 1)}
              disabled={loading}
              className="secondary-button min-h-9 px-3 py-2 text-xs"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="data-card flex min-h-64 items-center justify-center">
              <span className="flex items-center gap-3 text-sm text-on-surface-variant">
                <LoaderCircle className="animate-spin" size={20} />{" "}
                Sincronizando análisis…
              </span>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-card border border-error/20 bg-error/7 p-5 text-sm text-error">
              {error}
            </div>
          ) : null}

          {!loading && !error && application ? (
            <div className="space-y-5">
              <AnalysisResult application={application} compact />
              <div className="flex justify-end">
                <Link
                  to={`/app/lookup?id=${application.id}`}
                  className="secondary-button"
                >
                  Ver evaluación completa <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && !error && !application ? (
            <motion.div
              className="data-card relative overflow-hidden p-8 sm:p-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="grid-pattern absolute inset-0 opacity-25" />
              <div className="relative max-w-xl">
                <span className="flex size-12 items-center justify-center rounded-control bg-primary-container text-white">
                  <CircleDollarSign size={23} />
                </span>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-primary">
                  Tu workspace está listo.
                </h2>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                  Carga la primera solicitud para generar métricas financieras,
                  factores positivos, riesgos y preguntas de seguimiento.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link to="/app/analyze" className="primary-button">
                    <Plus size={17} /> Analizar solicitud
                  </Link>
                  <Link to="/app/lookup" className="secondary-button">
                    <FileSearch size={17} /> Consultar por ID
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </section>
      </div>
    </PageTransition>
  );
};
