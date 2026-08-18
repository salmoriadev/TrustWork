export function resolveReputationWallet({
  isProfile,
  sessionAddress,
  jobWallet
}: {
  isProfile: boolean;
  sessionAddress?: string | null;
  jobWallet?: string | null;
}): string | null {
  return (isProfile ? sessionAddress : jobWallet) ?? null;
}
