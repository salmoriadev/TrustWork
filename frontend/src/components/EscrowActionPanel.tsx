import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";

import { fetchEscrowConfig, pollIndexer, prepareJob, type EscrowConfig, type PreparedJob } from "../lib/api";
import {
  approveMilestone,
  approveUsdc,
  createPreparedJob,
  fundJob,
  openDispute,
  releaseAfterTimeout,
  requestRevision,
  submitMilestone
} from "../lib/contracts";
import type { MarketplaceJob } from "../lib/types";

interface EscrowActionPanelProps {
  activeJob: MarketplaceJob;
  onRefresh: () => Promise<void>;
}

const defaultFreelancer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

export function EscrowActionPanel({ activeJob, onRefresh }: EscrowActionPanelProps) {
  const [config, setConfig] = useState<EscrowConfig | null>(null);
  const [freelancerWallet, setFreelancerWallet] = useState(defaultFreelancer);
  const [amounts, setAmounts] = useState("1200,800");
  const [preparedJob, setPreparedJob] = useState<PreparedJob | null>(null);
  const [milestoneId, setMilestoneId] = useState(String(activeJob.milestones[0]?.id ?? 1));
  const [evidence, setEvidence] = useState("delivery-hash-demo");
  const [status, setStatus] = useState("Pronto para preparar transacoes.");

  useEffect(() => {
    fetchEscrowConfig()
      .then(setConfig)
      .catch((error) => setStatus(error instanceof Error ? error.message : "Falha ao carregar config"));
  }, []);

  useEffect(() => {
    setMilestoneId(String(activeJob.milestones[0]?.id ?? 1));
  }, [activeJob]);

  async function run(label: string, action: () => Promise<unknown>) {
    try {
      setStatus(`${label}: aguardando assinatura...`);
      const result = await action();
      setStatus(`${label}: enviado ${String(result)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${label}: falhou`);
    }
  }

  async function handlePrepareJob() {
    const milestoneAmountsRaw = amounts
      .split(",")
      .map((value) => Math.round(Number(value.trim()) * 1_000_000))
      .filter((value) => value > 0);
    const prepared = await prepareJob({ freelancerWallet, milestoneAmountsRaw });
    setPreparedJob(prepared);
    setStatus(`Job preparado: #${prepared.job_id} (${formatRaw(prepared.total_amount_raw)} USDC)`);
  }

  async function handleSync() {
    await run("Sincronizar eventos", async () => {
      await pollIndexer();
      await onRefresh();
      return "ok";
    });
  }

  const selectedMilestoneId = Number(milestoneId);

  return (
    <section className="card-flat p-4 mt-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Acoes escrow</p>
          <h2 className="mt-0.5 text-base font-bold text-ink">Transacoes on-chain</h2>
        </div>
        <button className="btn-icon h-9 w-9" type="button" onClick={handleSync} title="Sincronizar eventos">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label mb-1">Freelancer</label>
            <input className="input font-mono text-xs" value={freelancerWallet} onChange={(event) => setFreelancerWallet(event.target.value)} />
          </div>
          <div>
            <label className="label mb-1">Milestones USDC</label>
            <input className="input" value={amounts} onChange={(event) => setAmounts(event.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary text-xs" onClick={() => run("Preparar job", handlePrepareJob)}>Preparar</button>
          <button className="btn-ghost text-xs" disabled={!preparedJob} onClick={() => preparedJob && run("Approve USDC", () => approveUsdc(preparedJob))}>Approve USDC</button>
          <button className="btn-ghost text-xs" disabled={!preparedJob} onClick={() => preparedJob && run("createJob", () => createPreparedJob(preparedJob))}>createJob</button>
          <button className="btn-ghost text-xs" disabled={!preparedJob || !config} onClick={() => preparedJob && config && run("fundJob", () => fundJob(config, preparedJob.job_id))}>fundJob</button>
        </div>

        <div className="border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label mb-1">Milestone ativo</label>
              <input className="input" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} />
            </div>
            <div>
              <label className="label mb-1">Evidencia</label>
              <input className="input font-mono text-xs" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost text-xs" disabled={!config} onClick={() => config && run("submit", () => submitMilestone(config, selectedMilestoneId, evidence))}>submit</button>
          <button className="btn-trust text-xs" disabled={!config} onClick={() => config && run("approve", () => approveMilestone(config, selectedMilestoneId))}>approve</button>
          <button className="btn-ghost text-xs" disabled={!config} onClick={() => config && run("revision", () => requestRevision(config, selectedMilestoneId, evidence))}>revision</button>
          <button className="btn-ghost !text-coral !border-coral/30 text-xs" disabled={!config} onClick={() => config && run("dispute", () => openDispute(config, selectedMilestoneId, evidence))}>dispute</button>
          <button
            className="col-span-2 btn bg-ink text-white hover:bg-chain text-xs"
            type="button"
            disabled={!config}
            onClick={() => config && run("timeout", () => releaseAfterTimeout(config, selectedMilestoneId))}
          >
            releaseAfterTimeout
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="rounded-lg bg-app px-3 py-2.5 text-xs leading-relaxed text-muted">{status}</p>
      </div>
    </section>
  );
}

function formatRaw(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value / 1_000_000);
}
