import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Hash,
  type Hex,
  type TransactionReceipt
} from "viem";
import { baseSepolia } from "viem/chains";

import type { EscrowConfig, PreparedJob } from "./api";
import { syncIndexer } from "./api";
import { runtimeConfig } from "./config";
import { ensureBaseSepolia, type AuthenticatedWalletSession } from "./wallet";

export type TransactionStage =
  | { state: "awaiting_signature"; label: string }
  | { state: "submitted"; label: string; hash: Hash; explorerUrl: string }
  | { state: "replaced"; label: string; hash: Hash; explorerUrl: string }
  | { state: "confirmed"; label: string; hash: Hash; explorerUrl: string; blockNumber: bigint }
  | { state: "indexed"; label: string; hash: Hash; explorerUrl: string; blockNumber: bigint }
  | { state: "reverted"; label: string; hash: Hash; explorerUrl: string };

export type TransactionReporter = (stage: TransactionStage) => void;

const escrowAbi = [
  { type: "function", name: "createJob", stateMutability: "nonpayable", inputs: [{ name: "jobId", type: "uint256" }, { name: "freelancer", type: "address" }, { name: "token", type: "address" }, { name: "milestoneAmounts", type: "uint256[]" }], outputs: [] },
  { type: "function", name: "fundJob", stateMutability: "nonpayable", inputs: [{ name: "jobId", type: "uint256" }], outputs: [] },
  { type: "function", name: "submitMilestone", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }, { name: "evidenceHash", type: "bytes32" }], outputs: [] },
  { type: "function", name: "approveMilestone", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }], outputs: [] },
  { type: "function", name: "requestRevision", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }, { name: "evidenceHash", type: "bytes32" }], outputs: [] },
  { type: "function", name: "openDispute", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }, { name: "arbitrator", type: "address" }, { name: "evidenceHash", type: "bytes32" }], outputs: [{ name: "disputeId", type: "uint256" }] },
  { type: "function", name: "releaseAfterTimeout", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }], outputs: [] }
] as const;

const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }
] as const;

export function approveUsdc(session: AuthenticatedWalletSession, prepared: PreparedJob, report: TransactionReporter) {
  return writeAndConfirm(session, "USDC approval", report, false, (wallet) => wallet.writeContract({
    address: prepared.usdc_contract_address as Hex,
    account: session.address,
    abi: erc20Abi,
    chain: baseSepolia,
    functionName: "approve",
    args: [prepared.escrow_contract_address as Hex, BigInt(prepared.total_amount_raw)]
  }));
}

export function createPreparedJob(session: AuthenticatedWalletSession, prepared: PreparedJob, report: TransactionReporter) {
  return writeAndConfirm(session, "Create escrow", report, true, (wallet) => wallet.writeContract({
    address: prepared.escrow_contract_address as Hex,
    account: session.address,
    abi: escrowAbi,
    chain: baseSepolia,
    functionName: "createJob",
    args: [BigInt(prepared.job_id), prepared.freelancer_wallet as Hex, prepared.usdc_contract_address as Hex, prepared.milestone_amounts_raw.map(BigInt)]
  }));
}

export function fundJob(session: AuthenticatedWalletSession, config: EscrowConfig, jobId: string, report: TransactionReporter) {
  return escrowWrite(session, config, "Fund escrow", report, "fundJob", [BigInt(jobId)]);
}

export function submitMilestone(session: AuthenticatedWalletSession, config: EscrowConfig, milestoneId: string, digest: Hex, report: TransactionReporter) {
  return escrowWrite(session, config, "Submit integrity proof", report, "submitMilestone", [BigInt(milestoneId), digest]);
}

export function approveMilestone(session: AuthenticatedWalletSession, config: EscrowConfig, milestoneId: string, report: TransactionReporter) {
  return escrowWrite(session, config, "Approve milestone", report, "approveMilestone", [BigInt(milestoneId)]);
}

export function requestRevision(session: AuthenticatedWalletSession, config: EscrowConfig, milestoneId: string, digest: Hex, report: TransactionReporter) {
  return escrowWrite(session, config, "Request revision", report, "requestRevision", [BigInt(milestoneId), digest]);
}

export function openDispute(session: AuthenticatedWalletSession, config: EscrowConfig, milestoneId: string, digest: Hex, report: TransactionReporter) {
  return escrowWrite(session, config, "Open dispute", report, "openDispute", [BigInt(milestoneId), config.escrow_arbitrator as Hex, digest]);
}

export function releaseAfterTimeout(session: AuthenticatedWalletSession, config: EscrowConfig, milestoneId: string, report: TransactionReporter) {
  return escrowWrite(session, config, "Release after timeout", report, "releaseAfterTimeout", [BigInt(milestoneId)]);
}

async function escrowWrite(
  session: AuthenticatedWalletSession,
  config: EscrowConfig,
  label: string,
  report: TransactionReporter,
  functionName: "fundJob" | "submitMilestone" | "approveMilestone" | "requestRevision" | "openDispute" | "releaseAfterTimeout",
  args: readonly unknown[]
) {
  return writeAndConfirm(session, label, report, true, (wallet) => wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    account: session.address,
    abi: escrowAbi,
    chain: baseSepolia,
    functionName,
    args: args as never
  }));
}

async function writeAndConfirm(
  session: AuthenticatedWalletSession,
  label: string,
  report: TransactionReporter,
  shouldIndex: boolean,
  write: (wallet: ReturnType<typeof createWalletClient>) => Promise<Hash>
): Promise<TransactionReceipt> {
  await ensureBaseSepolia(session.provider);
  const wallet = createWalletClient({ account: session.address, chain: baseSepolia, transport: custom(session.provider) });
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(runtimeConfig.rpcUrl) });
  report({ state: "awaiting_signature", label });
  const hash = await write(wallet);
  let activeHash = hash;
  report({ state: "submitted", label, hash, explorerUrl: explorerUrl(hash) });
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
    onReplaced: ({ transaction }) => {
      activeHash = transaction.hash;
      report({ state: "replaced", label, hash: activeHash, explorerUrl: explorerUrl(activeHash) });
    }
  });
  if (receipt.status === "reverted") {
    report({ state: "reverted", label, hash: activeHash, explorerUrl: explorerUrl(activeHash) });
    throw new Error(`${label} reverted on Base Sepolia.`);
  }
  report({ state: "confirmed", label, hash: activeHash, explorerUrl: explorerUrl(activeHash), blockNumber: receipt.blockNumber });
  if (shouldIndex) {
    await syncIndexer(session, activeHash, receipt.blockNumber);
    report({ state: "indexed", label, hash: activeHash, explorerUrl: explorerUrl(activeHash), blockNumber: receipt.blockNumber });
  }
  return receipt;
}

function explorerUrl(hash: Hash): string {
  return `${runtimeConfig.explorerBaseUrl}/tx/${hash}`;
}
