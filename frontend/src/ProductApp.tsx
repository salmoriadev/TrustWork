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
  authenticateWallet,
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
import { connectWallet, type AuthenticatedWalletSession, type WalletKind } from "./lib/wallet";

type ScreenId = "marketplace" | "escrow" | "evidence" | "profile" | "matches";
type JobsState = "loading" | "waking" | "ready" | "demo" | "empty" | "error";

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
    label: "Discover",
    eyebrow: "Indexed marketplace",
    title: "Explore real Base Sepolia escrows",
    description: "Compare scope, testnet budget, milestones, and on-chain state without connecting a wallet.",
    icon: BriefcaseBusiness
  },
  {
    id: "escrow",
    label: "Escrow",
    eyebrow: "Active contract",
    title: "Track delivery and testnet settlement",
    description: "Milestones, balances, proofs, and contract actions in one technical view.",
    icon: CircleDollarSign
  },
  {
    id: "evidence",
    label: "Evidence",
    eyebrow: "Integrity proof",
    title: "Prove integrity without uploading the work",
    description: "Files and notes are hashed in your browser; TrustWork stores metadata and the digest only.",
    icon: FileCheck2
  },
  {
    id: "profile",
    label: "Profile",
    eyebrow: "Wallet identity",
    title: "Build verifiable reputation",
    description: "Configure a public profile and inspect signals projected from on-chain history.",
    icon: UserRound
  },
  {
    id: "matches",
    label: "Matches",
    eyebrow: "Your testnet pipeline",
    title: "Saved opportunities",
    description: "Wallet-authenticated interests stay separate from anonymous read-only browsing.",
    icon: UsersRound
  }
];

