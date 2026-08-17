import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { runtimeConfig } from "../lib/config";

export function TermsBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || runtimeConfig.environment === "production") {
    return null;
  }

  return (
    <div className="flex animate-slide-up items-start gap-3 border-b border-gold/20 bg-[#FFF9EA] px-4 py-3 text-xs text-gold sm:px-6 lg:px-8">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">
        <strong className="font-bold">Ambiente {runtimeConfig.environment}.</strong>{" "}
        {runtimeConfig.environment === "staging"
          ? "Este ambiente usa ativos de teste; nenhum fundo real deve ser enviado."
          : "Dados de demonstração podem estar habilitados; confira a rede antes de assinar."}
      </p>
      <button
        className="shrink-0 rounded-md p-1 transition hover:bg-gold/10 active:scale-95"
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
