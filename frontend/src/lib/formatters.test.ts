import { describe, expect, it } from "vitest";

import {
  bpsToPercent,
  formatAddress,
  formatBps,
  formatDateTime,
  formatEscrowState,
  formatMilestoneState
} from "./formatters";

describe("shared formatters", () => {
  it("abrevia somente enderecos Ethereum validos", () => {
    expect(formatAddress("0x00000000000000000000000000000000000000bb")).toBe("0x0000...00bb");
    expect(formatAddress("not-an-address")).toBe("not-an-address");
  });

  it("formata BPS e limita a largura visual", () => {
    expect(formatBps(8_700)).toBe("87,0%");
    expect(bpsToPercent(12_000)).toBe(100);
    expect(() => formatBps(10_001)).toThrow("BPS");
  });

  it("formata datas validas e trata entrada invalida", () => {
    expect(formatDateTime("invalid")).toBe("Data indisponivel");
    expect(formatDateTime("2026-08-04T12:30:00Z", "en-US")).toContain("8/4/26");
  });

  it("traduz estados on-chain de forma centralizada", () => {
    expect(formatEscrowState("Funded")).toBe("Financiado");
    expect(formatMilestoneState("RevisionRequested")).toBe("Revisao solicitada");
  });
});
