/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINIAI_API_KEY: string
  // add other env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
