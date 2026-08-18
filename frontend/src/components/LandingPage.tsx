import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  Layers3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WalletCards
} from "lucide-react";

const primaryCta = "/app";

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-landing text-ink">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <LandingHeader />

      <main id="conteudo">
        <Hero />
        <Benefits />
        <Workflow />
        <MarketplacePreview />
        <Freelancers />
        <TrustArchitecture />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-container flex min-h-[72px] items-center justify-between gap-4">
        <a className="landing-brand" href="/" aria-label="TrustWork — início">
          <span className="landing-brand-mark"><Layers3 aria-hidden="true" /></span>
          <span>TrustWork</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação da landing page">
          <a className="landing-nav-link" href="#beneficios">Benefícios</a>
          <a className="landing-nav-link" href="#como-funciona">Como funciona</a>
          <a className="landing-nav-link" href="#marketplace">Marketplace</a>
          <a className="landing-nav-link" href="#confianca">Confiança</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="early-badge"><span aria-hidden="true" />Early access</span>
          <a className="landing-button landing-button-dark landing-header-cta" href={primaryCta}>
            <span className="hidden sm:inline">Explorar marketplace</span>
            <span className="sm:hidden">Explorar</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative border-b border-ink/10">
      <div className="hero-orb hero-orb-blue" aria-hidden="true" />
      <div className="hero-orb hero-orb-coral" aria-hidden="true" />
      <div className="landing-container relative grid gap-14 pb-20 pt-16 sm:pb-24 sm:pt-24 lg:grid-cols-[minmax(0,1.02fr)_minmax(480px,.98fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-28">
        <div className="relative z-10">
          <p className="landing-kicker"><Sparkles aria-hidden="true" /> Contratação com confiança programável</p>
          <h1 className="landing-display mt-7 max-w-[760px]">
            Contrate talento. <span>Libere o pagamento</span> quando o trabalho estiver comprovado.
          </h1>
          <p className="mt-7 max-w-[620px] text-lg leading-8 text-landing-muted sm:text-xl sm:leading-9">
            Defina entregas, proteja o orçamento em escrow e aprove cada marco com clareza — sem depender de promessas vagas.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="landing-button landing-button-primary" href={primaryCta}>
              Explorar marketplace <ArrowRight aria-hidden="true" />
            </a>
            <a className="landing-button landing-button-light" href="#como-funciona">
              Entenda como funciona <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink/10 pt-6 text-sm font-semibold text-landing-muted">
            <span className="landing-check"><Check aria-hidden="true" /> Escrow por marcos</span>
            <span className="landing-check"><Check aria-hidden="true" /> Pagamento em USDC</span>
            <span className="landing-check"><Check aria-hidden="true" /> Histórico verificável</span>
          </div>
        </div>

        <ProductDemo />
      </div>
    </section>
  );
}

function ProductDemo() {
  return (
    <div className="product-demo animate-landing-in" aria-label="Demonstração ilustrativa de um contrato no TrustWork">
      <div className="product-demo-topbar">
        <div className="flex items-center gap-2"><i /><i /><i /></div>
        <span>Prévia do produto · exemplo ilustrativo</span>
      </div>
      <div className="grid gap-4 p-4 sm:p-6">
        <article className="demo-job-card">
          <div className="flex items-center justify-between gap-3">
            <span className="demo-label">Contrato #104</span>
            <span className="demo-status"><span /> Financiado</span>
          </div>
          <h2 className="mt-5 max-w-md text-2xl font-extrabold leading-tight sm:text-[28px]">Redesign do checkout para SaaS B2B</h2>
          <div className="mt-6 grid grid-cols-3 border-y border-white/15 py-4">
            <DemoStat label="Valor" value="1.800 USDC" />
            <DemoStat label="Marcos" value="03" />
            <DemoStat label="Rede" value="Base" />
          </div>
        </article>

        <div className="demo-milestone">
          <div className="flex items-start gap-3">
            <span className="milestone-check"><CheckCircle2 aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold">02. Protótipo navegável</p>
                <span className="demo-label">600 USDC</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-landing-muted">Evidência enviada · aguardando aprovação</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full w-2/3 rounded-full bg-chain" /></div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="demo-balance"><LockKeyhole aria-hidden="true" /><span><small>Protegido em escrow</small><strong>1.200 USDC</strong></span></div>
          <div className="demo-approve"><ShieldCheck aria-hidden="true" /><span><small>Próxima ação</small><strong>Revisar entrega</strong></span></div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden rotate-[-4deg] items-center gap-3 border border-ink bg-white px-4 py-3 shadow-elevated sm:flex">
        <BadgeCheck className="h-5 w-5 text-trust-deep" aria-hidden="true" />
        <span className="text-xs font-extrabold uppercase tracking-[.12em]">Marco registrado</span>
      </div>
    </div>
  );
}

