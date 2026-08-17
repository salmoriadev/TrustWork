import { ArrowRight, Check, Clock3, Coins, X } from "lucide-react";

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
    <section className="surface overflow-hidden" aria-live="polite">
      <div className="job-art min-h-[190px] p-5 sm:min-h-[240px] sm:p-7">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <span className="rounded-md bg-white px-2.5 py-1.5 text-xs font-extrabold text-ink shadow-sm">
            {job.matchScore}% compatível
          </span>
          <span className="rounded-md border border-white/15 bg-ink/70 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur">
            {index + 1} de {total}
          </span>
        </div>
        <div className="absolute bottom-5 left-5 z-10 sm:bottom-7 sm:left-7">
          <p className="text-xs font-bold uppercase text-white/60">Projeto verificado</p>
          <p className="mt-1 max-w-[210px] text-sm font-semibold text-white">Escrow em USDC na rede Base</p>
        </div>
      </div>

      <article className="p-5 sm:p-7">
        <p className="text-sm font-semibold text-muted">{job.client}</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{job.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{job.summary}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <JobFact icon={Coins} label="Orçamento" value={job.budget} />
          <JobFact icon={Clock3} label="Entregas" value={job.duration} />
          <JobFact icon={Check} label="Status" value={formatState(job.escrowState)} fullWidth />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button className="btn-ghost sm:min-w-32" type="button" onClick={onSkip}>
            <X className="h-4 w-4 text-coral" aria-hidden="true" />
            Agora não
          </button>
          <button className="btn-primary sm:min-w-52" type="button" onClick={onMatch}>
            Tenho interesse
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </article>
    </section>
  );
}

function JobFact({ icon: Icon, label, value, fullWidth = false }: { icon: typeof Coins; label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`min-w-0 bg-app p-4 ${fullWidth ? "col-span-2 sm:col-span-1" : ""}`}>
      <Icon className="h-4 w-4 text-chain" aria-hidden="true" />
      <p className="mt-3 text-[10px] font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-ink">{value}</p>
    </div>
  );
}

function formatState(state: MarketplaceJob["escrowState"]): string {
  return ({ Created: "Criado", Funded: "Financiado", InProgress: "Em andamento", Completed: "Concluído", Cancelled: "Cancelado", Disputed: "Em disputa", Resolved: "Resolvido" })[state];
}
