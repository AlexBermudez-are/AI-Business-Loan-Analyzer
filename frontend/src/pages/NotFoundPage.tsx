import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

export const NotFoundPage = () => (
  <main className="grid-pattern flex min-h-screen items-center justify-center bg-background px-5">
    <div className="data-card ambient-shadow max-w-lg p-8 text-center sm:p-12">
      <Brand />
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary">
        Esta vista no existe.
      </h1>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
        La ruta solicitada no pertenece al workspace financiero.
      </p>
      <Link to="/" className="primary-button mt-7">
        <ArrowLeft size={17} /> Volver al inicio
      </Link>
    </div>
  </main>
);
