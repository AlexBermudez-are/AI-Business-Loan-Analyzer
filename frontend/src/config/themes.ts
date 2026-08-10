export const themes = [
  {
    name: "sovereign",
    label: "Soberano",
    description: "Azul institucional y esmeralda.",
  },
  {
    name: "ocean",
    label: "Océano",
    description: "Azul profundo y cian analítico.",
  },
  {
    name: "forest",
    label: "Bosque",
    description: "Verde capital y crecimiento.",
  },
  {
    name: "graphite",
    label: "Grafito",
    description: "Carbón técnico y teal preciso.",
  },
  {
    name: "burgundy",
    label: "Borgoña",
    description: "Vino institucional y oro.",
  },
  {
    name: "indigo",
    label: "Índigo",
    description: "Índigo estratégico y violeta.",
  },
  {
    name: "copper",
    label: "Cobre",
    description: "Cobre industrial y ámbar.",
  },
  {
    name: "arctic",
    label: "Ártico",
    description: "Acero frío y azul cielo.",
  },
  {
    name: "midnight",
    label: "Medianoche",
    description: "Azul nocturno y eléctrico.",
  },
  {
    name: "plum",
    label: "Ciruela",
    description: "Ciruela ejecutiva y magenta.",
  },
] as const;

export type ThemeName = (typeof themes)[number]["name"];

export const defaultTheme: ThemeName = "sovereign";

export const isThemeName = (value: string | null): value is ThemeName =>
  themes.some((theme) => theme.name === value);
