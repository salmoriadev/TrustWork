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
    <section className="border-b border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Reputacao</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">Sinais verificaveis</h2>
        </div>
        {onRefresh ? (
          <button className="btn-ghost text-xs !px-3 !py-1.5" type="button" onClick={onRefresh}>
            Recalcular
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
          <span className="font-medium text-muted">Aprovacao direta</span>
          <span className="font-bold text-ink">
            {(reputation.directApprovalRate / 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-app overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-trust to-emerald-400 transition-all duration-500"
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
  const tones = {
    trust: { icon: "text-trust", bg: "bg-trust/10", border: "border-trust/15" },
    chain: { icon: "text-chain", bg: "bg-chain/10", border: "border-chain/15" },
    gold: { icon: "text-gold", bg: "bg-gold/10", border: "border-gold/15" },
    coral: { icon: "text-coral", bg: "bg-coral/10", border: "border-coral/15" }
  };
  const t = tones[tone];

  return (
    <article className={`rounded-xl border ${t.border} ${t.bg} p-4`}>
      <div className={`mb-3 grid h-8 w-8 place-items-center rounded-lg bg-white ${t.icon} shadow-sm`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${t.icon}`}>{value}</p>
    </article>
  );
}
