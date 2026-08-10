import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./Brand";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  footer: ReactNode;
}

const trustPoints = [
  { icon: Sparkles, text: "Análisis estructurado con GPT-OSS 20B" },
  { icon: ShieldCheck, text: "Tus solicitudes permanecen bajo tu cuenta" },
  { icon: CheckCircle2, text: "Métricas determinísticas y trazables" },
];

export const AuthShell = ({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  footer,
  children,
}: AuthShellProps) => (
  <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.78fr)]">
    <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
      <div className="flex items-center justify-between">
        <Brand />
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant transition hover:text-primary"
        >
          <ArrowLeft size={15} />
          Inicio
        </Link>
      </div>

      <motion.div
        className="mx-auto flex w-full max-w-[470px] flex-1 flex-col justify-center py-14"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-[40px] sm:leading-[1.12]">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-on-surface-variant">
          {description}
        </p>

        <div className="mt-9">{children}</div>
        <div className="mt-7 text-center text-sm text-on-surface-variant">
          {footer}
        </div>
      </motion.div>
    </section>

    <aside className="auth-grid-pattern relative hidden overflow-hidden bg-primary-container p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-20 -top-24 size-80 rounded-full bg-secondary-bright/12 blur-3xl" />
      <span className="relative w-fit rounded-full border border-white/15 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/72">
        Financial intelligence workspace
      </span>

      <motion.div
        className="relative max-w-lg"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.14, duration: 0.62 }}
      >
        <h2 className="text-4xl font-semibold leading-tight tracking-[-0.035em]">
          {asideTitle}
        </h2>
        <p className="mt-5 max-w-md text-base leading-7 text-white/60">
          {asideDescription}
        </p>

        <div className="mt-10 space-y-4">
          {trustPoints.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 text-sm text-white/78"
            >
              <span className="flex size-9 items-center justify-center rounded-control border border-white/12 bg-white/6 text-secondary-container">
                <Icon size={17} />
              </span>
              {text}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="relative border-t border-white/10 pt-6 text-xs leading-5 text-white/60">
        Preanálisis informativo. La decisión final siempre corresponde a un
        analista humano.
      </div>
    </aside>
  </main>
);
