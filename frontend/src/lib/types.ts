export type MilestoneStatus =
  | "Pending"
  | "Submitted"
  | "Approved"
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
  dbId?: string;
  id: number;
  title: string;
  client: string;
  budget: string;
  duration: string;
  skills: string[];
  summary: string;
  escrowState: "Created" | "Funded" | "InProgress" | "Completed" | "Cancelled" | "Disputed" | "Resolved";
  matchScore: number;
  milestones: Milestone[];
  reputation: Reputation;
}
