import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MessageSquareText, TimerReset } from "lucide-react";

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

export default function App() {
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

  return (
    <div className="min-h-screen bg-app text-ink">
      <WalletBar session={session} onConnect={handleConnect} error={walletError} />
      <TermsBanner />

      <main className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[minmax(380px,0.9fr)_minmax(440px,1.1fr)_320px]">
        <SwipeDeck
          job={activeJob}
          index={activeIndex}
          total={apiJobs.length}
          onSkip={skipJob}
          onMatch={matchJob}
        />

        <section className="border-r border-line bg-white">
          <div className="border-b border-line p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Workspace {dataSource === "api" ? "on-chain" : "demo"}
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-ink">Contrato #{activeJob.id}</h2>
              </div>
              <button
                className="btn-icon"
                type="button"
                aria-label="Abrir contrato"
                title="Abrir contrato"
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={TimerReset} label="Timeout" value="7 dias" />
              <Stat icon={MessageSquareText} label="Chat" value="privado" />
              <Stat icon={ArrowUpRight} label="Rede" value="Base" />
            </div>
          </div>

          <EscrowTimeline job={activeJob} />
          <ReputationPanel reputation={displayedReputation} onRefresh={refreshActiveReputation} />
        </section>

        <aside className="p-5 space-y-4">
          <ProfilePanel
            session={session}
            profileName={profileName}
            rolePreference={rolePreference}
            status={profileStatus}
            onNameChange={setProfileName}
            onRoleChange={setRolePreference}
            onSave={() => void saveProfile()}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Matches</p>
            <h2 className="mt-0.5 text-base font-bold text-ink">Fila ativa</h2>
          </div>

          <div className="space-y-3">
            {(matchedJobs.length ? matchedJobs : apiJobs.slice(0, 2)).map((job) => (
              <article className="card-flat p-3 animate-fade-in" key={job.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">{job.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">{job.client}</p>
                  </div>
                  <span className="tag tag-trust shrink-0">{job.matchScore}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span className="font-medium">{job.budget}</span>
                  <span className="tag tag-chain text-[10px] !py-0.5">{job.escrowState}</span>
                </div>
              </article>
            ))}
          </div>

          <EscrowActionPanel activeJob={activeJob} onRefresh={reloadJobs} />
          <EvidencePanel activeJob={activeJob} session={session} />
        </aside>
      </main>
    </div>
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
