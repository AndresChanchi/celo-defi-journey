import { createPublicClient, createWalletClient, http, custom } from "viem";
import { celoAlfajores } from "viem/chains";

// URLs de RPC
const DEFAULT_RPC = celoAlfajores.rpcUrls.default.http[0];
const FORNO_RPC = "https://alfajores-forno.celo-testnet.org";

// Dirección del factory (deploy en Alfajores)
export const FACTORY_ADDRESS = "0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97";

// Dirección de cUSD en Alfajores
export const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

// Cliente de solo lectura (lista de bóvedas)
export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(DEFAULT_RPC),
});

// Cliente para simulaciones y llamadas de withdraw
export const fornoClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(FORNO_RPC),
});

// Cliente para firma desde MetaMask (solo en navegador)
export const walletClient =
  typeof window !== "undefined" && (window as any).ethereum
    ? createWalletClient({
        chain: celoAlfajores,
        transport: custom((window as any).ethereum),
      })
    : null;
