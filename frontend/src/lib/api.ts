import type { MarketplaceJob, MilestoneStatus, Reputation } from "./types";
import type { components } from "./api.generated";
import { runtimeConfig } from "./config";
import { formatUsdcRaw } from "./chainValues";
import { formatAddress, formatDateTime } from "./formatters";

type Schemas = components["schemas"];
type GeneratedJob = Schemas["JobRead"];
type GeneratedMilestone = Schemas["MilestoneRead"];

export type EscrowConfig = Schemas["EscrowConfigRead"];
export type PreparedJob = Schemas["JobPrepareRead"];
export type EvidenceRead = Schemas["EvidenceRead"];
export type ReputationRead = Schemas["ReputationRead"];
export type UserProfile = Omit<Schemas["UserRead"], "role_preference"> & {
  role_preference: "client" | "freelancer" | "both" | null;
};

type ApiMilestone = Omit<GeneratedMilestone, "status"> & {
  status: MilestoneStatus;
};
type ApiJob = Omit<GeneratedJob, "milestones" | "status"> & {
  milestones: ApiMilestone[];
  status: MarketplaceJob["escrowState"];
};
type MatchRead = Omit<Schemas["MatchRead"], "job"> & { job: ApiJob };

export async function fetchMarketplaceJobs(): Promise<MarketplaceJob[]> {
  const baseUrl = runtimeConfig.apiBaseUrl;
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
  milestoneAmountsRaw: string[];
  jobId?: string;
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

export async function upsertUserProfile(params: {
  walletAddress: string;
  displayName?: string;
  rolePreference?: "client" | "freelancer" | "both";
}): Promise<UserProfile> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/users/${params.walletAddress}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      display_name: params.displayName ?? `User ${formatAddress(params.walletAddress)}`,
      role_preference: params.rolePreference ?? "both",
      profile_visibility: "public"
    })
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as UserProfile;
}

export async function createSwipe(params: {
  actorWallet: string;
  targetId: string;
  direction: "left" | "right" | "super";
  context?: Record<string, unknown>;
}): Promise<void> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/swipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor_wallet: params.actorWallet,
      target_type: "job",
      target_id: params.targetId,
      direction: params.direction,
      context: params.context ?? {}
    })
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
}

export async function fetchMatches(walletAddress: string): Promise<MarketplaceJob[]> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/matches/${walletAddress}`);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  const matches = (await response.json()) as MatchRead[];
  return matches.map((match) => toMarketplaceJob(match.job));
}

export async function createEvidence(params: {
  jobId: string;
  uploaderWallet: string;
  body: string;
  fileName?: string;
  milestoneId?: string;
  disputeId?: string;
}): Promise<EvidenceRead> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: params.jobId,
      uploader_wallet: params.uploaderWallet,
      body: params.body,
      file_name: params.fileName ?? "evidence.txt",
      milestone_id: params.milestoneId,
      dispute_id: params.disputeId,
      content_type: "text/plain",
      visibility: "private"
    })
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as EvidenceRead;
}

export async function fetchJobEvidence(jobId: string): Promise<EvidenceRead[]> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/jobs/${jobId}/evidence`);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as EvidenceRead[];
}

export async function fetchReputation(walletAddress: string): Promise<Reputation> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/reputation/${walletAddress}`);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return toReputation((await response.json()) as ReputationRead);
}

export async function refreshReputation(walletAddress: string): Promise<Reputation> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/reputation/${walletAddress}/refresh`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return toReputation((await response.json()) as ReputationRead);
}

function apiBaseUrl(): string {
  return runtimeConfig.apiBaseUrl;
}

function toMarketplaceJob(job: ApiJob): MarketplaceJob {
  const id = job.onchain_job_id;
  return {
    dbId: job.id,
    id,
    title: job.title ?? `Contrato on-chain #${id}`,
    client: formatAddress(job.client_wallet),
    freelancerWallet: job.freelancer_wallet,
    budget: `USDC ${formatUsdcRaw(job.total_amount_raw)}`,
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
        id: milestone.onchain_milestone_id,
        title: milestone.title ?? `Milestone ${milestone.sequence + 1}`,
        amount: formatUsdcRaw(milestone.amount_raw),
        status: milestone.status,
        due: milestone.review_deadline
          ? formatDateTime(milestone.review_deadline)
          : "aguardando entrega"
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

function toReputation(reputation: ReputationRead): Reputation {
  return {
    completedJobs: reputation.completed_jobs,
    volumeTier: reputation.verified_volume_tier,
    directApprovalRate: reputation.direct_approval_rate_bps,
    disputeRate: reputation.dispute_rate_bps,
    repeatClients: reputation.repeat_client_count
  };
}
