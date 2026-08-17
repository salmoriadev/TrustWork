const USDC_DECIMALS = 6;
const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

export function parseUsdcAmount(value: string): string {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
    throw new Error(`Valor de milestone invalido: ${value}`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  const raw = BigInt(whole) * USDC_SCALE + BigInt(fraction.padEnd(USDC_DECIMALS, "0"));
  if (raw <= 0n) {
    throw new Error("Os milestones devem ser maiores que zero.");
  }
  return raw.toString();
}

export function formatUsdcRaw(rawValue: string, locale = "pt-BR"): string {
  if (!/^\d+$/.test(rawValue)) {
    throw new Error("O valor raw de USDC deve ser um inteiro decimal sem sinal.");
  }

  const raw = BigInt(rawValue);
  const whole = raw / USDC_SCALE;
  const fraction = String(raw % USDC_SCALE).padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  const formattedWhole = new Intl.NumberFormat(locale).format(whole);
  return fraction ? `${formattedWhole},${fraction}` : formattedWhole;
}

export function normalizeUint256(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new Error("uint256 deve ser uma string decimal sem sinal.");
  }
  const normalized = BigInt(value);
  if (normalized >= 2n ** 256n) {
    throw new Error("Valor excede o limite de uint256.");
  }
  return normalized.toString();
}
