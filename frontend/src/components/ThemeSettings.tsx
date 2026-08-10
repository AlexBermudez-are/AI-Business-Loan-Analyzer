import { AnimatePresence, motion } from "motion/react";
import { Check, Palette, X } from "lucide-react";
import { useEffect } from "react";
import { themes } from "../config/themes";
import { useTheme } from "../context/ThemeContext";

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const ThemeSettings = ({ open, onClose }: ThemeSettingsProps) => {
  const { theme: activeTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar configuración de apariencia"
            className="fixed inset-0 z-[60] bg-primary/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-settings-title"
            className="ambient-shadow fixed inset-x-4 top-[6vh] z-[70] mx-auto max-h-[88vh] max-w-2xl overflow-y-auto rounded-card border border-outline-variant bg-white"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between gap-5 border-b border-outline-variant/65 p-5 sm:p-6">
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-low text-primary-container">
                  <Palette size={19} />
                </span>
                <div>
                  <h2
                    id="theme-settings-title"
                    className="text-lg font-semibold tracking-tight text-primary"
                  >
                    Apariencia del workspace
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-on-surface-variant">
                    Elige una paleta financiera. Guardaremos únicamente su
                    nombre en este navegador.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 shrink-0 items-center justify-center rounded-control text-on-surface-variant transition hover:bg-surface-low hover:text-primary"
                aria-label="Cerrar configuración"
              >
                <X size={19} />
              </button>
            </header>

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {themes.map((theme) => {
                const selected = activeTheme === theme.name;

                return (
                  <button
                    key={theme.name}
                    type="button"
                    data-theme={theme.name}
                    onClick={() => setTheme(theme.name)}
                    aria-pressed={selected}
                    className={`rounded-card border p-4 text-left transition ${
                      selected
                        ? "border-primary-container ring-2 ring-primary-container/12"
                        : "border-outline-variant hover:border-primary-container"
                    }`}
                  >
                    <span className="mb-3 flex gap-1.5" aria-hidden="true">
                      <span className="h-5 flex-1 rounded-sm bg-primary-container" />
                      <span className="h-5 flex-1 rounded-sm bg-secondary" />
                      <span className="h-5 flex-1 rounded-sm bg-secondary-container" />
                      <span className="h-5 flex-1 rounded-sm bg-background ring-1 ring-outline-variant" />
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-sm font-semibold text-primary">
                          {theme.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-on-surface-variant">
                          {theme.description}
                        </span>
                      </span>
                      {selected ? (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
};
