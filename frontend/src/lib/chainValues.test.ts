import { describe, expect, it } from "vitest";

import { formatUsdcRaw, normalizeUint256, parseUsdcAmount } from "./chainValues";

describe("chain values", () => {
  it("preserva ids acima de Number.MAX_SAFE_INTEGER", () => {
    expect(normalizeUint256("18446744073709551617")).toBe("18446744073709551617");
  });

  it("converte USDC para unidades raw sem ponto flutuante", () => {
    expect(parseUsdcAmount("1200.000001")).toBe("1200000001");
    expect(parseUsdcAmount("0.1")).toBe("100000");
  });

  it("formata unidades raw sem perder precisao", () => {
    expect(formatUsdcRaw("18446744073709551617")).toBe("18.446.744.073.709,551617");
  });

  it("rejeita precisao maior que a suportada pelo USDC", () => {
    expect(() => parseUsdcAmount("1.0000001")).toThrow("invalido");
  });
});
