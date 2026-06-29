import { BadgeCheck, Repeat2, ShieldAlert, TrendingUp } from "lucide-react";

import type { Reputation } from "../lib/types";

export function ReputationPanel({
  reputation,
  onRefresh
}: {
  reputation: Reputation;
  onRefresh?: () => void;
}) {
  return (
    <section className="bg-white p-4 md:p-5">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Reputacao</p>
        <h2 className="text-lg font-semibold text-ink">Sinais verificaveis</h2>
        {onRefresh ? (
          <button
            className="mt-2 rounded-md border border-line bg-app px-2 py-1 text-xs font-semibold text-ink"
            type="button"
            onClick={onRefresh}
          >
            Recalcular snapshot
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Signal
          icon={BadgeCheck}
          label="jobs concluidos"
          value={String(reputation.completedJobs)}
          tone="trust"
        />
        <Signal icon={TrendingUp} label="volume" value={reputation.volumeTier} tone="chain" />
        <Signal
          icon={Repeat2}
          label="clientes recorrentes"
          value={String(reputation.repeatClients)}
          tone="gold"
        />
        <Signal
          icon={ShieldAlert}
          label="disputas"
          value={`${(reputation.disputeRate / 100).toFixed(1)}%`}
          tone="coral"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted">aprovacao direta</span>
          <span className="font-semibold text-ink">
            {(reputation.directApprovalRate / 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-md bg-app">
          <div
            className="h-2 rounded-md bg-trust"
            style={{ width: `${Math.min(reputation.directApprovalRate / 100, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

interface SignalProps {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
  tone: "trust" | "chain" | "gold" | "coral";
}

function Signal({ icon: Icon, label, value, tone }: SignalProps) {
  const toneClass = {
    trust: "text-trust bg-trust/10",
    chain: "text-chain bg-chain/10",
    gold: "text-gold bg-gold/10",
    coral: "text-coral bg-coral/10"
  }[tone];

  return (
    <article className="rounded-md border border-line bg-app p-3">
      <div className={`mb-3 grid h-8 w-8 place-items-center rounded-md ${toneClass}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </article>
  );
}
