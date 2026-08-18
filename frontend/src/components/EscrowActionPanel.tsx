import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Clock3, ExternalLink, FileUp, Scale, WalletCards } from "lucide-react";
import { isAddress, type Hex } from "viem";

import { fetchEscrowConfig, prepareJob, type EscrowConfig, type PreparedJob } from "../lib/api";
import {
  approveMilestone,
  approveUsdc,
  createPreparedJob,
  fundJob,
  openDispute,
  releaseAfterTimeout,
  requestRevision,
  submitMilestone,
  type TransactionStage
} from "../lib/contracts";
import { formatUsdcRaw, parseUsdcAmount } from "../lib/chainValues";
import type { MarketplaceJob } from "../lib/types";
import type { AuthenticatedWalletSession } from "../lib/wallet";

interface EscrowActionPanelProps {
  activeJob: MarketplaceJob;
  session: AuthenticatedWalletSession | null;
  onRefresh: () => Promise<void>;
}

export function EscrowActionPanel({ activeJob, session, onRefresh }: EscrowActionPanelProps) {
  const [config, setConfig] = useState<EscrowConfig | null>(null);
  const [freelancerWallet, setFreelancerWallet] = useState("");
  const [amounts, setAmounts] = useState("25,25");
  const [preparedJob, setPreparedJob] = useState<PreparedJob | null>(null);
  const [milestoneId, setMilestoneId] = useState(String(activeJob.milestones[0]?.id ?? ""));
  const [digest, setDigest] = useState("");
  const [status, setStatus] = useState("Connect and sign in to enable Base Sepolia contract writes.");
  const [transaction, setTransaction] = useState<TransactionStage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchEscrowConfig().then(setConfig).catch(() => setStatus("Escrow configuration is unavailable."));
  }, []);
  useEffect(() => setMilestoneId(String(activeJob.milestones[0]?.id ?? "")), [activeJob]);

  function report(stage: TransactionStage) {
    setTransaction(stage);
    const messages: Record<TransactionStage["state"], string> = {
      awaiting_signature: "Awaiting wallet signature…",
      submitted: "Transaction submitted to Base Sepolia.",
      replaced: "Transaction was replaced; tracking the replacement.",
      confirmed: "Transaction confirmed. Waiting for TrustWork indexing…",
      reverted: "Transaction reverted on-chain.",
      indexed: "Transaction confirmed and indexed."
    };
    setStatus(messages[stage.state]);
  }

  async function run(action: () => Promise<unknown>) {
    try {
      setBusy(true);
      await action();
      await onRefresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The transaction could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrepareJob() {
    if (!session) return setStatus("Connect and sign in first.");
    if (!isAddress(freelancerWallet)) return setStatus("Enter a valid freelancer wallet.");
    try {
      setBusy(true);
      const milestoneAmountsRaw = amounts.split(",").map((amount) => parseUsdcAmount(amount.trim()));
      const prepared = await prepareJob({ session, freelancerWallet, milestoneAmountsRaw });
      setPreparedJob(prepared);
      setStatus(`Contract #${prepared.job_id} prepared for ${formatUsdcRaw(prepared.total_amount_raw)} test USDC.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The contract could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  function proofDigest(): Hex {
    if (!/^0x[0-9a-fA-F]{64}$/.test(digest) || /^0x0{64}$/i.test(digest)) {
      throw new Error("Enter a non-zero bytes32 digest created by the evidence proof screen.");
    }
    return digest as Hex;
  }

  return (
    <section className="surface overflow-hidden xl:sticky xl:top-24">
      <header className="border-b border-line p-5 sm:p-6"><p className="eyebrow">Transaction lab</p><h2 className="mt-2 text-lg font-extrabold text-ink">Manage testnet escrow</h2></header>
      <div className="space-y-6 p-5 sm:p-6">
        <ActionStep number="1" title="Prepare contract" description="Set the freelancer and split a test USDC budget into milestones.">
          <div className="space-y-3">
            <div><label className="label mb-1.5" htmlFor="freelancer-wallet">Freelancer wallet</label><input id="freelancer-wallet" className="input font-mono text-xs" value={freelancerWallet} onChange={(event) => setFreelancerWallet(event.target.value)} placeholder="0x…" /></div>
            <div><label className="label mb-1.5" htmlFor="milestone-values">Test USDC amounts</label><input id="milestone-values" className="input" value={amounts} onChange={(event) => setAmounts(event.target.value)} aria-describedby="milestone-help" /><p id="milestone-help" className="mt-1.5 text-xs text-muted">Comma-separated; test tokens have no monetary value.</p></div>
            <button className="btn-primary w-full" type="button" disabled={!session || busy} onClick={handlePrepareJob}><WalletCards className="h-4 w-4" aria-hidden="true" /> Prepare contract</button>
          </div>
        </ActionStep>

        <ActionStep number="2" title="Fund with test USDC" description="Approve the official Base Sepolia USDC contract, create the escrow, then fund it.">
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <button className="btn-ghost text-xs" type="button" disabled={!session || !preparedJob || busy} onClick={() => session && preparedJob && run(() => approveUsdc(session, preparedJob, report))}>1. Approve</button>
            <button className="btn-ghost text-xs" type="button" disabled={!session || !preparedJob || busy} onClick={() => session && preparedJob && run(() => createPreparedJob(session, preparedJob, report))}>2. Create</button>
            <button className="btn-trust text-xs" type="button" disabled={!session || !preparedJob || !config || busy} onClick={() => session && preparedJob && config && run(() => fundJob(session, config, preparedJob.job_id, report))}>3. Fund</button>
          </div>
          {session ? <a className="mt-3 inline-flex text-xs font-bold text-chain underline" href="https://docs.base.org/chain/network-faucets" target="_blank" rel="noreferrer">Official Base testnet faucet guidance <ExternalLink className="ml-1 h-3.5 w-3.5" /></a> : null}
        </ActionStep>

        <ActionStep number="3" title="Update a milestone" description="Use a bytes32 digest generated from evidence content in your browser.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div><label className="label mb-1.5" htmlFor="active-milestone">Milestone ID</label><input id="active-milestone" className="input" inputMode="numeric" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} /></div>
            <div><label className="label mb-1.5" htmlFor="evidence-hash">Evidence digest</label><input id="evidence-hash" className="input font-mono text-xs" value={digest} onChange={(event) => setDigest(event.target.value)} placeholder="0x + 64 hex characters" /></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-ghost text-xs" type="button" disabled={!session || !config || busy} onClick={() => session && config && run(() => submitMilestone(session, config, milestoneId, proofDigest(), report))}><FileUp className="h-4 w-4" /> Submit</button>
            <button className="btn-trust text-xs" type="button" disabled={!session || !config || busy} onClick={() => session && config && run(() => approveMilestone(session, config, milestoneId, report))}><CheckCircle2 className="h-4 w-4" /> Approve</button>
            <button className="btn-ghost text-xs" type="button" disabled={!session || !config || busy} onClick={() => session && config && run(() => requestRevision(session, config, milestoneId, proofDigest(), report))}>Request revision</button>
            <button className="btn-ghost border-coral/30 text-xs text-coral" type="button" disabled={!session || !config || busy} onClick={() => session && config && run(() => openDispute(session, config, milestoneId, proofDigest(), report))}><Scale className="h-4 w-4" /> Dispute</button>
            <button className="btn col-span-2 bg-ink text-xs text-white hover:bg-chain-deep" type="button" disabled={!session || !config || busy} onClick={() => session && config && run(() => releaseAfterTimeout(session, config, milestoneId, report))}><Clock3 className="h-4 w-4" /> Release after timeout</button>
          </div>
        </ActionStep>

        {transaction && "explorerUrl" in transaction ? <a className="landing-text-link text-xs" href={transaction.explorerUrl} target="_blank" rel="noreferrer">View transaction on BaseScan <ExternalLink className="h-3.5 w-3.5" /></a> : null}
        <p className="rounded-lg border border-line bg-app px-3 py-3 text-xs leading-relaxed text-muted" role="status">{status}</p>
      </div>
    </section>
  );
}

function ActionStep({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <div><div className="mb-3 flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-xs font-bold text-white">{number}</span><div><h3 className="text-sm font-extrabold text-ink">{title}</h3><p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p></div></div>{children}</div>;
}
