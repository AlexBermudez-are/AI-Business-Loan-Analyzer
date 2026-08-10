import { AnimatePresence, motion } from "motion/react";
import {
  FileSearch,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./Brand";
import { ThemeSettings } from "./ThemeSettings";

const navigation = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/analyze", label: "Analizar solicitud", icon: PlusCircle },
  { to: "/app/history", label: "Historial", icon: HistoryIcon },
  { to: "/app/lookup", label: "Consultar análisis", icon: FileSearch },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  onOpenSettings: () => void;
}

const SidebarContent = ({
  onNavigate,
  onOpenSettings,
}: SidebarContentProps) => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const initials = session?.user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col bg-primary-container text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Brand inverse />
      </div>

      <nav
        className="flex-1 space-y-1 px-3 py-6"
        aria-label="Navegación principal"
      >
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
          Workspace
        </p>
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-control px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-primary-container"
                  : "text-white/68 hover:bg-white/8 hover:text-white"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-primary-container">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {session?.user.fullName}
            </span>
            <span className="block truncate text-xs text-white/72">
              {session?.user.email}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenSettings();
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-control text-white/58 transition hover:bg-white/10 hover:text-white"
            aria-label="Configurar apariencia"
            title="Configurar apariencia"
          >
            <Settings size={17} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm text-white/62 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] lg:block">
        <SidebarContent onOpenSettings={() => setSettingsOpen(true)} />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant/70 bg-background/92 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-10 items-center justify-center rounded-control border border-outline-variant bg-white"
          aria-label="Abrir navegación"
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar navegación"
              className="fixed inset-0 z-40 bg-primary/45 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.38 }}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-5 z-10 flex size-9 items-center justify-center rounded-control text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar navegación"
              >
                <X size={20} />
              </button>
              <SidebarContent
                onNavigate={() => setMobileOpen(false)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <main className="min-h-screen lg:ml-[280px]">
        <Outlet />
      </main>

      <ThemeSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
