import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  FileCheck2,
  MessageSquareText,
  ShieldCheck,
  TimerReset,
  UserRound,
  UsersRound
} from "lucide-react";

import { EscrowActionPanel } from "./components/EscrowActionPanel";
import { TermsBanner } from "./components/TermsBanner";
import { EscrowTimeline } from "./components/EscrowTimeline";
import { EvidencePanel } from "./components/EvidencePanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { ReputationPanel } from "./components/ReputationPanel";
import { SwipeDeck } from "./components/SwipeDeck";
import { WalletBar } from "./components/WalletBar";
import {
  createSwipe,
  fetchMarketplaceJobs,
  fetchMatches,
  fetchReputation,
  refreshReputation,
  upsertUserProfile
} from "./lib/api";
import { jobs } from "./lib/mockData";
import type { Reputation } from "./lib/types";
import { connectWalletConnect, type WalletSession } from "./lib/wallet";

type ScreenId = "marketplace" | "escrow" | "evidence" | "profile" | "matches";

const screens: Array<{
  id: ScreenId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
}> = [
  {
    id: "marketplace",
    label: "Marketplace",
    eyebrow: "Descoberta",
    title: "Encontre o proximo contrato",
    description: "Veja jobs recomendados, avalie fit e salve oportunidades com um swipe.",
    icon: BriefcaseBusiness
  },
  {
    id: "escrow",
    label: "Escrow",
    eyebrow: "Contrato",
    title: "Acompanhe milestones e pagamentos",
    description: "Tudo que importa para o contrato ativo: status, reputacao e acoes on-chain.",
    icon: CircleDollarSign
  },
  {
    id: "evidence",
    label: "Evidencias",
    eyebrow: "Entrega",
    title: "Registre provas privadas",
    description: "Organize arquivos e hashes ligados ao job sem expor conteudo sensivel no contrato.",
    icon: FileCheck2
  },
  {
    id: "profile",
    label: "Perfil",
    eyebrow: "Identidade",
    title: "Configure wallet e reputacao",
    description: "Mantenha seu perfil pronto para matches persistidos e sinais verificaveis.",
    icon: UserRound
  },
  {
    id: "matches",
    label: "Matches",
    eyebrow: "Pipeline",
    title: "Veja oportunidades ativas",
    description: "Lista simples dos jobs aceitos e atalhos para abrir o contrato selecionado.",
    icon: UsersRound
  }
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("marketplace");
  const [activeIndex, setActiveIndex] = useState(0);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [apiJobs, setApiJobs] = useState(jobs);
  const [dataSource, setDataSource] = useState<"api" | "mock">("mock");
  const [profileName, setProfileName] = useState("MatchEscrow User");
  const [rolePreference, setRolePreference] = useState<"client" | "freelancer" | "both">("both");
  const [profileStatus, setProfileStatus] = useState("Perfil ainda nao conectado.");
  const [activeReputation, setActiveReputation] = useState<Reputation | null>(null);

  async function reloadJobs() {
    try {
      const remoteJobs = await fetchMarketplaceJobs();
      if (remoteJobs.length > 0) {
        setApiJobs(remoteJobs);
        setActiveIndex(0);
        setDataSource("api");
      }
    } catch {
      setDataSource("mock");
    }
  }

  useEffect(() => {
    let ignore = false;

    fetchMarketplaceJobs()
      .then((remoteJobs) => {
        if (!ignore && remoteJobs.length > 0) {
          setApiJobs(remoteJobs);
          setActiveIndex(0);
          setDataSource("api");
        }
      })
      .catch(() => {
        if (!ignore) {
          setDataSource("mock");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const activeJob = apiJobs[activeIndex];
  const displayedReputation = activeReputation ?? activeJob.reputation;
  const matchedJobs = useMemo(
    () => apiJobs.filter((job) => matches.includes(job.id)),
    [apiJobs, matches]
  );

  useEffect(() => {
    let ignore = false;
    if (!activeJob.freelancerWallet) {
      setActiveReputation(null);
      return;
    }

    fetchReputation(activeJob.freelancerWallet)
      .then((reputation) => {
        if (!ignore) {
          setActiveReputation(reputation);
        }
      })
      .catch(() => {
        if (!ignore) {
          setActiveReputation(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeJob]);

  async function refreshActiveReputation() {
    if (!activeJob.freelancerWallet) {
      return;
    }
    try {
      setActiveReputation(await refreshReputation(activeJob.freelancerWallet));
      setProfileStatus("Reputacao verificavel recalculada.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Falha ao recalcular reputacao.");
    }
  }

  function nextJob() {
    setActiveIndex((current) => (current + 1) % apiJobs.length);
  }

  async function skipJob() {
    await persistSwipe("left");
    nextJob();
  }

  async function matchJob() {
    setMatches((current) =>
      current.includes(activeJob.id) ? current : [...current, activeJob.id]
    );
    await persistSwipe("right");
    nextJob();
  }

  async function persistSwipe(direction: "left" | "right" | "super") {
    if (!session || !activeJob.dbId) {
      return;
    }

    try {
      await createSwipe({
        actorWallet: session.address,
        targetId: activeJob.dbId,
        direction,
        context: { onchainJobId: activeJob.id, source: "swipe-deck" }
      });
      if (direction !== "left") {
        const remoteMatches = await fetchMatches(session.address);
        setMatches(remoteMatches.map((job) => job.id));
      }
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Falha ao persistir swipe.");
    }
  }

  async function saveProfile(walletAddress = session?.address) {
    if (!walletAddress) {
      return;
    }

    try {
      const profile = await upsertUserProfile({
        walletAddress,
        displayName: profileName,
        rolePreference
      });
      setProfileName(profile.display_name ?? profileName);
      setRolePreference(profile.role_preference ?? "both");
      setProfileStatus("Perfil salvo e pronto para swipes persistidos.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Falha ao salvar perfil.");
    }
  }

  async function handleConnect() {
    try {
      setWalletError(null);
      const nextSession = await connectWalletConnect();
      setSession(nextSession);
      await saveProfile(nextSession.address);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Falha ao conectar");
    }
  }

  const activeScreenConfig = screens.find((screen) => screen.id === activeScreen) ?? screens[0];

  function openJob(jobId: number, screen: ScreenId = "escrow") {
    const nextIndex = apiJobs.findIndex((job) => job.id === jobId);
    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
    }
    setActiveScreen(screen);
  }

  return (
    <div className="min-h-screen bg-app text-ink">
      <WalletBar session={session} onConnect={handleConnect} error={walletError} />
      <TermsBanner />

      <div className="border-b border-line bg-white">
        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:px-6" aria-label="Telas principais">
          {screens.map((screen) => {
            const Icon = screen.icon;
            const active = screen.id === activeScreen;

            return (
              <button
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-ink text-white shadow-card"
                    : "border border-line bg-white text-muted hover:text-ink hover:shadow-card"
                }`}
                type="button"
                onClick={() => setActiveScreen(screen.id)}
                key={screen.id}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {screen.label}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <ScreenHeader screen={activeScreenConfig} />

        {activeScreen === "marketplace" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(380px,0.95fr)_minmax(360px,0.75fr)]">
            <SwipeDeck
              job={activeJob}
              index={activeIndex}
              total={apiJobs.length}
              onSkip={skipJob}
              onMatch={matchJob}
            />
            <div className="space-y-4">
              <ContractSummary activeJob={activeJob} dataSource={dataSource} />
              <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
              <button className="btn-primary w-full" type="button" onClick={() => setActiveScreen("escrow")}>
                Abrir contrato ativo
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {activeScreen === "escrow" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <ContractSummary activeJob={activeJob} dataSource={dataSource} />
              <EscrowTimeline job={activeJob} />
              <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
            </section>
            <EscrowActionPanel activeJob={activeJob} onRefresh={reloadJobs} />
          </div>
        )}

        {activeScreen === "evidence" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <EvidencePanel activeJob={activeJob} session={session} />
            <div className="space-y-4">
              <ContractMiniCard activeJob={activeJob} onOpen={() => setActiveScreen("escrow")} />
              <ProfilePanel
                session={session}
                profileName={profileName}
                rolePreference={rolePreference}
                status={profileStatus}
                onNameChange={setProfileName}
                onRoleChange={setRolePreference}
                onSave={() => void saveProfile()}
              />
            </div>
          </div>
        )}

        {activeScreen === "profile" && (
          <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
            <ProfilePanel
              session={session}
              profileName={profileName}
              rolePreference={rolePreference}
              status={profileStatus}
              onNameChange={setProfileName}
              onRoleChange={setRolePreference}
              onSave={() => void saveProfile()}
            />
            <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
          </div>
        )}

        {activeScreen === "matches" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <MatchList jobs={matchedJobs.length ? matchedJobs : apiJobs.slice(0, 3)} hasMatches={matchedJobs.length > 0} onOpenJob={openJob} />
            <ContractMiniCard activeJob={activeJob} onOpen={() => setActiveScreen("escrow")} />
          </div>
        )}
      </main>
    </div>
  );
}

function ScreenHeader({ screen }: { screen: (typeof screens)[number] }) {
  const Icon = screen.icon;

  return (
    <header className="mb-5 rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-chain to-trust text-white shadow-sm">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{screen.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{screen.title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{screen.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag tag-chain">MVP demo</span>
          <span className="tag tag-trust">Fluxo guiado</span>
        </div>
      </div>
    </header>
  );
}

function ContractSummary({
  activeJob,
  dataSource
}: {
  activeJob: typeof jobs[number];
  dataSource: "api" | "mock";
}) {
  return (
    <section className="border-b border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Workspace {dataSource === "api" ? "on-chain" : "demo"}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">Contrato #{activeJob.id}</h2>
        </div>
        <span className="tag tag-chain">{activeJob.escrowState}</span>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold leading-tight text-ink">{activeJob.title}</h3>
        <p className="mt-1 text-sm text-muted">{activeJob.client}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={TimerReset} label="Timeout" value="7 dias" />
        <Stat icon={MessageSquareText} label="Chat" value="privado" />
        <Stat icon={ShieldCheck} label="Rede" value="Base" />
      </div>
    </section>
  );
}

function ContractMiniCard({ activeJob, onOpen }: { activeJob: typeof jobs[number]; onOpen: () => void }) {
  return (
    <article className="card-flat p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Contrato ativo</p>
      <h2 className="mt-1 text-lg font-bold text-ink">#{activeJob.id} · {activeJob.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{activeJob.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="tag tag-chain">{activeJob.escrowState}</span>
        <button className="btn-ghost !px-3 !py-2 text-xs" type="button" onClick={onOpen}>
          Abrir escrow
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function MatchList({
  jobs: visibleJobs,
  hasMatches,
  onOpenJob
}: {
  jobs: typeof jobs;
  hasMatches: boolean;
  onOpenJob: (jobId: number) => void;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {hasMatches ? "Matches salvos" : "Sugestoes para demo"}
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-ink">Fila de oportunidades</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleJobs.map((job) => (
          <article className="card-flat p-4 animate-fade-in" key={job.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-tight text-ink">{job.title}</h3>
                <p className="mt-1 text-sm text-muted">{job.client}</p>
              </div>
              <span className="tag tag-trust shrink-0">{job.matchScore}%</span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{job.summary}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <span className="font-medium">{job.budget}</span>
              <button className="btn-ghost !px-3 !py-2 text-xs" type="button" onClick={() => onOpenJob(job.id)}>
                Abrir
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof TimerReset;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-app p-3 transition-colors hover:border-chain/20">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-white text-chain shadow-sm">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
