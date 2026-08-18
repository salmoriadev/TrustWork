import { Layers3, QrCode, Wallet } from "lucide-react";

import { runtimeConfig } from "../lib/config";
import { formatAddress } from "../lib/formatters";
import type { AuthenticatedWalletSession, WalletKind } from "../lib/wallet";

interface WalletBarProps {
  session: AuthenticatedWalletSession | null;
  onConnect: (kind: WalletKind) => void;
  error: string | null;
}

export function WalletBar({ session, onConnect, error }: WalletBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
            <Layers3 className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-ink">TrustWork</p>
            <p className="truncate text-[10px] font-semibold uppercase text-muted">{runtimeConfig.networkName}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
          <span className="h-2 w-2 rounded-full bg-trust" />
          <span>Base Sepolia</span><span className="text-line">/</span><span>Test USDC</span>
        </div>

        <div className="flex items-center gap-2">
          {error ? <span className="hidden max-w-sm truncate text-xs font-semibold text-coral sm:block" role="alert">{error}</span> : null}
          {session ? (
            <span className="btn-primary whitespace-nowrap"><Wallet className="h-4 w-4" aria-hidden="true" />{formatAddress(session.address)}</span>
          ) : (
            <>
              <button className="btn-primary whitespace-nowrap" type="button" onClick={() => onConnect("injected")}>
                <Wallet className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Browser wallet</span><span className="sm:hidden">Wallet</span>
              </button>
              <button className="btn-ghost whitespace-nowrap" type="button" onClick={() => onConnect("walletconnect")}>
                <QrCode className="h-4 w-4" aria-hidden="true" /><span className="hidden md:inline">WalletConnect</span>
              </button>
            </>
          )}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-coral sm:hidden" role="alert">{error}</p> : null}
    </header>
  );
}