export default function ProductApp() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("marketplace");
  const [activeIndex, setActiveIndex] = useState(0);
  const [session, setSession] = useState<AuthenticatedWalletSession | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [apiJobs, setApiJobs] = useState<MarketplaceJob[]>([]);
  const [dataSource, setDataSource] = useState<"api" | "mock">("api");
  const [jobsState, setJobsState] = useState<JobsState>("loading");
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("TrustWork User");
  const [rolePreference, setRolePreference] = useState<"client" | "freelancer" | "both">("both");
  const [profileStatus, setProfileStatus] = useState("Connect and sign in to activate your profile.");
  const [activeReputation, setActiveReputation] = useState<{
    walletAddress: string;
    value: Reputation;
  } | null>(null);

  const reloadJobs = useCallback(async () => {
    setJobsState("loading");
    setJobsError(null);
    try {
      const remoteJobs = await fetchMarketplaceJobs(() => setJobsState("waking"));
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
        setJobsError(error instanceof Error ? error.message : "The demo API is unavailable.");
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
        setProfileStatus("Connect your wallet to refresh reputation.");
      }
      return;
    }
    try {
      if (!session || session.address.toLowerCase() !== reputationWallet.toLowerCase()) {
        setProfileStatus("Only the authenticated wallet can refresh its own reputation.");
        return;
      }
      const reputation = await refreshReputation(session);
      setActiveReputation({ walletAddress: reputationWallet, value: reputation });
      setProfileStatus("Verifiable reputation refreshed.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Reputation could not be refreshed.");
    }
  }

  function nextJob() {
    if (apiJobs.length > 0) setActiveIndex((current) => (current + 1) % apiJobs.length);
  }

  async function persistSwipe(direction: "left" | "right" | "super") {
    if (!session || !activeJob?.dbId) return;
    try {
      await createSwipe({
        session,
        targetId: activeJob.dbId,
        direction,
        context: { onchainJobId: activeJob.id, source: "swipe-deck" }
      });
      if (direction !== "left") {
        const remoteMatches = await fetchMatches(session);
        setMatches(remoteMatches.map((job) => job.id));
      }
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Your interest could not be saved.");
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

  async function saveProfile(activeSession = session) {
    if (!activeSession) return;
    try {
      const profile = await upsertUserProfile({ session: activeSession, displayName: profileName, rolePreference });
      setProfileName(profile.display_name ?? profileName);
      setRolePreference(profile.role_preference ?? "both");
      setProfileStatus("Profile saved. Future interests will use this verified wallet.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "The profile could not be saved.");
    }
  }

  async function handleConnect(kind: WalletKind) {
    try {
      setWalletError(null);
      const walletSession = await connectWallet(kind);
      const nextSession = await authenticateWallet(walletSession);
      setSession(nextSession);
      await saveProfile(nextSession);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection failed.");
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
        <WalletBar session={session} onConnect={(kind) => void handleConnect(kind)} error={walletError} />
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
                  View contract and milestones
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
              <EscrowActionPanel activeJob={activeJob} session={session} onRefresh={reloadJobs} />
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
      <nav className="mt-9 space-y-1" aria-label="Primary navigation">
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
            {runtimeConfig.networkName} configured
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{runtimeConfig.environment} environment; chain ID {runtimeConfig.chainId}.</p>
        </div>
        <p className="mt-4 px-2 text-[11px] text-muted">v0.1 · {runtimeConfig.environment}</p>
      </div>
    </aside>
  );
}

function MobileNavigation({ activeScreen, onNavigate }: { activeScreen: ScreenId; onNavigate: (screen: ScreenId) => void }) {
  return (
    <nav className="mobile-dock lg:hidden" aria-label="Primary navigation">
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
  const loading = state === "loading" || state === "waking";
  return (
    <section className="surface flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-chain-soft text-chain">
        {loading ? <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" /> : <DatabaseZap className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-ink">
        {state === "waking" ? "Waking up the demo API" : loading ? "Loading indexed contracts" : state === "empty" ? "No indexed contracts yet" : "Demo data unavailable"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {loading
          ? state === "waking" ? "Render free services can sleep. Retrying for a bounded period…" : "Querying the public read-only API."
          : state === "empty"
            ? "The API is healthy, but no Base Sepolia contracts have been indexed yet."
            : `The API did not recover${error ? `: ${error}` : "."}`}
      </p>
      {!loading ? <button className="btn-ghost mt-5" type="button" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Retry</button> : null}
    </section>
  );
}

function jobsStateLabel(state: JobsState): string {
  const labels: Record<JobsState, string> = {
    loading: "Consulting API",
    waking: "Waking demo API",
    ready: "Live indexed data",
    demo: "Local demo data",
    empty: "No indexed contracts",
    error: "API unavailable"
  };
  return labels[state];
}

function ContractSummary({ activeJob, dataSource }: { activeJob: MarketplaceJob; dataSource: "api" | "mock" }) {
  return (
    <section className="border-b border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Contract #{activeJob.id} · {dataSource === "api" ? "indexed" : "local fixture"}</p>
          <h2 className="mt-2 text-xl font-extrabold leading-tight text-ink">{activeJob.title}</h2>
          <p className="mt-1 text-sm text-muted">{activeJob.client}</p>
        </div>
        <span className="status status-chain shrink-0">{formatEscrowState(activeJob.escrowState)}</span>
      </div>
      <div className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
        <ContractStat icon={TimerReset} label="Review" value="7 days" />
        <ContractStat icon={MessageSquareText} label="Evidence" value="Digest only" />
        <ContractStat icon={ShieldCheck} label="Network" value="Base Sepolia" />
      </div>
    </section>
  );
}

function ContractMiniCard({ activeJob, onOpen }: { activeJob: MarketplaceJob; onOpen: () => void }) {
  return (
    <article className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><p className="eyebrow">Active contract</p><span className="status status-chain">{formatEscrowState(activeJob.escrowState)}</span></div>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">#{activeJob.id} · {activeJob.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{activeJob.summary}</p>
      <button className="btn-ghost mt-5 w-full" type="button" onClick={onOpen}>Open escrow <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
    </article>
  );
}

function MatchList({ jobs: visibleJobs, hasMatches, onOpenJob }: { jobs: MarketplaceJob[]; hasMatches: boolean; onOpenJob: (jobId: string) => void }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="eyebrow">{hasMatches ? "Saved interests" : "Contracts to explore"}</p><h2 className="mt-2 text-xl font-extrabold text-ink">Your pipeline</h2></div>
        <span className="text-sm font-semibold text-muted">{visibleJobs.length} opportunities</span>
      </div>
      {!hasMatches && <div className="mb-5 flex gap-3 rounded-lg border border-chain/20 bg-chain-soft p-4 text-sm text-ink"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chain" /><p>Connect a wallet to save interests. Anonymous visitors can still inspect every indexed contract.</p></div>}
      <div className="divide-y divide-line">
        {visibleJobs.map((job) => (
          <article className="group grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={job.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="status status-trust">Indexed testnet</span><span className="text-xs text-muted">#{job.id}</span></div>
              <h3 className="mt-2 text-base font-extrabold text-ink">{job.title}</h3>
              <p className="mt-1 text-sm text-muted">{job.client} · {job.budget}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{job.summary}</p>
            </div>
            <button className="btn-ghost w-full sm:w-auto" type="button" onClick={() => onOpenJob(job.id)}>View contract <ArrowRight className="h-4 w-4" /></button>
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
