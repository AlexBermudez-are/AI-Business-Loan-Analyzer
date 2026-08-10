import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  History as HistoryIcon,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { PageTransition } from "../components/PageTransition";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import {
  analysisToneClasses,
  healthLabels,
  riskLabels,
} from "../lib/analysisPresentation";
import { ApiError, api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { AnalysisHistoryEntry } from "../types/api";

const PAGE_SIZE = 3;

export const HistoryPage = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<AnalysisHistoryEntry[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const currentCursor = pageCursors[pageIndex] ?? null;

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .getHistory(session.accessToken, {
        limit: PAGE_SIZE,
        cursor: currentCursor ?? undefined,
        signal: controller.signal,
      })
      .then(({ history }) => {
        setItems(history.items);
        setHasMore(history.pageInfo.hasMore);
        setNextCursor(history.pageInfo.nextCursor);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No fue posible recuperar el historial.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentCursor, refreshIndex, session]);

  const goToNextPage = () => {
    if (!nextCursor || loading) return;
    setPageCursors((current) => {
      const updated = current.slice(0, pageIndex + 1);
      updated[pageIndex + 1] = nextCursor;
      return updated;
    });
    setPageIndex((current) => current + 1);
  };

  const goToPreviousPage = () => {
    if (pageIndex === 0 || loading) return;
    setPageIndex((current) => current - 1);
  };

  const refreshHistory = () => {
    setPageIndex(0);
    setPageCursors([null]);
    setRefreshIndex((value) => value + 1);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter(({ loanApplication }) =>
        [
          loanApplication.id,
          loanApplication.business.name,
          loanApplication.business.industry,
          loanApplication.analysis?.summary ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : items;

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <DashboardPageHeader
          eyebrow="Archivo financiero"
          title="Historial de análisis"
          description="Consulta las evaluaciones de tu usuario en páginas de tres registros y abre cualquier análisis almacenado."
          action={
            <button
              type="button"
              onClick={refreshHistory}
              disabled={loading}
              className="secondary-button"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          }
        />

        <div className="mt-7">
          <label htmlFor="historySearch" className="sr-only">
            Buscar en la página actual del historial
          </label>
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="historySearch"
              type="search"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar en esta página por empresa o industria"
              className="field-input pl-11"
            />
          </div>
        </div>

        {loading ? (
          <div className="data-card mt-7 flex min-h-64 items-center justify-center">
            <span className="flex items-center gap-3 text-sm text-on-surface-variant">
              <LoaderCircle className="animate-spin" size={20} /> Cargando
              historial…
            </span>
          </div>
        ) : null}

        {!loading && error ? (
          <p
            role="alert"
            className="mt-7 rounded-card border border-error/20 bg-error/7 p-5 text-sm text-error"
          >
            {error}
          </p>
        ) : null}

        {!loading && !error && filteredItems.length > 0 ? (
          <section className="mt-7 space-y-4" aria-label="Análisis almacenados">
            {filteredItems.map((entry, index) => (
              <HistoryCard key={entry.id} entry={entry} index={index} />
            ))}
          </section>
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <div className="mt-7 flex min-h-64 flex-col items-center justify-center rounded-card border border-dashed border-outline-variant bg-surface-low/55 px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-on-surface-variant">
              <HistoryIcon size={21} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-primary">
              {items.length === 0
                ? "Todavía no hay análisis almacenados"
                : "No encontramos coincidencias"}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              {items.length === 0
                ? "Cuando completes una evaluación aparecerá en este historial."
                : "Prueba con otro término o cambia de página."}
            </p>
          </div>
        ) : null}

        {!loading && !error && (pageIndex > 0 || hasMore) ? (
          <div className="mt-7">
            <Pagination
              page={pageIndex + 1}
              hasPrevious={pageIndex > 0}
              hasNext={hasMore}
              loading={loading}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
};

const HistoryCard = ({
  entry,
  index,
}: {
  entry: AnalysisHistoryEntry;
  index: number;
}) => {
  const application = entry.loanApplication;
  const analysis = application.analysis;
  if (!analysis) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.35 }}
      whileHover={{ y: -2 }}
    >
      <Link
        to={`/app/lookup?id=${application.id}`}
        className="data-card group block overflow-hidden transition hover:border-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        aria-label={`Consultar análisis de ${application.business.name}`}
      >
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
              <Bot size={13} /> Análisis de modelo · {analysis.model}
            </p>
            <h2 className="mt-2 truncate text-base font-semibold tracking-tight text-primary">
              {application.business.name}
            </h2>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Procesado {formatDate(analysis.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${analysisToneClasses[analysis.financialHealth]}`}
            >
              Salud {healthLabels[analysis.financialHealth]}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${analysisToneClasses[analysis.riskLevel]}`}
            >
              Riesgo {riskLabels[analysis.riskLevel]}
            </span>
            <ArrowRight
              size={17}
              className="ml-1 text-outline transition-transform group-hover:translate-x-1 group-hover:text-primary"
            />
          </div>
        </div>
        <div className="border-t border-outline-variant/60 px-5 py-4">
          <p className="line-clamp-3 text-sm leading-6 text-on-surface-variant">
            {analysis.summary}
          </p>
        </div>
      </Link>
    </motion.article>
  );
};
