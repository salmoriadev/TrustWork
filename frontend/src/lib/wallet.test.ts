import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  connect: vi.fn(),
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  abortPairingAttempt: vi.fn(),
  listeners: new Map<string, (value: string) => void>()
}));

vi.mock("@walletconnect/ethereum-provider", () => ({
  default: { init: mocks.init }
}));

vi.mock("./config", () => ({
  runtimeConfig: {
    chainId: 84532,
    explorerBaseUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
    walletConnectProjectId: "test-project-id"
  }
}));

import { connectWallet } from "./wallet";

describe("connectWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listeners.clear();
    vi.stubGlobal("window", { location: { origin: "https://trustwork.example" } });
    let connected = false;
    mocks.connect.mockImplementation(async () => {
      mocks.listeners.get("display_uri")?.("wc:test-pairing-uri");
      connected = true;
    });
    mocks.on.mockImplementation((event: string, listener: (value: string) => void) => {
      mocks.listeners.set(event, listener);
    });
    mocks.removeListener.mockImplementation((event: string) => {
      mocks.listeners.delete(event);
    });
    mocks.request.mockImplementation(async ({ method }: { method: string }) => {
      if (!connected) throw new Error("request called before connect");
      if (method === "eth_chainId") return "0x14a34";
      if (method === "eth_requestAccounts") {
        return ["0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470"];
      }
      throw new Error(`Unexpected RPC method: ${method}`);
    });
    mocks.init.mockResolvedValue({
      connect: mocks.connect,
      request: mocks.request,
      on: mocks.on,
      removeListener: mocks.removeListener,
      signer: { abortPairingAttempt: mocks.abortPairingAttempt }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("connects WalletConnect before requesting chain or accounts", async () => {
    const session = await connectWallet("walletconnect");

    expect(mocks.init).toHaveBeenCalledWith(expect.objectContaining({ showQrModal: false }));
    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(mocks.connect.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.request.mock.invocationCallOrder[0]
    );
    expect(session).toMatchObject({
      address: "0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470",
      chainId: 84532,
      kind: "walletconnect"
    });
  });

  it("exposes the ephemeral pairing URI without persisting it", async () => {
    const onPairingUri = vi.fn();

    await connectWallet("walletconnect", { onPairingUri });

    expect(onPairingUri).toHaveBeenCalledWith("wc:test-pairing-uri");
    expect(mocks.removeListener).toHaveBeenCalledWith("display_uri", expect.any(Function));
  });

  it("aborts a pending WalletConnect pairing when the dialog is cancelled", async () => {
    mocks.connect.mockImplementation(() => new Promise<void>(() => undefined));
    const controller = new AbortController();
    const connection = connectWallet("walletconnect", { signal: controller.signal });

    await vi.waitFor(() => expect(mocks.connect).toHaveBeenCalledOnce());
    controller.abort();

    await expect(connection).rejects.toThrow("Wallet connection cancelled.");
    expect(mocks.abortPairingAttempt).toHaveBeenCalledOnce();
  });
});
