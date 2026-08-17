import { BadgeCheck, Repeat2, ShieldAlert, TrendingUp } from "lucide-react";

import type { Reputation } from "../lib/types";
import { bpsToPercent, formatBps } from "../lib/formatters";

export function ReputationPanel({
  reputation,
  onRefresh,
  compact = false
}: {
  reputation: Reputation;
  onRefresh?: () => void;
  compact?: boolean;
}) {
  return (
    <section className={`${compact ? "" : "border-b border-line"} bg-white p-5 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Reputação</p>
          <h2 className="mt-2 text-lg font-extrabold text-ink">Sinais verificáveis</h2>
        </div>
        {onRefresh ? (
          <button className="btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" type="button" onClick={onRefresh}>
            Atualizar
          </button>
        ) : null}
      </div>

      <div className={`grid gap-px overflow-hidden rounded-lg border border-line bg-line ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
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
          value={formatBps(reputation.disputeRate)}
          tone="coral"
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted">Aprovacao direta</span>
          <span className="font-bold text-ink">
            {formatBps(reputation.directApprovalRate)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-app">
          <div
            className="h-full rounded-full bg-trust transition-all duration-500"
            style={{ width: `${bpsToPercent(reputation.directApprovalRate)}%` }}
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
    <article className={`min-w-0 ${t.bg} p-4`}>
      <div className={`mb-3 grid h-8 w-8 place-items-center rounded-lg bg-white ${t.icon}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="truncate text-[10px] font-bold uppercase text-muted">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${t.icon}`}>{value}</p>
    </article>
  );
}
