import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";

export const LoginPage = () => {
  const { session, setAuthenticatedSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session) return <Navigate to="/app" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await api.login({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      });
      setAuthenticatedSession(response);
      const destination = (location.state as { from?: string } | null)?.from;
      navigate(destination ?? "/app", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos iniciar sesión. Intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Acceso institucional"
      title="Bienvenido de nuevo."
      description="Ingresa a tu espacio de análisis y continúa donde dejaste tu última evaluación financiera."
      asideTitle="Cada decisión comienza con una lectura más precisa."
      asideDescription="Transforma datos financieros en factores claros, riesgos observables y preguntas útiles para una revisión humana."
      footer={
        <>
          ¿Aún no tienes una cuenta?{" "}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to="/register"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="field-label">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue="demo@businessloan.local"
              className="field-input pl-11"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="field-label">
              Contraseña
            </label>
            <span className="mb-2 text-xs text-on-surface-variant">
              DemoPass123!
            </span>
          </div>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              defaultValue="DemoPass123!"
              className="field-input px-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-outline hover:text-primary"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-control border border-error/20 bg-error/7 px-3 py-2.5 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="primary-button w-full"
        >
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : null}
          {loading ? "Ingresando…" : "Ingresar al workspace"}
        </button>
      </form>
    </AuthShell>
  );
};
