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
    <section className="mb-4 rounded-md border border-line bg-app p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Perfil</p>
      <h2 className="mt-1 text-base font-semibold text-ink">
        {session ? shortWallet(session.address) : "Conecte uma wallet"}
      </h2>

      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Nome publico
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            disabled={!session}
            value={profileName}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Papel
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink"
            disabled={!session}
            value={rolePreference}
            onChange={(event) => onRoleChange(event.target.value as "client" | "freelancer" | "both")}
          >
            <option value="both">cliente e freelancer</option>
            <option value="client">cliente</option>
            <option value="freelancer">freelancer</option>
          </select>
        </label>
        <button
          className="w-full rounded-md bg-chain px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!session}
          onClick={onSave}
        >
          Salvar perfil
        </button>
        <p className="text-xs leading-5 text-muted">{status}</p>
      </div>
    </section>
  );
}

function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
