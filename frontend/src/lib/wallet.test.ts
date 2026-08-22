import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  connect: vi.fn(),
  request: vi.fn()
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
    vi.stubGlobal("window", { location: { origin: "https://trustwork.example" } });
    let connected = false;
    mocks.connect.mockImplementation(async () => {
      connected = true;
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
      request: mocks.request
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("connects WalletConnect before requesting chain or accounts", async () => {
    const session = await connectWallet("walletconnect");

    expect(mocks.init).toHaveBeenCalledWith(
      expect.objectContaining({ relayUrl: "wss://relay.walletconnect.org" })
    );
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
});
