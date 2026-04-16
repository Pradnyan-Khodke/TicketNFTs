/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TICKET_NFT_ADDRESS?: string;
  readonly VITE_TICKET_NFT_CHAIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
