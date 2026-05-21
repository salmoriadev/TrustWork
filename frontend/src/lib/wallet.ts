export interface WalletSession {
  address: string;
  chainId: number;
}

export async function connectWalletConnect(): Promise<WalletSession> {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? 84532);

  if (!projectId || projectId === "replace-me") {
    throw new Error("WalletConnect project id not configured");
  }

  const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const provider = await EthereumProvider.init({
    projectId,
    chains: [chainId],
    showQrModal: true,
    metadata: {
      name: "Freelance Escrow",
      description: "Swipe-based freelance marketplace with USDC escrow.",
      url: window.location.origin,
      icons: []
    }
  });

  const accounts = (await provider.enable()) as string[];
  return {
    address: accounts[0],
    chainId
  };
}
