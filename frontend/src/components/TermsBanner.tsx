import { ShieldAlert } from "lucide-react";

export function TermsBanner() {
  return (
    <aside className="flex items-start gap-3 border-b border-gold/20 bg-[#FFF9EA] px-4 py-3 text-xs text-gold sm:px-6 lg:px-8" aria-label="Testnet notice">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">
        <strong className="font-bold">Base Sepolia · Testnet only.</strong>{" "}
        Test ETH and test USDC have no monetary value. TrustWork is an early-access engineering demo, not a commercial marketplace.
      </p>
    </aside>
  );
}
