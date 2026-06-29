import type { MarketplaceJob, MilestoneStatus } from "./types";

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
