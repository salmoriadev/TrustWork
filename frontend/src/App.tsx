import { lazy, Suspense, useEffect } from "react";

import { LandingPage } from "./components/LandingPage";
import { resolveAppRoute, type AppRoute } from "./lib/appRoute";

const ProductApp = lazy(() => import("./ProductApp"));

const routeMetadata: Record<AppRoute, { title: string; description: string }> = {
  landing: {
    title: "TrustWork · Trabalho aprovado, pagamento liberado",
    description: "Contrate talentos com marcos claros, escrow em USDC e evidências verificáveis. Conheça o TrustWork em early access."
  },
  product: {
    title: "Marketplace · TrustWork",
    description: "Marketplace TrustWork com escrow em USDC, entregas protegidas e reputação verificável."
  }
};

export default function App() {
  const route = resolveAppRoute(window.location.pathname);

  useEffect(() => {
    const metadata = routeMetadata[route];
    document.title = metadata.title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", metadata.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", metadata.title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", metadata.description);
  }, [route]);

  return route === "product" ? (
    <Suspense fallback={<ProductLoading />}>
      <ProductApp />
    </Suspense>
  ) : <LandingPage />;
}

function ProductLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-app px-5 text-ink" aria-busy="true">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-line border-t-chain" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold">Carregando marketplace…</p>
      </div>
    </main>
  );
}
