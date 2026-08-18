import type { MarketplaceJob, MilestoneStatus, Reputation } from "./types";
import type { components } from "./api.generated";
import { runtimeConfig } from "./config";
import { formatUsdcRaw } from "./chainValues";
import { formatAddress, formatDateTime } from "./formatters";
import { signWalletMessage, type AuthenticatedWalletSession, type WalletSession } from "./wallet";

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

interface AuthChallenge {
  message: string;
  nonce: string;
  expires_at: string;
}

interface AuthToken {
  access_token: string;
  expires_at: string;
  wallet_address: string;
  chain_id: number;
}

type ApiMilestone = Omit<GeneratedMilestone, "status"> & {
  status: MilestoneStatus;
};
type ApiJob = Omit<GeneratedJob, "milestones" | "status"> & {
  milestones: ApiMilestone[];
  status: MarketplaceJob["escrowState"];
};
type MatchRead = Omit<Schemas["MatchRead"], "job"> & { job: ApiJob };

export async function fetchMarketplaceJobs(onWake?: () => void): Promise<MarketplaceJob[]> {
  const baseUrl = runtimeConfig.apiBaseUrl;
  const response = await fetchWithColdStartRetry(`${baseUrl}/jobs`, onWake);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const jobs = (await response.json()) as ApiJob[];
  return jobs.map(toMarketplaceJob);
}

export async function authenticateWallet(
  session: WalletSession
): Promise<AuthenticatedWalletSession> {
  const challengeResponse = await fetch(`${apiBaseUrl()}/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: session.address, chain_id: session.chainId })
  });
  if (!challengeResponse.ok) throw new Error(`Authentication challenge failed (${challengeResponse.status}).`);
  const challenge = (await challengeResponse.json()) as AuthChallenge;
  const signature = await signWalletMessage(session, challenge.message);
  const verifyResponse = await fetch(`${apiBaseUrl()}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: challenge.message, signature })
  });
  if (!verifyResponse.ok) throw new Error(`Wallet verification failed (${verifyResponse.status}).`);
  const token = (await verifyResponse.json()) as AuthToken;
  return { ...session, accessToken: token.access_token, expiresAt: token.expires_at };
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
  session: AuthenticatedWalletSession;
  freelancerWallet: string;
  milestoneAmountsRaw: string[];
  jobId?: string;
}): Promise<PreparedJob> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/jobs/prepare`, {
    method: "POST",
    headers: authorizedHeaders(params.session),
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

export async function syncIndexer(
  session: AuthenticatedWalletSession,
  transactionHash: string,
  receiptBlock: bigint
): Promise<void> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/indexer/sync`, {
    method: "POST",
    headers: authorizedHeaders(session),
    body: JSON.stringify({
      transaction_hash: transactionHash,
      receipt_block: Number(receiptBlock)
    })
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
}

export async function upsertUserProfile(params: {
  session: AuthenticatedWalletSession;
  displayName?: string;
  rolePreference?: "client" | "freelancer" | "both";
}): Promise<UserProfile> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/users/${params.session.address}`, {
    method: "PUT",
    headers: authorizedHeaders(params.session),
    body: JSON.stringify({
      display_name: params.displayName ?? `User ${formatAddress(params.session.address)}`,
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
  session: AuthenticatedWalletSession;
  targetId: string;
  direction: "left" | "right" | "super";
  context?: Record<string, unknown>;
}): Promise<void> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/swipes`, {
    method: "POST",
    headers: authorizedHeaders(params.session),
    body: JSON.stringify({
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

export async function fetchMatches(session: AuthenticatedWalletSession): Promise<MarketplaceJob[]> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/matches/${session.address}`, {
    headers: authorizedHeaders(session, false)
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  const matches = (await response.json()) as MatchRead[];
  return matches.map((match) => toMarketplaceJob(match.job));
}

export async function createEvidence(params: {
  session: AuthenticatedWalletSession;
  jobId: string;
  digest: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  milestoneId?: string;
  disputeId?: string;
}): Promise<EvidenceRead> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/evidence`, {
    method: "POST",
    headers: authorizedHeaders(params.session),
    body: JSON.stringify({
      job_id: params.jobId,
      digest: params.digest,
      file_name: params.fileName,
      milestone_id: params.milestoneId,
      dispute_id: params.disputeId,
      content_type: params.contentType,
      size_bytes: params.sizeBytes
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

export async function refreshReputation(session: AuthenticatedWalletSession): Promise<Reputation> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/reputation/${session.address}/refresh`, {
    method: "POST",
    headers: authorizedHeaders(session, false)
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return toReputation((await response.json()) as ReputationRead);
}

function apiBaseUrl(): string {
  return runtimeConfig.apiBaseUrl;
}

function authorizedHeaders(
  session: AuthenticatedWalletSession,
  json = true
): Record<string, string> {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${session.accessToken}`
  };
}

async function fetchWithColdStartRetry(url: string, onWake?: () => void): Promise<Response> {
  const delays = [0, 1200, 2400, 4000];
  let lastError: unknown;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      onWake?.();
      await new Promise((resolve) => window.setTimeout(resolve, delays[attempt]));
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (![502, 503, 504].includes(response.status) || attempt === delays.length - 1) {
        return response;
      }
      lastError = new Error(`Demo API returned ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === delays.length - 1) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Demo API did not wake up in time.");
}

function toMarketplaceJob(job: ApiJob): MarketplaceJob {
  const id = job.onchain_job_id;
  return {
    dbId: job.id,
    id,
    title: job.title ?? `On-chain contract #${id}`,
    client: formatAddress(job.client_wallet),
    freelancerWallet: job.freelancer_wallet,
    budget: `USDC ${formatUsdcRaw(job.total_amount_raw)}`,
    duration: `${job.milestones.length} milestones`,
    skills: ["Base", "USDC", "Escrow", "Indexed"],
    summary:
      job.public_summary ??
      "Contract projected from Base Sepolia events by the TrustWork indexer.",
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
          : "awaiting delivery"
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
