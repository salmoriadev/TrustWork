import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileCheck2, RefreshCw } from "lucide-react";

import { createEvidence, fetchEscrowConfig, fetchJobEvidence, type EvidenceRead } from "../lib/api";
import { submitMilestone, type TransactionStage } from "../lib/contracts";
import { digestEvidence } from "../lib/evidence";
import type { MarketplaceJob } from "../lib/types";
import type { AuthenticatedWalletSession } from "../lib/wallet";

interface EvidencePanelProps {
  activeJob: MarketplaceJob;
  session: AuthenticatedWalletSession | null;
}

export function EvidencePanel({ activeJob, session }: EvidencePanelProps) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRead[]>([]);
  const [status, setStatus] = useState("Original content stays with you. Only a SHA-256 digest and file metadata leave this browser.");
  const [transaction, setTransaction] = useState<TransactionStage | null>(null);
  const [busy, setBusy] = useState(false);

  const reloadEvidence = useCallback(async () => {
    if (!activeJob.dbId) return setEvidence([]);
    setEvidence(await fetchJobEvidence(activeJob.dbId));
  }, [activeJob.dbId]);

  useEffect(() => {
    reloadEvidence().catch(() => setStatus("Evidence proof metadata could not be loaded."));
  }, [reloadEvidence]);

  async function handleCreateEvidence() {
    if (!session) return setStatus("Connect and sign in before registering a proof.");
    if (!activeJob.dbId) return setStatus("This contract must be indexed before it can receive proof metadata.");
    const milestoneId = activeJob.milestones[0]?.id;
    if (!milestoneId) return setStatus("The indexed contract has no milestone to submit.");

    try {
      setBusy(true);
      const proof = await digestEvidence(file, note);
      const created = await createEvidence({
        session,
        jobId: activeJob.dbId,
        digest: proof.digest,
        fileName: proof.fileName,
        contentType: proof.contentType,
        sizeBytes: proof.sizeBytes
      });
      setStatus(`Metadata saved for ${created.file_name}. Submitting the same digest on-chain…`);
      const config = await fetchEscrowConfig();
      await submitMilestone(session, config, milestoneId, proof.digest, setTransaction);
      setStatus("Evidence integrity proof confirmed on Base Sepolia and indexed by TrustWork.");
      await reloadEvidence();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The integrity proof could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="eyebrow">Evidence integrity</p><h2 className="mt-2 text-lg font-extrabold text-ink">Browser-hashed proof</h2></div>
        <button className="btn-icon h-9 w-9" type="button" onClick={() => reloadEvidence().catch(() => setStatus("Refresh failed."))} title="Reload proof metadata" aria-label="Reload proof metadata">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label mb-1.5" htmlFor="evidence-file">File (optional)</label>
          <input id="evidence-file" className="input" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="evidence-note">Note to hash when no file is selected</label>
          <textarea id="evidence-note" className="input min-h-[5rem] resize-y" value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <button className="btn-primary w-full" type="button" disabled={!session || !activeJob.dbId || busy} onClick={handleCreateEvidence}>
          {busy ? "Processing proof…" : "Hash, register, and submit proof"}
        </button>

        {evidence.map((item) => (
          <article className="rounded-lg border border-line bg-app p-3" key={item.id}>
            <div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm"><FileCheck2 className="h-4 w-4 text-trust" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{item.file_name} · {item.size_bytes} bytes</p><p className="mt-1 break-all font-mono text-xs text-muted">{item.sha256_hash}</p></div></div>
          </article>
        ))}

        {transaction && "explorerUrl" in transaction ? <a className="landing-text-link text-xs" href={transaction.explorerUrl} target="_blank" rel="noreferrer">View {transaction.state} transaction on BaseScan <ExternalLink className="h-3.5 w-3.5" /></a> : null}
        <p className="rounded-lg bg-app px-3 py-2.5 text-xs leading-relaxed text-muted" role="status">{status}</p>
      </div>
    </section>
  );
}
