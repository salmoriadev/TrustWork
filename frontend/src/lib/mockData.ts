import type { MarketplaceJob } from "./types";

export const jobs: MarketplaceJob[] = [
  {
    id: 1042,
    title: "Checkout USDC para SaaS B2B",
    client: "Northstar Labs",
    budget: "USDC 4.800",
    duration: "3 milestones",
    skills: ["React", "FastAPI", "Base", "USDC"],
    summary:
      "Integracao de assinatura, invoices e webhooks para cobranca internacional com liquidacao em stablecoin.",
    escrowState: "Funded",
    matchScore: 92,
    milestones: [
      { id: 1, title: "Arquitetura e prova de wallet", amount: "1.200", status: "Released", due: "feito" },
      { id: 2, title: "Checkout e webhooks", amount: "2.100", status: "Submitted", due: "2 dias" },
      { id: 3, title: "QA e handoff", amount: "1.500", status: "Pending", due: "9 dias" }
    ],
    reputation: {
      completedJobs: 18,
      volumeTier: "10k_50k",
      directApprovalRate: 8700,
      disputeRate: 420,
      repeatClients: 5
    }
  },
  {
    id: 1043,
    title: "Painel de arbitragem para entregas digitais",
    client: "Atlas Studio",
    budget: "USDC 6.250",
    duration: "4 milestones",
    skills: ["UX", "TypeScript", "PostgreSQL", "Security"],
    summary:
      "Workspace privado para evidencias, trilha de auditoria e resolucao humana de disputas com hashes verificaveis.",
    escrowState: "InProgress",
    matchScore: 86,
    milestones: [
      { id: 1, title: "Modelo de evidencia", amount: "1.400", status: "Released", due: "feito" },
      { id: 2, title: "Inbox arbitral", amount: "1.850", status: "RevisionRequested", due: "revisao" },
      { id: 3, title: "Decisao e split", amount: "1.700", status: "Pending", due: "7 dias" },
      { id: 4, title: "Auditoria de eventos", amount: "1.300", status: "Pending", due: "12 dias" }
    ],
    reputation: {
      completedJobs: 31,
      volumeTier: "50k_100k",
      directApprovalRate: 9100,
      disputeRate: 280,
      repeatClients: 9
    }
  },
  {
    id: 1044,
    title: "Indexador Base Sepolia para reputacao",
    client: "Signal Guild",
    budget: "USDC 3.400",
    duration: "2 milestones",
    skills: ["Web3.py", "Redis", "SQLAlchemy", "Observability"],
    summary:
      "Listener de eventos com replay idempotente, alertas de timeout e snapshots agregados de reputacao.",
    escrowState: "Created",
    matchScore: 78,
    milestones: [
      { id: 1, title: "Indexer e schema", amount: "1.700", status: "Pending", due: "5 dias" },
      { id: 2, title: "Reputacao e alertas", amount: "1.700", status: "Pending", due: "10 dias" }
    ],
    reputation: {
      completedJobs: 7,
      volumeTier: "1k_10k",
      directApprovalRate: 8200,
      disputeRate: 600,
      repeatClients: 2
    }
  }
];
