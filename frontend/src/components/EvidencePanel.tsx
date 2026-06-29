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
    <section className="card-flat p-4 mt-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evidencias</p>
          <h2 className="mt-0.5 text-base font-bold text-ink">Registro privado</h2>
        </div>
        <button
          className="btn-icon h-9 w-9"
          type="button"
          onClick={() => reloadEvidence().catch(() => setStatus("Falha ao recarregar."))}
          title="Recarregar evidencias"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label mb-1.5">Nome do arquivo</label>
          <input className="input" value={fileName} onChange={(event) => setFileName(event.target.value)} />
        </div>
        <div>
          <label className="label mb-1.5">Nota privada</label>
          <textarea
            className="input min-h-[5rem] resize-y"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <button
          className="btn-primary w-full"
          type="button"
          disabled={!session || !activeJob.dbId}
          onClick={handleCreateEvidence}
        >
          Registrar evidencia
        </button>

        {evidence.length > 0 && (
          <div className="space-y-2">
            {evidence.map((item) => (
              <article className="rounded-xl border border-line bg-app p-3" key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                    <FileCheck2 className="h-4 w-4 text-trust" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{item.storage_uri}</p>
                    <p className="mt-1 font-mono text-xs text-muted break-all">{item.sha256_hash}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {status ? (
          <p className="rounded-lg bg-app px-3 py-2.5 text-xs leading-relaxed text-muted">{status}</p>
        ) : null}
      </div>
    </section>
  );
}
