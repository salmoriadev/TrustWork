import { useEffect, useState } from "react";
import { FileCheck2, RefreshCw } from "lucide-react";

import { createEvidence, fetchJobEvidence, type EvidenceRead } from "../lib/api";
import type { MarketplaceJob } from "../lib/types";
import type { WalletSession } from "../lib/wallet";

interface EvidencePanelProps {
  activeJob: MarketplaceJob;
  session: WalletSession | null;
}

export function EvidencePanel({ activeJob, session }: EvidencePanelProps) {
  const [body, setBody] = useState("Entrega inicial validada em ambiente local.");
  const [fileName, setFileName] = useState("delivery-notes.txt");
  const [evidence, setEvidence] = useState<EvidenceRead[]>([]);
  const [status, setStatus] = useState("Evidencias privadas ficam off-chain; apenas hashes vao ao contrato.");

  async function reloadEvidence() {
    if (!activeJob.dbId) {
      setEvidence([]);
      return;
    }
    const nextEvidence = await fetchJobEvidence(activeJob.dbId);
    setEvidence(nextEvidence);
  }

  useEffect(() => {
    reloadEvidence().catch(() => setStatus("Nao foi possivel carregar evidencias."));
  }, [activeJob.dbId]);

  async function handleCreateEvidence() {
    if (!session) {
      setStatus("Conecte uma wallet para registrar evidencia.");
      return;
    }
    if (!activeJob.dbId) {
      setStatus("O job ativo precisa vir da API para receber evidencia.");
      return;
    }

    try {
      const created = await createEvidence({
        jobId: activeJob.dbId,
        uploaderWallet: session.address,
        body,
        fileName
      });
      setStatus(`Evidencia registrada: ${created.sha256_hash.slice(0, 12)}...`);
      await reloadEvidence();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao registrar evidencia.");
    }
  }

  return (
    <section className="mt-5 rounded-md border border-line bg-app p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Fase 04</p>
          <h2 className="text-base font-semibold text-ink">Evidencias privadas</h2>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink"
          type="button"
          onClick={() => reloadEvidence().catch(() => setStatus("Falha ao recarregar."))}
          title="Recarregar evidencias"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Nome do arquivo
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Nota privada
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <button
          className="w-full rounded-md bg-gold px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!session || !activeJob.dbId}
          onClick={handleCreateEvidence}
        >
          Registrar evidencia off-chain
        </button>

        <div className="space-y-2">
          {evidence.map((item) => (
            <article className="rounded-md border border-line bg-white p-2" key={item.id}>
              <div className="flex items-start gap-2">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-trust" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{item.storage_uri}</p>
                  <p className="mt-1 break-all text-xs text-muted">sha256: {item.sha256_hash}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="rounded-md border border-line bg-white p-2 text-xs leading-5 text-muted">{status}</p>
      </div>
    </section>
  );
}
