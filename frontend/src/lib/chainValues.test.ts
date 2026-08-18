import { describe, expect, it } from "vitest";

import { formatUsdcRaw, normalizeUint256, parseUsdcAmount } from "./chainValues";

describe("chain values", () => {
  it("preserves IDs above Number.MAX_SAFE_INTEGER", () => {
    expect(normalizeUint256("18446744073709551617")).toBe("18446744073709551617");
  });

  it("converts USDC to raw units without floating point", () => {
    expect(parseUsdcAmount("1200.000001")).toBe("1200000001");
    expect(parseUsdcAmount("0.1")).toBe("100000");
  });

  it("formats raw units without losing precision", () => {
    expect(formatUsdcRaw("18446744073709551617")).toBe("18,446,744,073,709.551617");
  });

  it("rejects precision beyond USDC decimals", () => {
    expect(() => parseUsdcAmount("1.0000001")).toThrow("Invalid");
  });
});
