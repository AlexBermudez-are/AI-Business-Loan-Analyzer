/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_OPERATING_CURRENCY?: string;
  readonly VITE_DEFAULT_FINANCING_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
