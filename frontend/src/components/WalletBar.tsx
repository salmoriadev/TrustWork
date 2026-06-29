import { Bell, Wallet } from "lucide-react";

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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/80 backdrop-blur-sm px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-chain to-trust text-white shadow-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-ink">MatchEscrow</h1>
          <p className="text-xs text-muted">Base Sepolia · USDC · Escrow verificavel</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {error ? <span className="hidden text-sm text-coral md:inline">{error}</span> : null}
        <button
          className="btn-icon relative"
          type="button"
          aria-label="Notificacoes"
          title="Notificacoes"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-coral" />
        </button>
        <button
          className="btn-primary h-10"
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
