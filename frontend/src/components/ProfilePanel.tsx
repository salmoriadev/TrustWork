import type { WalletSession } from "../lib/wallet";

interface ProfilePanelProps {
  session: WalletSession | null;
  profileName: string;
  rolePreference: "client" | "freelancer" | "both";
  status: string;
  onNameChange: (value: string) => void;
  onRoleChange: (value: "client" | "freelancer" | "both") => void;
  onSave: () => void;
}

export function ProfilePanel({
  session,
  profileName,
  rolePreference,
  status,
  onNameChange,
  onRoleChange,
  onSave
}: ProfilePanelProps) {
  return (
    <section className="card-flat p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-chain to-trust text-sm font-bold text-white shadow-sm">
          {session ? session.address.slice(2, 4).toUpperCase() : "?"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Perfil</p>
          <h2 className="truncate text-sm font-bold text-ink">
            {session ? shortWallet(session.address) : "Conecte uma wallet"}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label mb-1.5">Nome publico</label>
          <input
            className="input"
            disabled={!session}
            value={profileName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="label mb-1.5">Papel</label>
          <select
            className="input"
            disabled={!session}
            value={rolePreference}
            onChange={(event) => onRoleChange(event.target.value as "client" | "freelancer" | "both")}
          >
            <option value="both">Cliente e freelancer</option>
            <option value="client">Cliente</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
        <button
          className="btn-primary w-full"
          type="button"
          disabled={!session}
          onClick={onSave}
        >
          Salvar perfil
        </button>
        {status ? (
          <p className="rounded-lg bg-app px-3 py-2 text-xs leading-relaxed text-muted">{status}</p>
        ) : null}
      </div>
    </section>
  );
}

function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
