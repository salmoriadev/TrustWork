import { Bell, ShieldCheck, Wallet } from "lucide-react";

import type { WalletSession } from "../lib/wallet";

interface WalletBarProps {
  session: WalletSession | null;
  onConnect: () => void;
  error: string | null;
}

export function WalletBar({ session, onConnect, error }: WalletBarProps) {
  const shortAddress = session
    ? `${session.address.slice(0, 6)}...${session.address.slice(-4)}`
    : "Conectar";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-ink">Freelance Escrow</h1>
          <p className="text-xs text-muted">Base Sepolia · USDC · Escrow verificavel</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {error ? <span className="hidden text-sm text-coral md:inline">{error}</span> : null}
        <button
          className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-gold"
          type="button"
          aria-label="Notificacoes"
          title="Notificacoes"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          className="flex h-10 items-center gap-2 rounded-md bg-chain px-3 text-sm font-semibold text-white transition hover:bg-ink"
          type="button"
          onClick={onConnect}
        >
          <Wallet className="h-4 w-4" aria-hidden="true" />
          <span>{shortAddress}</span>
        </button>
      </div>
    </header>
  );
}
