import { isAddress } from "viem";

import type { MarketplaceJob, MilestoneStatus } from "./types";

const escrowStateLabels: Record<MarketplaceJob["escrowState"], string> = {
  Created: "Created",
  Funded: "Funded",
  InProgress: "In progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Disputed: "Disputed",
  Resolved: "Resolved"
};

const milestoneStateLabels: Record<MilestoneStatus, string> = {
  Pending: "Pending",
  Submitted: "Submitted",
  Approved: "Approved",
  Released: "Released",
  RevisionRequested: "Revision requested",
  Disputed: "Disputed",
  Resolved: "Resolved"
};

export function formatAddress(address: string, leading = 6, trailing = 4): string {
  if (!isAddress(address) || leading + trailing >= address.length) return address;
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}

export function formatBps(bps: number, locale = "en-US"): string {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error("BPS must be an integer between 0 and 10000.");
  }
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(bps / 10_000);
}

export function bpsToPercent(bps: number): number {
  return Math.min(Math.max(bps / 100, 0), 100);
}

export function formatDateTime(value: string, locale = "en-US"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function formatEscrowState(state: MarketplaceJob["escrowState"]): string {
  return escrowStateLabels[state];
}

export function formatMilestoneState(state: MilestoneStatus): string {
  return milestoneStateLabels[state];
}
