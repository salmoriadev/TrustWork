import { CheckCircle2, Circle, Clock3, FileWarning, Scale, UploadCloud } from "lucide-react";

import type { MarketplaceJob, MilestoneStatus } from "../lib/types";

const statusIcon: Record<MilestoneStatus, typeof Circle> = {
  Pending: Circle,
  Submitted: UploadCloud,
  Approved: CheckCircle2,
  Released: CheckCircle2,
  RevisionRequested: FileWarning,
  Disputed: Scale,
  Resolved: CheckCircle2
};

export function EscrowTimeline({ job }: { job: MarketplaceJob }) {
  return (
    <section className="border-b border-line bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Escrow</p>
          <h2 className="text-lg font-semibold text-ink">Milestones on-chain</h2>
        </div>
        <span className="rounded-md border border-chain/20 bg-chain/10 px-2.5 py-1 text-xs font-semibold text-chain">
          {job.escrowState}
        </span>
      </div>

      <div className="space-y-3">
        {job.milestones.map((milestone) => {
          const Icon = statusIcon[milestone.status];
          return (
            <article
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border border-line bg-app p-3"
              key={milestone.id}
            >
              <div className="grid h-8 w-8 place-items-center rounded-md bg-white text-trust">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">{milestone.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {milestone.due}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">USDC {milestone.amount}</p>
                <p className="text-xs text-muted">{milestone.status}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
