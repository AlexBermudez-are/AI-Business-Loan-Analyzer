import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandProps {
  inverse?: boolean;
  compact?: boolean;
}

export const Brand = ({ inverse = false, compact = false }: BrandProps) => (
  <Link
    to="/"
    className={`inline-flex items-center gap-2.5 font-bold tracking-[-0.02em] ${
      inverse ? "text-white" : "text-primary"
    }`}
    aria-label="Sovereign Fiscal, inicio"
  >
    <span
      className={`flex size-8 items-center justify-center rounded-control border ${
        inverse
          ? "border-white/25 bg-white/10"
          : "border-outline-variant bg-white"
      }`}
    >
      <Landmark size={17} strokeWidth={1.8} />
    </span>
    {compact ? null : <span>Sovereign Fiscal</span>}
  </Link>
);
