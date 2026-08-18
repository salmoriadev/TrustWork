import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  DatabaseZap,
  FileCheck2,
  Layers3,
  MessageSquareText,
  Radio,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  UserRound,
  UsersRound
} from "lucide-react";

import { EscrowActionPanel } from "./components/EscrowActionPanel";
import { EscrowTimeline } from "./components/EscrowTimeline";
import { EvidencePanel } from "./components/EvidencePanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { ReputationPanel } from "./components/ReputationPanel";
import { SwipeDeck } from "./components/SwipeDeck";
import { TermsBanner } from "./components/TermsBanner";
import { WalletBar } from "./components/WalletBar";
import {
  createSwipe,
  fetchMarketplaceJobs,
  fetchMatches,
  fetchReputation,
  refreshReputation,
  upsertUserProfile
} from "./lib/api";
import { runtimeConfig } from "./lib/config";
import { formatEscrowState } from "./lib/formatters";
import { resolveReputationWallet } from "./lib/reputationTarget";
import type { MarketplaceJob, Reputation } from "./lib/types";
import { connectWalletConnect, type WalletSession } from "./lib/wallet";

type ScreenId = "marketplace" | "escrow" | "evidence" | "profile" | "matches";
type JobsState = "loading" | "ready" | "demo" | "empty" | "error";

const emptyReputation: Reputation = {
  completedJobs: 0,
  volumeTier: "new",
  directApprovalRate: 0,
  disputeRate: 0,
  repeatClients: 0
};

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
    label: "Descobrir",
    eyebrow: "Marketplace curado",
    title: "Encontre trabalho que combina com você",
    description: "Compare escopo, orçamento e reputação antes de demonstrar interesse.",
    icon: BriefcaseBusiness
  },
  {
    id: "escrow",
    label: "Escrow",
    eyebrow: "Contrato ativo",
    title: "Acompanhe entregas e pagamentos",
    description: "Milestones, saldos e ações críticas reunidos em uma única visão.",
    icon: CircleDollarSign
  },
  {
    id: "evidence",
    label: "Evidências",
    eyebrow: "Entrega protegida",
    title: "Registre provas sem expor seu trabalho",
    description: "O conteúdo permanece privado; apenas a impressão digital vai para o contrato.",
    icon: FileCheck2
  },
  {
    id: "profile",
    label: "Perfil",
    eyebrow: "Identidade profissional",
    title: "Construa reputação verificável",
    description: "Configure seu perfil e acompanhe sinais gerados pelo histórico on-chain.",
    icon: UserRound
  },
  {
    id: "matches",
    label: "Matches",
    eyebrow: "Seu pipeline",
    title: "Oportunidades em andamento",
    description: "Retome conversas e contratos sem perder o contexto de cada oportunidade.",
    icon: UsersRound
  }
];

