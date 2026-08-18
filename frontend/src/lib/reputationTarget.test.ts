import { describe, expect, it } from "vitest";

import { resolveReputationWallet } from "./reputationTarget";

describe("resolveReputationWallet", () => {
  it("uses the connected wallet on the profile without requiring a marketplace job", () => {
    expect(
      resolveReputationWallet({
        isProfile: true,
        sessionAddress: "0xProfile",
        jobWallet: null
      })
    ).toBe("0xProfile");
  });

  it("keeps using the job freelancer outside the profile", () => {
    expect(
      resolveReputationWallet({
        isProfile: false,
        sessionAddress: "0xProfile",
        jobWallet: "0xFreelancer"
      })
    ).toBe("0xFreelancer");
  });

  it("returns no target for a disconnected profile", () => {
    expect(
      resolveReputationWallet({
        isProfile: true,
        sessionAddress: null,
        jobWallet: "0xFreelancer"
      })
    ).toBeNull();
  });
});
