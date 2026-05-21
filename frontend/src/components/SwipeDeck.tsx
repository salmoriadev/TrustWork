import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import type { MarketplaceJob } from "../lib/types";

interface SwipeDeckProps {
  job: MarketplaceJob;
  index: number;
  total: number;
  onSkip: () => void;
  onMatch: () => void;
}

export function SwipeDeck({ job, index, total, onSkip, onMatch }: SwipeDeckProps) {
  return (
    <section className="min-h-[520px] border-r border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Descoberta</p>
          <h2 className="text-lg font-semibold text-ink">Jobs recomendados</h2>
        </div>
        <p className="text-sm font-semibold text-trust">
          {index + 1}/{total}
        </p>
      </div>

      <div className="p-4">
        <article className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
          <div className="job-visual h-36 border-b border-line" />
          <div className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">{job.client}</p>
                <h3 className="mt-1 text-2xl font-bold leading-tight text-ink">{job.title}</h3>
              </div>
              <div className="min-w-20 rounded-md border border-trust/30 bg-trust/10 px-3 py-2 text-center">
                <p className="text-xs text-muted">match</p>
                <p className="text-xl font-bold text-trust">{job.matchScore}</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted">{job.summary}</p>

            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  className="rounded-md border border-line bg-app px-2.5 py-1 text-xs font-medium text-ink"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="budget" value={job.budget} />
              <Metric label="escrow" value={job.escrowState} />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                className="grid h-12 w-12 place-items-center rounded-md border border-line bg-white text-coral transition hover:border-coral"
                type="button"
                onClick={onSkip}
                aria-label="Rejeitar job"
                title="Rejeitar"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                swipe
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </div>
              <button
                className="grid h-12 w-12 place-items-center rounded-md bg-trust text-white transition hover:bg-ink"
                type="button"
                onClick={onMatch}
                aria-label="Aceitar job"
                title="Aceitar"
              >
                <Check className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-line pl-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
