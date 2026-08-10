import { motion } from "motion/react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Code2,
  Gauge,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

const dashboardImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuvfOxeDXT_Lb5T2hBM5XMb2UXMkLhsot1eAtCT9sozi0aHnEkO8oKy_nrd6E_4tqeqmJwADGa_K9MA5ptrnD4Rmv8rgGpFCGwk_39pRZMrbuqz1gk77rKagtxsYR_TC9UPAZ7igp5ogSLZgEhIVe8qWr9yDuo3r6XBBmW0_sNRHcTOwhaXPNneYkUBcvWWSzNNvxdHfHUgPEhj51SMfl0AfqtZwqBo7nO-dJdN1cYf_3_PQdFmdcE";

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const LandingPage = () => (
  <div className="min-h-screen bg-background text-on-surface">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-outline-variant/75 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav
          className="hidden items-center gap-9 md:flex"
          aria-label="Navegación pública"
        >
          <a
            className="border-b-2 border-primary pb-1 text-xs font-semibold"
            href="#platform"
          >
            Plataforma
          </a>
          <a
            className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
            href="#solutions"
          >
            Soluciones
          </a>
          <a
            className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
            href="#resources"
          >
            Recursos
          </a>
          <a
            className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
            href="#pricing"
          >
            Precios
          </a>
        </nav>
        <div className="flex items-center gap-4">
          {localStorage.getItem("sovereign-fiscal:session:v1") ? (
            <Link
              className="primary-button min-h-9 px-4 py-2 text-xs"
              to="/app"
            >
              Ir al panel
            </Link>
          ) : (
            <>
              <Link
                className="hidden text-xs font-semibold text-primary sm:block"
                to="/login"
              >
                Ingresar
              </Link>
              <Link
                className="primary-button min-h-9 px-4 py-2 text-xs"
                to="/register"
              >
                Comenzar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>

    <main className="pt-16">
      <section
        id="platform"
        className="relative mx-auto flex min-h-[840px] max-w-page flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 sm:px-6"
      >
        <div className="grid-pattern absolute inset-0 opacity-30" />
        <motion.div
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.span
            variants={reveal}
            transition={{ duration: 0.7 }}
            className="mb-6 rounded-full border border-outline-variant bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant"
          >
            Institutional grade analytics
          </motion.span>
          <motion.h1
            variants={reveal}
            transition={{ duration: 0.72 }}
            className="text-[42px] font-bold leading-[1.08] tracking-[-0.04em] text-primary sm:text-6xl"
          >
            Análisis Financiero de
            <br />
            <span className="text-on-surface-variant">Precisión Soberana.</span>
          </motion.h1>
          <motion.p
            variants={reveal}
            transition={{ duration: 0.72 }}
            className="mt-6 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg"
          >
            Plataforma analítica diseñada para entornos financieros de alto
            riesgo. Densidad de información superior, velocidad cognitiva
            inigualable y confianza institucional en cada punto de datos.
          </motion.p>
          <motion.div
            variants={reveal}
            transition={{ duration: 0.72 }}
            className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <Link className="primary-button min-w-56" to="/register">
              Solicitar acceso institucional
            </Link>
            <Link className="secondary-button min-w-36" to="/login">
              <PlayCircle size={17} /> Ver demo
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="ambient-shadow relative z-10 mx-auto mt-16 w-full max-w-5xl rounded-card border border-outline-variant bg-white p-2"
        >
          <div className="flex h-10 items-center gap-2 border-b border-surface-highest px-3">
            <span className="size-2.5 rounded-full bg-surface-highest" />
            <span className="size-2.5 rounded-full bg-surface-highest" />
            <span className="size-2.5 rounded-full bg-surface-highest" />
          </div>
          <div className="h-[260px] overflow-hidden bg-surface-low sm:h-[410px]">
            <img
              src={dashboardImage}
              alt="Dashboard financiero institucional"
              className="h-full w-full object-cover opacity-80 mix-blend-multiply"
            />
          </div>
        </motion.div>
      </section>

      <section
        id="solutions"
        className="border-y border-outline-variant bg-surface-low py-16 sm:py-20"
      >
        <div className="mx-auto max-w-page px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-primary">
              Arquitectura de Decisión
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Construido bajo un paradigma de mínima fricción y máxima densidad
              de datos.
            </p>
          </div>
          <div className="grid auto-rows-[minmax(245px,auto)] gap-4 md:grid-cols-3">
            <FeatureCard
              className="md:col-span-2"
              icon={Gauge}
              title="Sincronización en Tiempo Real"
              description="Flujos de datos de latencia ultra baja directamente desde los principales nodos de intercambio. Ejecución y visualización matemática sin retardo perceptible."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Seguridad Criptográfica"
              description="Aislamiento de datos y autenticación robusta para solicitudes financieras empresariales."
            />
            <FeatureCard
              icon={ChartNoAxesCombined}
              title="Modelado Predictivo"
              description="Inferencia estructurada para analizar salud financiera, riesgos y preguntas de seguimiento."
            />
            <div className="flex flex-col justify-between gap-8 rounded-card border border-primary bg-primary p-7 text-white md:col-span-2 md:flex-row md:items-center">
              <div className="max-w-xl">
                <span className="mb-6 flex size-11 items-center justify-center rounded-control bg-primary-muted">
                  <Code2 size={20} />
                </span>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Acceso Programático Directo
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  API REST documentada para analizar, almacenar y recuperar
                  solicitudes de préstamo.
                </p>
              </div>
              <Link
                className="secondary-button border-white/40 bg-transparent text-white hover:border-white"
                to="/register"
              >
                Explorar plataforma <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="resources"
        className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="overflow-hidden rounded-card border border-outline-variant">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface">
                <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                  Métrica de red
                </th>
                <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                  Valor actual
                </th>
                <th className="hidden px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant sm:table-cell">
                  Variación (24h)
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-xs">
              {[
                ["Volumen de análisis institucional", "42.8B", "+2.4%"],
                ["Latencia de procesamiento promedio", "4.2ms", "-0.8ms"],
                ["Disponibilidad de nodos seguros", "99.999%", "—"],
              ].map(([label, value, delta], index) => (
                <tr
                  key={label}
                  className={`${index < 2 ? "border-b border-outline-variant/60" : ""} hover:bg-surface/60`}
                >
                  <td className="px-4 py-4 font-medium text-primary">
                    {label}
                  </td>
                  <td className="px-4 py-4 text-right text-on-surface-variant">
                    {value}
                  </td>
                  <td
                    className={`hidden px-4 py-4 text-right sm:table-cell ${delta !== "—" ? "text-secondary" : "text-on-surface-variant"}`}
                  >
                    {delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer id="pricing" className="border-t border-outline-variant">
      <div className="mx-auto flex max-w-page flex-col justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
        <div>
          <Brand />
          <p className="mt-3 text-xs text-on-surface-variant">
            © 2026 Sovereign Fiscal. Precise Financial Systems.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-[11px] font-semibold text-on-surface-variant">
          <a href="#platform" className="hover:text-primary">
            Privacidad
          </a>
          <a href="#platform" className="hover:text-primary">
            Términos
          </a>
          <a href="#platform" className="hover:text-primary">
            Cumplimiento
          </a>
          <a href="#platform" className="hover:text-primary">
            Seguridad
          </a>
        </div>
      </div>
    </footer>
  </div>
);

interface FeatureCardProps {
  className?: string;
  icon: typeof Gauge;
  title: string;
  description: string;
}

const FeatureCard = ({
  className = "",
  icon: Icon,
  title,
  description,
}: FeatureCardProps) => (
  <motion.article
    className={`group rounded-card border border-outline-variant bg-white p-7 transition-colors hover:border-primary ${className}`}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.48 }}
  >
    <span className="mb-7 flex size-11 items-center justify-center rounded-control border border-outline-variant bg-surface transition group-hover:border-primary">
      <Icon size={20} strokeWidth={1.8} />
    </span>
    <h3 className="text-xl font-semibold tracking-tight text-primary">
      {title}
    </h3>
    <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
      {description}
    </p>
  </motion.article>
);
