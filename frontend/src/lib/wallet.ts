import EthereumProvider from "@walletconnect/ethereum-provider";
import { createWalletClient, custom, type EIP1193Provider, type Hex } from "viem";
import { baseSepolia } from "viem/chains";

import { runtimeConfig } from "./config";

export type WalletKind = "injected" | "walletconnect";

export interface WalletSession {
  address: Hex;
  chainId: number;
  kind: WalletKind;
  provider: EIP1193Provider;
}

export interface AuthenticatedWalletSession extends WalletSession {
  accessToken: string;
  expiresAt: string;
}

type WalletConnectEip1193Provider = EIP1193Provider & {
  connect: () => Promise<void>;
  on: (event: "display_uri", listener: (uri: string) => void) => unknown;
  removeListener: (event: "display_uri", listener: (uri: string) => void) => unknown;
  signer?: { abortPairingAttempt?: () => void };
};

export interface WalletConnectOptions {
  onPairingUri?: (uri: string) => void;
  signal?: AbortSignal;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export async function connectWallet(
  kind: WalletKind,
  walletConnectOptions: WalletConnectOptions = {}
): Promise<WalletSession> {
  const provider = kind === "injected" ? injectedProvider() : await walletConnectProvider();
  if (kind === "walletconnect") {
    await connectWalletConnect(
      provider as WalletConnectEip1193Provider,
      walletConnectOptions
    );
  }
  await ensureBaseSepolia(provider);
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as Hex[];
  if (!accounts[0]) throw new Error("The wallet did not return an account.");
  const chainId = parseRpcChainId(
    (await provider.request({ method: "eth_chainId" })) as string
  );
  if (chainId !== runtimeConfig.chainId) {
    throw new Error("Base Sepolia is required before signing.");
  }
  return { address: accounts[0], chainId, kind, provider };
}

export async function signWalletMessage(session: WalletSession, message: string): Promise<Hex> {
  const wallet = createWalletClient({
    account: session.address,
    chain: baseSepolia,
    transport: custom(session.provider)
  });
  return wallet.signMessage({ account: session.address, message });
}

export async function ensureBaseSepolia(provider: EIP1193Provider): Promise<void> {
  const chainHex = `0x${runtimeConfig.chainId.toString(16)}`;
  const current = parseRpcChainId((await provider.request({ method: "eth_chainId" })) as string);
  if (current === runtimeConfig.chainId) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }]
    });
  } catch (error) {
    if (!isUnknownChainError(error)) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainHex,
          chainName: "Base Sepolia",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [runtimeConfig.rpcUrl],
          blockExplorerUrls: [runtimeConfig.explorerBaseUrl]
        }
      ]
    });
  }
  const switched = parseRpcChainId(
    (await provider.request({ method: "eth_chainId" })) as string
  );
  if (switched !== runtimeConfig.chainId) throw new Error("Wallet network switch was cancelled.");
}

function injectedProvider(): EIP1193Provider {
  if (!window.ethereum) throw new Error("No injected EIP-1193 wallet was found.");
  return window.ethereum;
}

async function walletConnectProvider(): Promise<WalletConnectEip1193Provider> {
  if (!runtimeConfig.walletConnectProjectId) {
    throw new Error("WalletConnect is not configured for this deployment.");
  }
  return EthereumProvider.init({
    projectId: runtimeConfig.walletConnectProjectId,
    chains: [runtimeConfig.chainId],
    showQrModal: false,
    rpcMap: { [runtimeConfig.chainId]: runtimeConfig.rpcUrl },
    metadata: {
      name: "TrustWork",
      description: "Base Sepolia milestone escrow engineering demo.",
      url: window.location.origin,
      icons: []
    }
  }) as Promise<WalletConnectEip1193Provider>;
}

async function connectWalletConnect(
  provider: WalletConnectEip1193Provider,
  options: WalletConnectOptions
): Promise<void> {
  const handlePairingUri = (uri: string) => options.onPairingUri?.(uri);
  provider.on("display_uri", handlePairingUri);

  let handleAbort: (() => void) | undefined;
  try {
    if (options.signal?.aborted) throw new Error("Wallet connection cancelled.");
    const connection = provider.connect();
    if (!options.signal) {
      await connection;
      return;
    }
    const cancellation = new Promise<never>((_, reject) => {
      handleAbort = () => {
        provider.signer?.abortPairingAttempt?.();
        reject(new Error("Wallet connection cancelled."));
      };
      options.signal?.addEventListener("abort", handleAbort, { once: true });
    });
    await Promise.race([connection, cancellation]);
  } finally {
    provider.removeListener("display_uri", handlePairingUri);
    if (handleAbort) options.signal?.removeEventListener("abort", handleAbort);
  }
}

function parseRpcChainId(value: string): number {
  const parsed = Number.parseInt(value, 16);
  if (!Number.isSafeInteger(parsed)) throw new Error("Wallet returned an invalid chain ID.");
  return parsed;
}

function isUnknownChainError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "code" in error && Number((error as { code: unknown }).code) === 4902;
}
