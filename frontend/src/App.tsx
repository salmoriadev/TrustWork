import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MessageSquareText, TimerReset } from "lucide-react";

import { EscrowActionPanel } from "./components/EscrowActionPanel";
import { EscrowTimeline } from "./components/EscrowTimeline";
import { ProfilePanel } from "./components/ProfilePanel";
import { ReputationPanel } from "./components/ReputationPanel";
import { SwipeDeck } from "./components/SwipeDeck";
import { WalletBar } from "./components/WalletBar";
import { createSwipe, fetchMarketplaceJobs, fetchMatches, upsertUserProfile } from "./lib/api";
import { jobs } from "./lib/mockData";
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
  const matchedJobs = useMemo(
    () => apiJobs.filter((job) => matches.includes(job.id)),
    [apiJobs, matches]
  );

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

      <main className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.05fr)_300px]">
        <SwipeDeck
          job={activeJob}
          index={activeIndex}
          total={apiJobs.length}
          onSkip={skipJob}
          onMatch={matchJob}
        />

        <section className="border-r border-line bg-white">
          <div className="border-b border-line p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  Workspace {dataSource === "api" ? "on-chain" : "demo"}
                </p>
                <h2 className="text-lg font-semibold text-ink">Contrato #{activeJob.id}</h2>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-chain"
                type="button"
                aria-label="Abrir contrato"
                title="Abrir contrato"
              >
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Action icon={TimerReset} label="Timeout" value="7 dias" />
              <Action icon={MessageSquareText} label="Chat" value="privado" />
              <Action icon={ArrowUpRight} label="Rede" value="Base" />
            </div>
          </div>

          <EscrowTimeline job={activeJob} />
          <ReputationPanel reputation={activeJob.reputation} />
        </section>

        <aside className="bg-white p-4 md:p-5">
          <ProfilePanel
            session={session}
            profileName={profileName}
            rolePreference={rolePreference}
            status={profileStatus}
            onNameChange={setProfileName}
            onRoleChange={setRolePreference}
            onSave={() => void saveProfile()}
          />

          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Matches</p>
            <h2 className="text-lg font-semibold text-ink">Fila ativa</h2>
          </div>

          <div className="space-y-3">
            {(matchedJobs.length ? matchedJobs : apiJobs.slice(0, 2)).map((job) => (
              <article className="rounded-md border border-line bg-app p-3" key={job.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{job.title}</h3>
                    <p className="mt-1 text-xs text-muted">{job.client}</p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-trust">
                    {job.matchScore}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{job.budget}</span>
                  <span>{job.escrowState}</span>
                </div>
              </article>
            ))}
          </div>

          <EscrowActionPanel activeJob={activeJob} onRefresh={reloadJobs} />
        </aside>
      </main>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  value
}: {
  icon: typeof TimerReset;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-line bg-app p-3">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-white text-chain">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
