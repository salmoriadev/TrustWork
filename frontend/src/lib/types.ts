export type MilestoneStatus =
  | "Pending"
  | "Submitted"
  | "Approved"
  | "Released"
  | "RevisionRequested"
  | "Disputed"
  | "Resolved";

export interface Milestone {
  id: string;
  title: string;
  amount: string;
  status: MilestoneStatus;
  due: string;
}

export interface Reputation {
  completedJobs: number;
  volumeTier: string;
  directApprovalRate: number;
  disputeRate: number;
  repeatClients: number;
}

export interface MarketplaceJob {
  dbId?: string;
  id: string;
  title: string;
  client: string;
  freelancerWallet?: string;
  budget: string;
  duration: string;
  skills: string[];
  summary: string;
  escrowState: "Created" | "Funded" | "InProgress" | "Completed" | "Cancelled" | "Disputed" | "Resolved";
  matchScore: number;
  milestones: Milestone[];
  reputation: Reputation;
}
