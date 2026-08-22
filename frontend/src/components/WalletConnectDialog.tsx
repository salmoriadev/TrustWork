import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, X } from "lucide-react";
import QRCode from "qrcode";

interface WalletConnectDialogProps {
  open: boolean;
  uri: string | null;
  onClose: () => void;
}

export function WalletConnectDialog({ open, uri, onClose }: WalletConnectDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl(null);
    setCopied(false);
    if (!uri) return;
    void QRCode.toDataURL(uri, {
      width: 320,
      margin: 2,
      color: { dark: "#171918", light: "#ffffff" },
      errorCorrectionLevel: "M"
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!open) return null;

  async function copyPairingLink() {
    if (!uri) return;
    await navigator.clipboard.writeText(uri);
    setCopied(true);
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        aria-describedby="walletconnect-description"
        aria-labelledby="walletconnect-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink p-5 text-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-trust">Base Sepolia</p>
            <h2 className="mt-1 text-xl font-extrabold" id="walletconnect-title">Connect a wallet</h2>
          </div>
          <button
            aria-label="Cancel WalletConnect"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white p-3">
          {qrDataUrl ? (
            <img
              alt="WalletConnect pairing QR code"
              className="h-full w-full object-contain"
              height="320"
              src={qrDataUrl}
              width="320"
            />
          ) : (
            <div className="flex max-w-52 flex-col items-center gap-3 text-center text-sm font-semibold text-muted" role="status">
              <LoaderCircle className="h-7 w-7 animate-spin text-cobalt" aria-hidden="true" />
              Generating a secure pairing code…
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-white/75" id="walletconnect-description">
          Scan with a WalletConnect-compatible wallet. This session targets Base Sepolia only.
        </p>
        <button
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
          disabled={!uri}
          onClick={() => void copyPairingLink()}
          type="button"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Pairing link copied" : "Copy pairing link"}
        </button>
      </section>
    </div>
  );
}