export default function ProductApp() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("marketplace");
  const [activeIndex, setActiveIndex] = useState(0);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [apiJobs, setApiJobs] = useState<MarketplaceJob[]>([]);
  const [dataSource, setDataSource] = useState<"api" | "mock">("api");
  const [jobsState, setJobsState] = useState<JobsState>("loading");
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("TrustWork User");
  const [rolePreference, setRolePreference] = useState<"client" | "freelancer" | "both">("both");
  const [profileStatus, setProfileStatus] = useState("Conecte sua carteira para ativar o perfil.");
  const [activeReputation, setActiveReputation] = useState<{
    walletAddress: string;
    value: Reputation;
  } | null>(null);

  const reloadJobs = useCallback(async () => {
    setJobsState("loading");
    setJobsError(null);
    try {
      const remoteJobs = await fetchMarketplaceJobs();
      if (remoteJobs.length > 0) {
        setApiJobs(remoteJobs);
        setActiveIndex(0);
        setDataSource("api");
        setJobsState("ready");
        return;
      }
      const demoJobs = await loadDemoJobs();
      if (demoJobs.length > 0) {
        setApiJobs(demoJobs);
        setDataSource("mock");
        setJobsState("demo");
      } else {
        setApiJobs([]);
        setJobsState("empty");
      }
    } catch (error) {
      const demoJobs = await loadDemoJobs();
      if (demoJobs.length > 0) {
        setApiJobs(demoJobs);
        setDataSource("mock");
        setJobsState("demo");
      } else {
        setApiJobs([]);
        setJobsError(error instanceof Error ? error.message : "API indisponível");
        setJobsState("error");
      }
    }
  }, []);

  useEffect(() => {
    void reloadJobs();
  }, [reloadJobs]);

  const activeJob = apiJobs[activeIndex] ?? null;
  const reputationWallet = resolveReputationWallet({
    isProfile: activeScreen === "profile",
    sessionAddress: session?.address,
    jobWallet: activeJob?.freelancerWallet
  });
  const reputationFallback = activeScreen === "profile"
    ? emptyReputation
    : activeJob?.reputation ?? emptyReputation;
  const displayedReputation = activeReputation?.walletAddress === reputationWallet
    ? activeReputation.value
    : reputationFallback;
  const matchedJobs = useMemo(
    () => apiJobs.filter((job) => matches.includes(job.id)),
    [apiJobs, matches]
  );

  useEffect(() => {
    let ignore = false;
    if (!reputationWallet) {
      setActiveReputation(null);
      return;
    }
    fetchReputation(reputationWallet)
      .then((reputation) => {
        if (!ignore) {
          setActiveReputation({ walletAddress: reputationWallet, value: reputation });
        }
      })
      .catch(() => {
        if (!ignore) setActiveReputation(null);
      });
    return () => {
      ignore = true;
    };
  }, [reputationWallet]);

  async function refreshActiveReputation() {
    if (!reputationWallet) {
      if (activeScreen === "profile") {
        setProfileStatus("Conecte sua carteira para atualizar a reputação.");
      }
      return;
    }
    try {
      const reputation = await refreshReputation(reputationWallet);
      setActiveReputation({ walletAddress: reputationWallet, value: reputation });
      setProfileStatus("Reputação verificável atualizada.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Não foi possível atualizar a reputação.");
    }
  }

  function nextJob() {
    if (apiJobs.length > 0) setActiveIndex((current) => (current + 1) % apiJobs.length);
  }

  async function persistSwipe(direction: "left" | "right" | "super") {
    if (!session || !activeJob?.dbId) return;
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
      setProfileStatus(error instanceof Error ? error.message : "Não foi possível salvar seu interesse.");
    }
  }

  async function skipJob() {
    await persistSwipe("left");
    nextJob();
  }

  async function matchJob() {
    if (!activeJob) return;
    setMatches((current) => current.includes(activeJob.id) ? current : [...current, activeJob.id]);
    await persistSwipe("right");
    nextJob();
  }

  async function saveProfile(walletAddress = session?.address) {
    if (!walletAddress) return;
    try {
      const profile = await upsertUserProfile({ walletAddress, displayName: profileName, rolePreference });
      setProfileName(profile.display_name ?? profileName);
      setRolePreference(profile.role_preference ?? "both");
      setProfileStatus("Perfil salvo. Seus próximos interesses serão sincronizados.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
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

  function openJob(jobId: string, screen: ScreenId = "escrow") {
    const nextIndex = apiJobs.findIndex((job) => job.id === jobId);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
    setActiveScreen(screen);
  }

  return (
    <div className="min-h-screen bg-app text-ink">
      <SideNavigation activeScreen={activeScreen} matchCount={matches.length} onNavigate={setActiveScreen} />

      <div className="min-w-0 lg:pl-60">
        <WalletBar session={session} onConnect={handleConnect} error={walletError} />
        <TermsBanner />

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <ScreenHeader screen={activeScreenConfig} jobsState={jobsState} />

          {activeScreen === "profile" ? (
            <div className="grid items-start gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
              <ProfilePanel session={session} profileName={profileName} rolePreference={rolePreference} status={profileStatus} onNameChange={setProfileName} onRoleChange={setRolePreference} onSave={() => void saveProfile()} />
              <section className="surface overflow-hidden">
                <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
              </section>
            </div>
          ) : !activeJob ? (
            <MarketplaceDataState state={jobsState} error={jobsError} onRetry={() => void reloadJobs()} />
          ) : (
            <>

          {activeScreen === "marketplace" && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <SwipeDeck job={activeJob} index={activeIndex} total={apiJobs.length} onSkip={skipJob} onMatch={matchJob} />
              <aside className="space-y-5 xl:sticky xl:top-24">
                <section className="surface overflow-hidden">
                  <ContractSummary activeJob={activeJob} dataSource={dataSource} />
                  <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} compact />
                </section>
                <button className="btn-primary w-full" type="button" onClick={() => setActiveScreen("escrow")}>
                  Ver contrato e milestones
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </aside>
            </div>
          )}

          {activeScreen === "escrow" && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="surface overflow-hidden">
                <ContractSummary activeJob={activeJob} dataSource={dataSource} />
                <EscrowTimeline job={activeJob} />
                <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
              </section>
              <EscrowActionPanel activeJob={activeJob} onRefresh={reloadJobs} />
            </div>
          )}

          {activeScreen === "evidence" && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <EvidencePanel activeJob={activeJob} session={session} />
              <aside className="space-y-5">
                <ContractMiniCard activeJob={activeJob} onOpen={() => setActiveScreen("escrow")} />
                <ProfilePanel session={session} profileName={profileName} rolePreference={rolePreference} status={profileStatus} onNameChange={setProfileName} onRoleChange={setRolePreference} onSave={() => void saveProfile()} />
              </aside>
            </div>
          )}

          {activeScreen === "matches" && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <MatchList jobs={matchedJobs.length ? matchedJobs : apiJobs.slice(0, 3)} hasMatches={matchedJobs.length > 0} onOpenJob={openJob} />
              <ContractMiniCard activeJob={activeJob} onOpen={() => setActiveScreen("escrow")} />
            </div>
          )}
            </>
          )}
        </main>
      </div>

      <MobileNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}

