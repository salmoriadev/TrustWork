import type { MarketplaceJob, MilestoneStatus } from "./types";

export interface EscrowConfig {
  chain_id: number;
  escrow_contract_address: string;
  usdc_contract_address: string;
  escrow_arbitrator: string;
}

export interface PreparedJob {
  chain_id: number;
  escrow_contract_address: string;
  usdc_contract_address: string;
  job_id: number;
  freelancer_wallet: string;
  milestone_amounts_raw: number[];
  total_amount_raw: number;
}

interface ApiMilestone {
  onchain_milestone_id: string;
  sequence: number;
  title: string | null;
  amount_raw: string;
  submitted_at: string | null;
  review_deadline: string | null;
  status: MilestoneStatus;
}

interface ApiJob {
  onchain_job_id: string;
  client_wallet: string;
  freelancer_wallet: string;
  title: string | null;
  public_summary: string | null;
  total_amount_raw: string;
  status: MarketplaceJob["escrowState"];
  milestones: ApiMilestone[];
}

export async function fetchMarketplaceJobs(): Promise<MarketplaceJob[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const response = await fetch(`${baseUrl}/jobs`);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const jobs = (await response.json()) as ApiJob[];
  return jobs.map(toMarketplaceJob);
}

export async function fetchEscrowConfig(): Promise<EscrowConfig> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/escrow/config`);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as EscrowConfig;
}

export async function prepareJob(params: {
  freelancerWallet: string;
  milestoneAmountsRaw: number[];
  jobId?: number;
}): Promise<PreparedJob> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/jobs/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      freelancer_wallet: params.freelancerWallet,
      milestone_amounts_raw: params.milestoneAmountsRaw,
      job_id: params.jobId
    })
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as PreparedJob;
}

export async function pollIndexer(): Promise<void> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/indexer/poll`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
}

function apiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
}

function toMarketplaceJob(job: ApiJob): MarketplaceJob {
  const id = Number(job.onchain_job_id);
  return {
    id,
    title: job.title ?? `Contrato on-chain #${id}`,
    client: shortWallet(job.client_wallet),
    budget: `USDC ${formatUsdc(job.total_amount_raw)}`,
    duration: `${job.milestones.length} milestones`,
    skills: ["Base", "USDC", "Escrow", "Indexed"],
    summary:
      job.public_summary ??
      "Job projetado a partir de eventos on-chain locais pelo indexer do backend.",
    escrowState: job.status,
    matchScore: 99,
    milestones: job.milestones
      .sort((left, right) => left.sequence - right.sequence)
      .map((milestone) => ({
        id: Number(milestone.onchain_milestone_id),
        title: milestone.title ?? `Milestone ${milestone.sequence + 1}`,
        amount: formatUsdc(milestone.amount_raw),
        status: milestone.status,
        due: milestone.review_deadline ? "em revisao" : "aguardando entrega"
      })),
    reputation: {
      completedJobs: 0,
      volumeTier: "new",
      directApprovalRate: 0,
      disputeRate: 0,
      repeatClients: 0
    }
  };
}

function formatUsdc(raw: string): string {
  const value = Number(raw) / 1_000_000;
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(value);
}

function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
