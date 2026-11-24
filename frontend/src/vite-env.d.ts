/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_API_KEY: string;
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_MAPTILER_API_KEY?: string;
  readonly VITE_STADIA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
