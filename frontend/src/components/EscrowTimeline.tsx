import { CheckCircle2, Circle, Clock3, Scale, UploadCloud } from "lucide-react";

import type { MarketplaceJob, MilestoneStatus } from "../lib/types";

const statusConfig: Record<
  MilestoneStatus,
  { icon: typeof Circle; color: string; bg: string }
> = {
  Pending: { icon: Circle, color: "text-muted", bg: "bg-app" },
  Submitted: { icon: UploadCloud, color: "text-chain", bg: "bg-chain/10" },
  Approved: { icon: CheckCircle2, color: "text-trust", bg: "bg-trust/10" },
  Released: { icon: CheckCircle2, color: "text-trust", bg: "bg-trust/10" },
  RevisionRequested: { icon: Clock3, color: "text-gold", bg: "bg-gold/10" },
  Disputed: { icon: Scale, color: "text-coral", bg: "bg-coral/10" },
  Resolved: { icon: CheckCircle2, color: "text-trust", bg: "bg-trust/10" }
};

export function EscrowTimeline({ job }: { job: MarketplaceJob }) {
  return (
    <section className="border-b border-line bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Escrow</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">Milestones on-chain</h2>
        </div>
        <span className="tag tag-chain">{job.escrowState}</span>
      </div>

      <div className="relative">
        {job.milestones.length === 0 && (
          <p className="text-sm text-muted">Nenhum milestone encontrado.</p>
        )}

        {job.milestones.map((milestone, i) => {
          const { icon: Icon, color, bg } = statusConfig[milestone.status];
          const isLast = i === job.milestones.length - 1;

          return (
            <div className="relative flex gap-4 pb-6 last:pb-0" key={milestone.id}>
              {!isLast && (
                <div className="absolute left-[15px] top-9 bottom-0 w-px bg-line" />
              )}

              <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{milestone.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {milestone.due}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink">USDC {milestone.amount}</p>
                    <span className={`text-xs font-medium ${color}`}>{milestone.status}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
