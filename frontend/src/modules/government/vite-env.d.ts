/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: string
  readonly VITE_DEFAULT_LOCALE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
