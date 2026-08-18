import { describe, expect, it } from "vitest";

import { resolveAppRoute } from "./appRoute";

describe("resolveAppRoute", () => {
  it("keeps the public landing page at the root", () => {
    expect(resolveAppRoute("/")).toBe("landing");
  });

  it("routes the marketplace through /app", () => {
    expect(resolveAppRoute("/app")).toBe("product");
    expect(resolveAppRoute("/app/")).toBe("product");
  });

  it("does not treat similar public paths as the marketplace", () => {
    expect(resolveAppRoute("/application")).toBe("landing");
  });
});
