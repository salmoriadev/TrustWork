import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Clock3, FileUp, RefreshCw, Scale, WalletCards } from "lucide-react";

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
import { formatUsdcRaw, parseUsdcAmount } from "../lib/chainValues";

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
  const [status, setStatus] = useState("Pronto para preparar a próxima transação.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchEscrowConfig()
      .then(setConfig)
      .catch((error) => setStatus(error instanceof Error ? error.message : "Configuração do escrow indisponível."));
  }, []);

  useEffect(() => {
    setMilestoneId(String(activeJob.milestones[0]?.id ?? 1));
  }, [activeJob]);

  async function run(label: string, action: () => Promise<unknown>) {
    try {
      setBusy(true);
      setStatus(`${label}: confirme a transação na carteira.`);
      const result = await action();
      setStatus(`${label} concluído${result ? ` · ${String(result)}` : ""}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${label}: não foi possível concluir.`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePrepareJob() {
    try {
      setBusy(true);
      const milestoneAmountsRaw = amounts.split(",").map(parseUsdcAmount);
      if (milestoneAmountsRaw.length === 0) throw new Error("Informe ao menos um valor de milestone.");
      const prepared = await prepareJob({ freelancerWallet, milestoneAmountsRaw });
      setPreparedJob(prepared);
      setStatus(`Contrato #${prepared.job_id} preparado · ${formatUsdcRaw(prepared.total_amount_raw)} USDC.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível preparar o contrato.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    await run("Sincronização", async () => {
      await pollIndexer();
      await onRefresh();
      return "eventos atualizados";
    });
  }

  const selectedMilestoneId = milestoneId;

  return (
    <section className="surface overflow-hidden xl:sticky xl:top-24">
      <header className="flex items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
        <div>
          <p className="eyebrow">Central de ações</p>
          <h2 className="mt-2 text-lg font-extrabold text-ink">Gerenciar escrow</h2>
        </div>
        <button className="btn-icon" type="button" onClick={handleSync} disabled={busy} title="Sincronizar eventos" aria-label="Sincronizar eventos">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <ActionStep number="1" title="Preparar contrato" description="Defina o destinatário e divida o valor por entrega.">
          <div className="space-y-3">
            <div>
              <label className="label mb-1.5" htmlFor="freelancer-wallet">Carteira do freelancer</label>
              <input id="freelancer-wallet" className="input font-mono text-xs" value={freelancerWallet} onChange={(event) => setFreelancerWallet(event.target.value)} />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="milestone-values">Valores em USDC</label>
              <input id="milestone-values" className="input" value={amounts} onChange={(event) => setAmounts(event.target.value)} aria-describedby="milestone-help" />
              <p id="milestone-help" className="mt-1.5 text-xs text-muted">Separe cada milestone por vírgula.</p>
            </div>
            <button className="btn-primary w-full" type="button" disabled={busy} onClick={handlePrepareJob}>
              <WalletCards className="h-4 w-4" aria-hidden="true" /> Preparar contrato
            </button>
          </div>
        </ActionStep>

        <ActionStep number="2" title="Depositar fundos" description="Autorize o USDC e envie o saldo para o escrow.">
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <button className="btn-ghost text-xs" type="button" disabled={!preparedJob || busy} onClick={() => preparedJob && run("Autorização", () => approveUsdc(preparedJob))}>1. Autorizar</button>
            <button className="btn-ghost text-xs" type="button" disabled={!preparedJob || busy} onClick={() => preparedJob && run("Criação", () => createPreparedJob(preparedJob))}>2. Criar</button>
            <button className="btn-trust text-xs" type="button" disabled={!preparedJob || !config || busy} onClick={() => preparedJob && config && run("Depósito", () => fundJob(config, preparedJob.job_id))}>3. Depositar</button>
          </div>
        </ActionStep>

        <ActionStep number="3" title="Atualizar entrega" description="Registre uma ação para o milestone selecionado.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="active-milestone">Milestone</label>
              <input id="active-milestone" className="input" inputMode="numeric" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="evidence-hash">Hash da evidência</label>
              <input id="evidence-hash" className="input font-mono text-xs" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-ghost text-xs" type="button" disabled={!config || busy} onClick={() => config && run("Envio", () => submitMilestone(config, selectedMilestoneId, evidence))}><FileUp className="h-4 w-4" /> Enviar</button>
            <button className="btn-trust text-xs" type="button" disabled={!config || busy} onClick={() => config && run("Aprovação", () => approveMilestone(config, selectedMilestoneId))}><CheckCircle2 className="h-4 w-4" /> Aprovar</button>
            <button className="btn-ghost text-xs" type="button" disabled={!config || busy} onClick={() => config && run("Revisão", () => requestRevision(config, selectedMilestoneId, evidence))}>Pedir revisão</button>
            <button className="btn-ghost border-coral/30 text-xs text-coral" type="button" disabled={!config || busy} onClick={() => config && run("Disputa", () => openDispute(config, selectedMilestoneId, evidence))}><Scale className="h-4 w-4" /> Disputar</button>
            <button className="btn col-span-2 bg-ink text-xs text-white hover:bg-chain-deep" type="button" disabled={!config || busy} onClick={() => config && run("Liberação por prazo", () => releaseAfterTimeout(config, selectedMilestoneId))}><Clock3 className="h-4 w-4" /> Liberar após prazo</button>
          </div>
        </ActionStep>

        <p className="rounded-lg border border-line bg-app px-3 py-3 text-xs leading-relaxed text-muted" role="status">{status}</p>
      </div>
    </section>
  );
}

function ActionStep({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-xs font-bold text-white">{number}</span>
        <div><h3 className="text-sm font-extrabold text-ink">{title}</h3><p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p></div>
      </div>
      {children}
    </div>
  );
}
