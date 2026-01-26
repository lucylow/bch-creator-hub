/// <reference types="vite/client" />

// Augment Vite env for Lovable/build compatibility (Vite only inlines VITE_* at build time)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_BCH_NETWORK?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_NFT_ADDRESS?: string;
  readonly VITE_MARKETPLACE_ADDRESS?: string;
  readonly VITE_SIGNER_ADDRESS?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
