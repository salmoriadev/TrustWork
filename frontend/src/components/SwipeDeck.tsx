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
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Descoberta</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">Jobs recomendados</h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-app px-3 py-1.5">
          <span className="text-sm font-bold text-trust">{index + 1}</span>
          <span className="text-xs text-muted">/ {total}</span>
        </div>
      </div>

      <div className="animate-slide-up p-5">
        <article className="overflow-hidden rounded-xl border border-line bg-white shadow-elevated">
          <div className="job-visual relative h-40 border-b border-line">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <span className="tag tag-trust">Match {job.matchScore}%</span>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">{job.client}</p>
                <h3 className="mt-1 text-xl font-bold leading-tight text-ink">{job.title}</h3>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted">{job.summary}</p>

            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span className="tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-app p-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Budget</p>
                <p className="mt-0.5 text-sm font-bold text-ink">{job.budget}</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Status</p>
                <p className="mt-0.5 text-sm font-bold text-ink">{job.escrowState}</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{job.duration}</p>
                <p className="mt-0.5 text-sm font-bold text-ink">{job.skills.length} skills</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                className="grid h-14 w-14 place-items-center rounded-xl border-2 border-line bg-white text-coral transition-all duration-150 hover:border-coral hover:shadow-lg hover:-translate-x-1 active:scale-95"
                type="button"
                onClick={onSkip}
                aria-label="Rejeitar job"
                title="Rejeitar"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Arraste ou clique</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </div>

              <button
                className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-trust to-emerald-600 text-white shadow-lg shadow-trust/25 transition-all duration-150 hover:shadow-xl hover:translate-x-1 active:scale-95"
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
