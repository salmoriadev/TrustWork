export type MilestoneStatus =
  | "Pending"
  | "Submitted"
  | "Released"
  | "RevisionRequested"
  | "Disputed"
  | "Resolved";

export interface Milestone {
  id: number;
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
  id: number;
  title: string;
  client: string;
  budget: string;
  duration: string;
  skills: string[];
  summary: string;
  escrowState: "Created" | "Funded" | "InProgress" | "Disputed" | "Completed";
  matchScore: number;
  milestones: Milestone[];
  reputation: Reputation;
}
