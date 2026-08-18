import type { AuthenticatedWalletSession } from "../lib/wallet";
import { formatAddress } from "../lib/formatters";

interface ProfilePanelProps {
  session: AuthenticatedWalletSession | null;
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
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-chain-soft text-sm font-extrabold text-chain-deep">
          {session ? session.address.slice(2, 4).toUpperCase() : "?"}
        </div>
        <div className="min-w-0">
          <p className="eyebrow">Profile</p>
          <h2 className="mt-1 truncate text-sm font-extrabold text-ink">
            {session ? formatAddress(session.address) : "Connect a wallet"}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label mb-1.5" htmlFor="profile-name">Public name</label>
          <input
            id="profile-name"
            className="input"
            disabled={!session}
            value={profileName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="profile-role">Role</label>
          <select
            id="profile-role"
            className="input"
            disabled={!session}
            value={rolePreference}
            onChange={(event) => onRoleChange(event.target.value as "client" | "freelancer" | "both")}
          >
            <option value="both">Client and freelancer</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
        <button
          className="btn-primary w-full"
          type="button"
          disabled={!session}
          onClick={onSave}
        >
          Save profile
        </button>
        {status ? (
          <p className="rounded-lg bg-app px-3 py-2.5 text-xs leading-relaxed text-muted" role="status">{status}</p>
        ) : null}
      </div>
    </section>
  );
}
