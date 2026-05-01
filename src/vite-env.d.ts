/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TENANT_ID?: string;
  readonly VITE_ANALYTICS_TOKEN?: string;
  readonly VITE_ANALYTICS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
