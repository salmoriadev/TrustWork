import { Bell, Layers3, Wallet } from "lucide-react";

import type { WalletSession } from "../lib/wallet";
import { runtimeConfig } from "../lib/config";
import { formatAddress } from "../lib/formatters";

interface WalletBarProps {
  session: WalletSession | null;
  onConnect: () => void;
  error: string | null;
}

export function WalletBar({ session, onConnect, error }: WalletBarProps) {
  const shortAddress = session ? formatAddress(session.address) : "Conectar carteira";

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
          <span>{runtimeConfig.networkName}</span>
          <span className="text-line">/</span>
          <span>USDC</span>
        </div>

        <div className="flex items-center gap-2">
          {error ? <span className="hidden max-w-sm truncate text-xs font-semibold text-coral sm:block" role="alert">{error}</span> : null}
          <button className="btn-icon hidden sm:grid" type="button" aria-label="Notificações" title="Notificações">
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="absolute mt-[-24px] ml-[24px] h-2 w-2 rounded-full bg-coral ring-2 ring-white" />
          </button>
          <button className="btn-primary whitespace-nowrap" type="button" onClick={onConnect}>
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{shortAddress}</span>
            <span className="sm:hidden">Carteira</span>
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-coral sm:hidden" role="alert">{error}</p> : null}
    </header>
  );
}