async function loadDemoJobs(): Promise<MarketplaceJob[]> {
  if (!import.meta.env.DEV || !runtimeConfig.demoDataEnabled) return [];
  const { jobs } = await import("./lib/mockData");
  return jobs;
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
        <Layers3 className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted">Work, secured</p>
        <p className="text-lg font-extrabold text-ink">TrustWork</p>
      </div>
    </div>
  );
}

function SideNavigation({
  activeScreen,
  matchCount,
  onNavigate
}: {
  activeScreen: ScreenId;
  matchCount: number;
  onNavigate: (screen: ScreenId) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-white px-4 py-5 lg:flex lg:flex-col">
      <div className="px-2"><Brand /></div>
      <nav className="mt-9 space-y-1" aria-label="Navegação principal">
        {screens.map((screen) => {
          const Icon = screen.icon;
          const active = screen.id === activeScreen;
          return (
            <button key={screen.id} type="button" onClick={() => onNavigate(screen.id)} aria-current={active ? "page" : undefined} className={`nav-item ${active ? "nav-item-active" : ""}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>{screen.label}</span>
              {screen.id === "matches" && matchCount > 0 ? <span className="ml-auto rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">{matchCount}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-line pt-5">
        <div className="rounded-lg bg-app p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-trust" />
            {runtimeConfig.networkName} configurada
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">Ambiente {runtimeConfig.environment}; chain ID {runtimeConfig.chainId}.</p>
        </div>
        <p className="mt-4 px-2 text-[11px] text-muted">v0.1 · {runtimeConfig.environment}</p>
      </div>
    </aside>
  );
}

function MobileNavigation({ activeScreen, onNavigate }: { activeScreen: ScreenId; onNavigate: (screen: ScreenId) => void }) {
  return (
    <nav className="mobile-dock lg:hidden" aria-label="Navegação principal">
      {screens.map((screen) => {
        const Icon = screen.icon;
        const active = screen.id === activeScreen;
        return (
          <button key={screen.id} type="button" onClick={() => onNavigate(screen.id)} aria-current={active ? "page" : undefined} className={`mobile-nav-item ${active ? "mobile-nav-item-active" : ""}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{screen.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function ScreenHeader({ screen, jobsState }: { screen: (typeof screens)[number]; jobsState: JobsState }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{screen.eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-extrabold text-ink sm:text-3xl">{screen.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{screen.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
        <Radio className="h-4 w-4 text-trust" aria-hidden="true" />
        <span>{jobsStateLabel(jobsState)}</span>
      </div>
    </header>
  );
}

function MarketplaceDataState({
  state,
  error,
  onRetry
}: {
  state: JobsState;
  error: string | null;
  onRetry: () => void;
}) {
  const loading = state === "loading";
  return (
    <section className="surface flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-chain-soft text-chain">
        {loading ? <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" /> : <DatabaseZap className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-ink">
        {loading ? "Carregando oportunidades" : state === "empty" ? "Marketplace ainda vazio" : "Dados indisponíveis"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {loading
          ? "Consultando a API configurada para este ambiente."
          : state === "empty"
            ? "A API respondeu corretamente, mas ainda não há contratos indexados."
            : `Não foi possível consultar a API${error ? `: ${error}` : "."}`}
      </p>
      {!loading ? <button className="btn-ghost mt-5" type="button" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Tentar novamente</button> : null}
    </section>
  );
}

function jobsStateLabel(state: JobsState): string {
  const labels: Record<JobsState, string> = {
    loading: "Consultando API",
    ready: "Dados da API",
    demo: "Dados de demonstração",
    empty: "API sem contratos",
    error: "API indisponível"
  };
  return labels[state];
}

function ContractSummary({ activeJob, dataSource }: { activeJob: MarketplaceJob; dataSource: "api" | "mock" }) {
  return (
    <section className="border-b border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Contrato #{activeJob.id} · {dataSource === "api" ? "ao vivo" : "demonstração"}</p>
          <h2 className="mt-2 text-xl font-extrabold leading-tight text-ink">{activeJob.title}</h2>
          <p className="mt-1 text-sm text-muted">{activeJob.client}</p>
        </div>
        <span className="status status-chain shrink-0">{formatEscrowState(activeJob.escrowState)}</span>
      </div>
      <div className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
        <ContractStat icon={TimerReset} label="Prazo" value="7 dias" />
        <ContractStat icon={MessageSquareText} label="Canal" value="Privado" />
        <ContractStat icon={ShieldCheck} label="Rede" value="Base" />
      </div>
    </section>
  );
}

function ContractMiniCard({ activeJob, onOpen }: { activeJob: MarketplaceJob; onOpen: () => void }) {
  return (
    <article className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><p className="eyebrow">Contrato ativo</p><span className="status status-chain">{formatEscrowState(activeJob.escrowState)}</span></div>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">#{activeJob.id} · {activeJob.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{activeJob.summary}</p>
      <button className="btn-ghost mt-5 w-full" type="button" onClick={onOpen}>Abrir escrow <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
    </article>
  );
}

function MatchList({ jobs: visibleJobs, hasMatches, onOpenJob }: { jobs: MarketplaceJob[]; hasMatches: boolean; onOpenJob: (jobId: string) => void }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="eyebrow">{hasMatches ? "Interesses salvos" : "Sugestões para explorar"}</p><h2 className="mt-2 text-xl font-extrabold text-ink">Seu pipeline</h2></div>
        <span className="text-sm font-semibold text-muted">{visibleJobs.length} oportunidades</span>
      </div>
      {!hasMatches && <div className="mb-5 flex gap-3 rounded-lg border border-chain/20 bg-chain-soft p-4 text-sm text-ink"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chain" /><p>Você ainda não salvou oportunidades. Estas são as melhores sugestões para começar.</p></div>}
      <div className="divide-y divide-line">
        {visibleJobs.map((job) => (
          <article className="group grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={job.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="status status-trust">{job.matchScore}% compatível</span><span className="text-xs text-muted">#{job.id}</span></div>
              <h3 className="mt-2 text-base font-extrabold text-ink">{job.title}</h3>
              <p className="mt-1 text-sm text-muted">{job.client} · {job.budget}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{job.summary}</p>
            </div>
            <button className="btn-ghost w-full sm:w-auto" type="button" onClick={() => onOpenJob(job.id)}>Ver contrato <ArrowRight className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContractStat({ icon: Icon, label, value }: { icon: typeof TimerReset; label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5">
      <Icon className="mb-2 h-4 w-4 text-chain" aria-hidden="true" />
      <p className="truncate text-[10px] font-bold uppercase text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
