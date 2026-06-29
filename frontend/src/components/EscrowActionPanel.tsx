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
    <section className="mt-5 rounded-md border border-line bg-app p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Fase 02</p>
          <h2 className="text-base font-semibold text-ink">Acoes escrow reais</h2>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink"
          type="button"
          onClick={handleSync}
          title="Sincronizar eventos"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Freelancer
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            value={freelancerWallet}
            onChange={(event) => setFreelancerWallet(event.target.value)}
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Milestones USDC
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            value={amounts}
            onChange={(event) => setAmounts(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton label="Preparar" onClick={() => run("Preparar job", handlePrepareJob)} />
          <ActionButton
            label="Approve USDC"
            disabled={!preparedJob}
            onClick={() => preparedJob && run("Approve USDC", () => approveUsdc(preparedJob))}
          />
          <ActionButton
            label="createJob"
            disabled={!preparedJob}
            onClick={() => preparedJob && run("createJob", () => createPreparedJob(preparedJob))}
          />
          <ActionButton
            label="fundJob"
            disabled={!preparedJob || !config}
            onClick={() => preparedJob && config && run("fundJob", () => fundJob(config, preparedJob.job_id))}
          />
        </div>

        <div className="border-t border-line pt-3">
          <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Milestone ativo
            <input
              className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
              value={milestoneId}
              onChange={(event) => setMilestoneId(event.target.value)}
            />
          </label>
          <label className="mt-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Evidencia / notas
            <input
              className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            label="submit"
            disabled={!config}
            onClick={() => config && run("submit", () => submitMilestone(config, selectedMilestoneId, evidence))}
          />
          <ActionButton
            label="approve"
            disabled={!config}
            onClick={() => config && run("approve", () => approveMilestone(config, selectedMilestoneId))}
          />
          <ActionButton
            label="revision"
            disabled={!config}
            onClick={() => config && run("revision", () => requestRevision(config, selectedMilestoneId, evidence))}
          />
          <ActionButton
            label="dispute"
            disabled={!config}
            onClick={() => config && run("dispute", () => openDispute(config, selectedMilestoneId, evidence))}
          />
          <button
            className="col-span-2 flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!config}
            onClick={() => config && run("timeout", () => releaseAfterTimeout(config, selectedMilestoneId))}
          >
            releaseAfterTimeout
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="rounded-md border border-line bg-white p-2 text-xs leading-5 text-muted">{status}</p>
      </div>
    </section>
  );
}

function ActionButton({
  label,
  disabled,
  onClick
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-md bg-trust px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function formatRaw(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value / 1_000_000);
}
