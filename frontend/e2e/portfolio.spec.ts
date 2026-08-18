import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const emptyJobs = async (page: Page) => {
  await page.route("**/jobs", (route) => route.fulfill({ status: 200, json: [] }));
};

test("landing is static, accessible, and links to the marketplace", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hire talent");
  await expect(page.getByRole("link", { name: /explore the marketplace/i }).first()).toHaveAttribute("href", "/app");
  expect(externalRequests).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("direct marketplace access supports anonymous browsing", async ({ page }) => {
  await emptyJobs(page);
  await page.goto("/app");

  await expect(page.getByText("Base Sepolia · Testnet only.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No indexed contracts yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: /browser wallet/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("cold API response displays a bounded wake-up state", async ({ page }) => {
  await page.route("**/jobs", (route) => route.fulfill({ status: 503, json: { detail: "starting" } }));
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Waking up the demo API" })).toBeVisible({ timeout: 3_000 });
});

test("wallet cancellation is reported without creating a session", async ({ page }) => {
  await emptyJobs(page);
  await page.addInitScript(() => {
    const rejection = Object.assign(new Error("User rejected the wallet request."), { code: 4001 });
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        request: async ({ method }: { method: string }) => {
          if (method === "eth_chainId") return "0x14a34";
          if (method === "eth_requestAccounts") throw rejection;
          return null;
        }
      }
    });
  });
  await page.goto("/app");
  await page.getByRole("button", { name: /browser wallet/i }).click();
  await expect(page.getByRole("alert")).toContainText("User rejected the wallet request.");
});

test("a wallet that remains on the wrong network is rejected before signing", async ({ page }) => {
  await emptyJobs(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        request: async ({ method }: { method: string }) => {
          if (method === "eth_chainId") return "0x1";
          if (method === "wallet_switchEthereumChain") return null;
          throw new Error(`Unexpected method ${method}`);
        }
      }
    });
  });
  await page.goto("/app");
  await page.getByRole("button", { name: /browser wallet/i }).click();
  await expect(page.getByRole("alert")).toContainText("Wallet network switch was cancelled.");
});

for (const viewport of [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 }
]) {
  test(`landing has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  });
}
