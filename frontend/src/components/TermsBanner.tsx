import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export function TermsBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 border-b border-warning/20 bg-warning/5 px-4 py-3 text-xs text-warning md:px-6">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">
        <strong className="font-semibold">Testnet — sem valor real.</strong> Este ambiente usa
        Base Sepolia com USDC de teste. Jobs tem cap de USDC 10.000. Nenhum fundo real esta em
        custodia. Consulte os <span className="underline cursor-pointer">termos de uso</span>.
      </p>
      <button
        className="shrink-0 rounded p-0.5 transition hover:bg-warning/10"
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
