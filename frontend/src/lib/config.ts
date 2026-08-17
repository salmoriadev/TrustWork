import { isAddress } from "viem";

type AppEnvironment = "development" | "ci" | "staging" | "production";

const environment = resolveEnvironment(import.meta.env.MODE);
const deployable = environment === "staging" || environment === "production";

export const runtimeConfig = {
  environment,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  chainId: parseChainId(import.meta.env.VITE_CHAIN_ID ?? "84532"),
  networkName: networkName(parseChainId(import.meta.env.VITE_CHAIN_ID ?? "84532")),
  escrowContractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS ?? "",
  usdcContractAddress: import.meta.env.VITE_USDC_CONTRACT_ADDRESS ?? "",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  demoDataEnabled:
    environment === "development" && import.meta.env.VITE_ENABLE_DEMO_DATA === "true"
} as const;

validateRuntimeConfig();

function resolveEnvironment(mode: string): AppEnvironment {
  if (["development", "ci", "staging", "production"].includes(mode)) {
    return mode as AppEnvironment;
  }
  throw new Error(`Unsupported Vite mode: ${mode}`);
}

function parseChainId(value: string): number {
  if (!/^\d+$/.test(value)) throw new Error("VITE_CHAIN_ID must be a positive integer");
  const chainId = Number(value);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("VITE_CHAIN_ID must be a positive safe integer");
  }
  return chainId;
}

function networkName(chainId: number): string {
  const names: Record<number, string> = {
    31337: "Anvil local",
    8453: "Base Mainnet",
    84532: "Base Sepolia"
  };
  return names[chainId] ?? `Chain ${chainId}`;
}

function validateRuntimeConfig(): void {
  if (!deployable) return;
  if (runtimeConfig.demoDataEnabled) {
    throw new Error("Demo data cannot be enabled in staging or production");
  }
  if (!runtimeConfig.apiBaseUrl.startsWith("https://")) {
    throw new Error("VITE_API_BASE_URL must use HTTPS in deployable environments");
  }
  if (!isAddress(runtimeConfig.escrowContractAddress) || isZeroAddress(runtimeConfig.escrowContractAddress)) {
    throw new Error("VITE_ESCROW_CONTRACT_ADDRESS must be a non-zero Ethereum address");
  }
  if (!isAddress(runtimeConfig.usdcContractAddress) || isZeroAddress(runtimeConfig.usdcContractAddress)) {
    throw new Error("VITE_USDC_CONTRACT_ADDRESS must be a non-zero Ethereum address");
  }
  if (!runtimeConfig.walletConnectProjectId || runtimeConfig.walletConnectProjectId === "replace-me") {
    throw new Error("VITE_WALLETCONNECT_PROJECT_ID must be configured");
  }
}

function isZeroAddress(address: string): boolean {
  return /^0x0{40}$/i.test(address);
}