function DemoStat({ label, value }: { label: string; value: string }) {
  return <div className="px-3 first:pl-0 last:pr-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{label}</p><p className="mt-1 text-sm font-extrabold sm:text-base">{value}</p></div>;
}

function Benefits() {
  const benefits = [
    { icon: FileCheck2, number: "01", title: "Escopo que vira acordo", text: "Transforme o projeto em marcos objetivos, com valor e entrega esperada antes do início." },
    { icon: LockKeyhole, number: "02", title: "Orçamento protegido", text: "O valor financiado fica bloqueado em escrow até que o trabalho de cada marco seja aprovado." },
    { icon: Fingerprint, number: "03", title: "Confiança com evidência", text: "A entrega pode permanecer privada, enquanto sua integridade é registrada para verificação." }
  ];

  return (
    <section className="landing-section" id="beneficios" aria-labelledby="beneficios-titulo">
      <div className="landing-container">
        <SectionIntro eyebrow="Menos incerteza, mais controle" title="Contratação profissional do acordo à aprovação." id="beneficios-titulo" />
        <div className="mt-12 grid border-l border-t border-ink/15 md:grid-cols-3">
          {benefits.map(({ icon: Icon, number, title, text }) => (
            <article className="benefit-card" key={number}>
              <div className="flex items-start justify-between"><span className="benefit-icon"><Icon aria-hidden="true" /></span><span className="editorial-number">{number}</span></div>
              <h3 className="mt-12 text-2xl font-extrabold">{title}</h3>
              <p className="mt-4 max-w-sm leading-7 text-landing-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { icon: BriefcaseBusiness, title: "Defina marcos", text: "Descreva o resultado esperado, o valor e a sequência das entregas." },
    { icon: WalletCards, title: "Financie o escrow", text: "Reserve USDC no contrato para deixar o pagamento comprometido." },
    { icon: CheckCircle2, title: "Aprove e libere", text: "Revise a evidência e libere o valor do marco concluído." }
  ];

  return (
    <section className="landing-section bg-ink text-white" id="como-funciona" aria-labelledby="fluxo-titulo">
      <div className="landing-container">
        <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="landing-kicker landing-kicker-dark">Um fluxo simples</p>
            <h2 className="landing-title mt-6 text-white" id="fluxo-titulo">Do briefing ao pagamento, em três movimentos.</h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/65">Você mantém a decisão. O contrato mantém o combinado.</p>
          </div>
          <ol className="workflow-list">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li className="workflow-step" key={title}>
                <span className="workflow-index">0{index + 1}</span>
                <span className="workflow-icon"><Icon aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
                {index < steps.length - 1 ? <ArrowDown className="workflow-arrow" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function MarketplacePreview() {
  return (
    <section className="landing-section" id="marketplace" aria-labelledby="marketplace-titulo">
      <div className="landing-container">
        <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:gap-20">
          <div>
            <p className="landing-kicker"><UserRoundCheck aria-hidden="true" /> Marketplace + reputação</p>
            <h2 className="landing-title mt-6" id="marketplace-titulo">Avalie a oportunidade e os sinais antes de decidir.</h2>
            <p className="mt-6 text-lg leading-8 text-landing-muted">Compare escopo, orçamento, compatibilidade e histórico verificável na mesma experiência.</p>
            <ul className="mt-8 space-y-4">
              <FeatureLine text="Oportunidades com contexto de contrato" />
              <FeatureLine text="Reputação baseada no histórico de execução" />
              <FeatureLine text="Pipeline de interesses e matches" />
            </ul>
            <a className="landing-text-link mt-9" href={primaryCta}>Conhecer o marketplace <ArrowRight aria-hidden="true" /></a>
          </div>

          <div className="market-preview" aria-label="Exemplo ilustrativo do marketplace TrustWork">
            <div className="market-preview-head"><span>Oportunidade em destaque</span><span>Exemplo ilustrativo</span></div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2"><span className="match-pill">94% compatível</span><span className="demo-label">Produto digital</span></div>
              <h3 className="mt-5 max-w-xl text-2xl font-extrabold sm:text-3xl">Design system para plataforma financeira</h3>
              <p className="mt-3 max-w-xl leading-7 text-landing-muted">Estruturação de componentes, documentação e protótipo para os fluxos prioritários.</p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PreviewStat label="Orçamento" value="USDC" />
                <PreviewStat label="Formato" value="3 marcos" />
                <PreviewStat label="Entrega" value="Privada" />
                <PreviewStat label="Rede" value="Base" />
              </div>
              <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-center gap-3"><span className="avatar-code">AM</span><span><strong className="block text-sm">Perfil profissional</strong><small className="text-landing-muted">Reputação verificável</small></span></div>
                <div className="flex gap-1" aria-label="Quatro de cinco sinais de reputação"><i className="signal-on" /><i className="signal-on" /><i className="signal-on" /><i className="signal-on" /><i /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="preview-stat"><small>{label}</small><strong>{value}</strong></div>;
}

function FeatureLine({ text }: { text: string }) {
  return <li className="flex items-center gap-3 font-bold"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-trust-soft text-trust-deep"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>{text}</li>;
}

function Freelancers() {
  return (
    <section className="border-y border-ink/10 bg-coral-soft">
      <div className="landing-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
          <span className="freelancer-mark"><CircleDollarSign aria-hidden="true" /></span>
          <div>
            <p className="landing-kicker landing-kicker-coral">Também para quem entrega</p>
            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">Trabalhe com pagamento comprometido desde o início.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-landing-muted">Freelancers encontram oportunidades, registram entregas e constroem um histórico profissional verificável.</p>
          </div>
        </div>
        <a className="landing-button landing-button-dark" href={primaryCta}>Ver oportunidades <ArrowRight aria-hidden="true" /></a>
      </div>
    </section>
  );
}

function TrustArchitecture() {
  const layers = [
    { icon: CircleDollarSign, tone: "blue", title: "USDC", text: "Valor estável para financiar e liberar cada marco." },
    { icon: Network, tone: "green", title: "Base", text: "Rede usada para registrar as ações essenciais do escrow." },
    { icon: LockKeyhole, tone: "coral", title: "Conteúdo privado", text: "Arquivos e detalhes sensíveis permanecem fora da blockchain." },
    { icon: Fingerprint, tone: "gold", title: "Integridade on-chain", text: "A impressão digital da evidência permite verificar sua integridade." }
  ];

  return (
    <section className="landing-section" id="confianca" aria-labelledby="confianca-titulo">
      <div className="landing-container">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="landing-kicker"><ShieldCheck aria-hidden="true" /> Arquitetura de confiança</p>
            <h2 className="landing-title mt-6" id="confianca-titulo">Transparente no que importa. Privado no que é seu.</h2>
            <p className="mt-6 text-lg leading-8 text-landing-muted">O TrustWork combina pagamentos programáveis e verificação de integridade sem publicar o conteúdo do trabalho.</p>
            <p className="mt-6 border-l-2 border-chain pl-4 text-sm leading-6 text-landing-muted">O produto está em early access. Recursos, redes suportadas e fluxos podem evoluir durante esta fase.</p>
          </div>
          <div className="trust-grid">
            {layers.map(({ icon: Icon, tone, title, text }) => (
              <article className="trust-layer" key={title}>
                <span className={`trust-layer-icon trust-layer-${tone}`}><Icon aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden bg-chain px-6 py-16 text-white sm:px-12 sm:py-20 lg:px-20">
        <div className="cta-grid" aria-hidden="true" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/70">TrustWork · Early access</p>
            <h2 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Seu próximo contrato pode começar com o combinado protegido.</h2>
          </div>
          <a className="landing-button bg-white text-chain hover:bg-landing" href={primaryCta}>Explorar marketplace <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-landing px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-8 border-t border-ink/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div><a className="landing-brand" href="/"><span className="landing-brand-mark"><Layers3 aria-hidden="true" /></span><span>TrustWork</span></a><p className="mt-4 max-w-md text-sm leading-6 text-landing-muted">Contratos por marcos, escrow em USDC e reputação verificável.</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold"><a className="landing-nav-link" href="#como-funciona">Como funciona</a><a className="landing-nav-link" href="#confianca">Confiança</a><a className="landing-nav-link" href={primaryCta}>Marketplace</a></div>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1360px] flex-col gap-2 border-t border-ink/10 pt-5 text-xs text-landing-muted sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} TrustWork.</p><p>Produto em early access · Português (Brasil)</p></div>
    </footer>
  );
}

function SectionIntro({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return <div className="grid gap-5 lg:grid-cols-[.4fr_1fr] lg:items-start"><p className="landing-kicker mt-2">{eyebrow}</p><h2 className="landing-title max-w-4xl" id={id}>{title}</h2></div>;
}
