import { describe, expect, it } from "vitest";

import { digestEvidence } from "./evidence";

describe("digestEvidence", () => {
  it("creates a deterministic bytes32 SHA-256 digest without returning content", async () => {
    const result = await digestEvidence(null, "TrustWork proof");
    expect(result.digest).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result).not.toHaveProperty("body");
    expect((await digestEvidence(null, "TrustWork proof")).digest).toBe(result.digest);
  });
});
