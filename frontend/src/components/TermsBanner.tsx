import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export function TermsBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="flex animate-slide-up items-start gap-3 border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent px-5 py-3 text-xs text-gold">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">
        <strong className="font-semibold">Testnet — sem valor real.</strong> Este ambiente usa
        Base Sepolia com USDC de teste. Jobs tem cap de USDC 10.000. Nenhum fundo real esta em
        custodia. <span className="cursor-pointer underline decoration-gold/40 hover:decoration-gold/70">Termos de uso</span>.
      </p>
      <button
        className="shrink-0 rounded-lg p-1 transition hover:bg-gold/10 active:scale-95"
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
