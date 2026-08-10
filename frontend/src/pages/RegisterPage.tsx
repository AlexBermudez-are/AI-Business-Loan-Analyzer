import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";

export const RegisterPage = () => {
  const { session, setAuthenticatedSession } = useAuth();
  const navigate = useNavigate();
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
      const response = await api.register({
        fullName: String(formData.get("fullName")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      });
      setAuthenticatedSession(response);
      navigate("/app", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos crear tu cuenta. Intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Nuevo workspace"
      title="Convierte cifras en decisiones informadas."
      description="Crea tu cuenta para analizar solicitudes, almacenar cada resultado y recuperar evaluaciones cuando las necesites."
      asideTitle="Una vista institucional para cada solicitud empresarial."
      asideDescription="Un flujo sencillo que combina métricas verificables con interpretación financiera estructurada, sin ruido ni promesas automáticas."
      footer={
        <>
          ¿Ya tienes una cuenta?{" "}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to="/login"
          >
            Ingresar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="field-label">
            Nombre completo
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="María González"
              className="field-input pl-11"
            />
          </div>
        </div>
        <div>
          <label htmlFor="registerEmail" className="field-label">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="registerEmail"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@empresa.com"
              className="field-input pl-11"
            />
          </div>
        </div>
        <div>
          <label htmlFor="registerPassword" className="field-label">
            Contraseña
          </label>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              size={17}
            />
            <input
              id="registerPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
              title="Incluye al menos ocho caracteres, una mayúscula, una minúscula y un número."
              placeholder="Mínimo 8 caracteres"
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
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            Incluye una mayúscula, una minúscula y un número.
          </p>
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
          className="primary-button mt-2 w-full"
        >
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : null}
          {loading ? "Creando cuenta…" : "Crear workspace"}
        </button>
        <p className="text-center text-[11px] leading-5 text-on-surface-variant">
          Al continuar aceptas los términos de uso y la política de privacidad.
        </p>
      </form>
    </AuthShell>
  );
};
