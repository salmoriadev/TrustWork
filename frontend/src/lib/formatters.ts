import { isAddress } from "viem";

import type { MarketplaceJob, MilestoneStatus } from "./types";

const escrowStateLabels: Record<MarketplaceJob["escrowState"], string> = {
  Created: "Criado",
  Funded: "Financiado",
  InProgress: "Em andamento",
  Completed: "Concluido",
  Cancelled: "Cancelado",
  Disputed: "Em disputa",
  Resolved: "Resolvido"
};

const milestoneStateLabels: Record<MilestoneStatus, string> = {
  Pending: "Pendente",
  Submitted: "Enviado",
  Approved: "Aprovado",
  Released: "Liberado",
  RevisionRequested: "Revisao solicitada",
  Disputed: "Em disputa",
  Resolved: "Resolvido"
};

export function formatAddress(address: string, leading = 6, trailing = 4): string {
  if (!isAddress(address) || leading + trailing >= address.length) return address;
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}

export function formatBps(bps: number, locale = "pt-BR"): string {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error("BPS deve ser um inteiro entre 0 e 10000.");
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

export function formatDateTime(value: string, locale = "pt-BR"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponivel";
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
