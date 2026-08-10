import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const Pagination = ({
  page,
  hasPrevious,
  hasNext,
  loading = false,
  onPrevious,
  onNext,
}: PaginationProps) => (
  <nav
    className="flex items-center justify-center gap-3"
    aria-label="Paginación del historial"
  >
    <button
      type="button"
      onClick={onPrevious}
      disabled={!hasPrevious || loading}
      className="secondary-button min-h-10 px-3"
      aria-label="Página anterior"
    >
      <ChevronLeft size={17} />
      <span className="hidden sm:inline">Anterior</span>
    </button>
    <span
      className="min-w-24 text-center text-xs font-semibold text-on-surface-variant"
      aria-current="page"
    >
      Página {page}
    </span>
    <button
      type="button"
      onClick={onNext}
      disabled={!hasNext || loading}
      className="secondary-button min-h-10 px-3"
      aria-label="Página siguiente"
    >
      <span className="hidden sm:inline">Siguiente</span>
      <ChevronRight size={17} />
    </button>
  </nav>
);
