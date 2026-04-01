/**
 * Thought Leaders Framework
 * Classifies each stock through two philosophical lenses:
 *
 * Mo Gawdat (Scary Smart, Unstressable, Dragonfly Summit 2025)
 *   — Be a machine landlord, not a labor participant
 *   — Own what AI cannot displace: physical world, inelastic human needs, love
 *   — Hell before heaven: 12–15 year disruption window; avoid white-collar labor intermediaries
 *
 * Dario Amodei (Machines of Loving Grace, The Adolescence of Technology, Jan 2026)
 *   — Own the feedback loop: AI building AI, runs on compute + power + safety infra
 *   — Safety as engineering: interpretability, governance, Constitutional AI are funded infrastructure
 *   — Civilizational layer: sovereign AI compute, defense, biological resilience are government-mandated
 *
 * Verdicts: strong-hold | hold | watch | reduce | exit
 * Overlap:  both | mo-only | dario-only | diverge
 */

const TL = {

  // ── AI INFRASTRUCTURE — both thinkers converge here most strongly ───────────

  NVDA: {
    mo:    { verdict: 'strong-hold', lens: 'Machine landlord #1',      rationale: 'The engine of the machine landlord economy. Pure compute infrastructure — owns the hardware every AI system runs on.' },
    dario: { verdict: 'strong-hold', lens: 'Feedback loop engine',     rationale: 'The feedback loop already running at Anthropic runs on NVIDIA. By 2027 millions of AI instances all require Blackwell-class compute.' },
    overlap: 'both',
  },

  ARM: {
    mo:    { verdict: 'strong-hold', lens: 'Royalty on intelligence',  rationale: 'Every AI inference chip — phone, server, car, edge — pays ARM a royalty. Deepest infrastructure position possible.' },
    dario: { verdict: 'strong-hold', lens: 'Architecture tax on AI',   rationale: 'Every device running Dario\'s "millions of AI instances" uses ARM architecture. It is the closest thing to owning a tax on the feedback loop.' },
    overlap: 'both',
  },

  AVGO: {
    mo:    { verdict: 'strong-hold', lens: 'Machine landlord — silicon', rationale: 'Custom ASICs for Google, Meta, Apple. The machine landlords of the internet are paying AVGO to build their specific machines.' },
    dario: { verdict: 'strong-hold', lens: 'Custom AI silicon',         rationale: 'Sovereign AI compute diversification away from NVDA monopoly. Every hyperscaler building bespoke training chips does it through AVGO.' },
    overlap: 'both',
  },

  AMZN: {
    mo:    { verdict: 'strong-hold', lens: 'Cloud infrastructure owner', rationale: 'AWS is the machine landlord\'s landlord — provides the infrastructure layer for the entire AI economy. E-commerce is physical world inelastic.' },
    dario: { verdict: 'strong-hold', lens: 'Feedback loop cloud',        rationale: 'AWS runs Claude API. AWS Trainium and Inferentia are active investments in the feedback loop. OCI-class GPU clusters now competitive.' },
    overlap: 'both',
  },

  GOOGL: {
    mo:    { verdict: 'strong-hold', lens: 'Cloud + AI landlord',       rationale: 'Cheapest Mag 7 at 17x fwd PE. GCP, TPUs, Gemini. Owns search infrastructure that survived every disruption thesis so far.' },
    dario: { verdict: 'strong-hold', lens: 'Feedback loop + safety',    rationale: 'DeepMind is one of the few labs doing serious safety and capability research simultaneously. GCP is active feedback loop infrastructure.' },
    overlap: 'both',
  },

  GOOG: {
    mo:    { verdict: 'strong-hold', lens: 'Same as GOOGL',             rationale: 'Identical Alphabet exposure. Consider consolidating into GOOGL for voting rights.' },
    dario: { verdict: 'strong-hold', lens: 'Same as GOOGL',             rationale: 'Identical Alphabet exposure. No operational difference — pure share class distinction.' },
    overlap: 'both',
  },

  // ── PHYSICAL INFRASTRUCTURE ─────────────────────────────────────────────────

  EOG: {
    mo:    { verdict: 'strong-hold', lens: 'Physical world inelastic',  rationale: 'Natural gas and oil are physical world assets AI cannot digitize. Low-cost Permian producer with strong FCF and disciplined capital allocation.' },
    dario: { verdict: 'strong-hold', lens: 'Energy for AI buildout',    rationale: 'Data centers need natural gas. Dario\'s "country of geniuses in a datacenter" runs on EOG\'s Dorado natural gas. Civilizational energy.' },
    overlap: 'both',
  },

  CAT: {
    mo:    { verdict: 'strong-hold', lens: 'Physical world moat',       rationale: 'Heavy machinery is maximally resistant to AI displacement. Mo\'s "love is irreplaceable" applied to physical infrastructure.' },
    dario: { verdict: 'strong-hold', lens: 'Infrastructure buildout',   rationale: 'Data center construction, power plant builds, and grid expansion all require Caterpillar equipment. Civilizational infrastructure spend.' },
    overlap: 'both',
  },

  FDX: {
    mo:    { verdict: 'hold',        lens: 'Physical logistics moat',   rationale: 'Physical delivery cannot be digitized. Mo: the physical world is the inelastic residual of every AI disruption.' },
    dario: { verdict: 'hold',        lens: 'Physical world infra',      rationale: 'E-commerce logistics is civilizational infrastructure. Not in the feedback loop but not threatened by it either.' },
    overlap: 'both',
  },

  TXN: {
    mo:    { verdict: 'hold',        lens: 'Physical world chips',      rationale: 'Embedded and industrial semiconductors are physical world infrastructure. Cannot be competed away by pure software AI.' },
    dario: { verdict: 'hold',        lens: 'Edge AI silicon',           rationale: 'AI moves to the edge — every IoT and industrial device gets smarter. TXN is positioned in the physical layer of that transition.' },
    overlap: 'both',
  },

  // ── HEALTHCARE — inelastic by definition ────────────────────────────────────

  MOH: {
    mo:    { verdict: 'strong-hold', lens: 'Counter-cyclical moat',     rationale: 'Mo\'s dystopia creates more Medicaid-eligible people. MOH\'s market literally grows during the "hell before heaven" disruption phase.' },
    dario: { verdict: 'strong-hold', lens: 'Biological resilience',     rationale: 'Healthcare is civilizational infrastructure. Dario identifies biological resilience as a top-priority funded category.' },
    overlap: 'both',
  },

  MRK: {
    mo:    { verdict: 'hold',        lens: 'Inelastic human need',      rationale: 'Pharmaceuticals are maximally inelastic. People take their medication regardless of white-collar displacement.' },
    dario: { verdict: 'hold',        lens: 'Biology acceleration',      rationale: 'Dario\'s Machines of Loving Grace thesis: AI compresses decades of biomedical progress. Pharma is a beneficiary, not a victim.' },
    overlap: 'both',
  },

  AZN: {
    mo:    { verdict: 'hold',        lens: 'Inelastic human need',      rationale: 'Global pharma with strong oncology and AI drug discovery pipeline. Inelastic demand regardless of economic cycle.' },
    dario: { verdict: 'hold',        lens: 'Biology acceleration',      rationale: 'AstraZeneca is actively deploying AI in drug discovery — aligned with Dario\'s biomedical acceleration thesis.' },
    overlap: 'both',
  },

  IDXX: {
    mo:    { verdict: 'hold',        lens: 'Inelastic human moat',      rationale: 'Veterinary diagnostics — inelastic, recurring, relationship-anchored. AI enhances diagnostic capability, doesn\'t replace it.' },
    dario: { verdict: 'hold',        lens: 'Neutral',                   rationale: 'Not directly in the AI feedback loop or civilizational risk stack. Neutral — not threatened, not accelerated.' },
    overlap: 'mo-only',
  },

  IBB: {
    mo:    { verdict: 'hold',        lens: 'Biology inelastic',         rationale: 'Diversified biotech basket. Healthcare demand is inelastic. ETF form reduces single-drug binary risk.' },
    dario: { verdict: 'hold',        lens: 'Biology acceleration',      rationale: 'AI compresses biomedical timelines. The IBB basket benefits from faster drug discovery and approval cycles.' },
    overlap: 'both',
  },

  // ── INSURANCE / FINANCIALS ───────────────────────────────────────────────────

  PGR: {
    mo:    { verdict: 'strong-hold', lens: 'Inelastic human moat',      rationale: 'Insurance is required by law. Telematics data moat means AI improves Progressive\'s pricing edge rather than threatening it.' },
    dario: { verdict: 'hold',        lens: 'Neutral — not flagged',     rationale: 'Not in the AI feedback loop or civilizational risk stack. Neutral — not threatened by Dario\'s five risks.' },
    overlap: 'mo-only',
  },

  V: {
    mo:    { verdict: 'hold',        lens: 'Network infrastructure',    rationale: 'Payment rails have a switching cost measured in decades. AI autonomous purchasing enhances card volume rather than displacing the network.' },
    dario: { verdict: 'hold',        lens: 'Neutral',                   rationale: 'Not directly relevant to Dario\'s framework. Payment infrastructure is a utility — not threatened, not accelerated.' },
    overlap: 'mo-only',
  },

  JPM: {
    mo:    { verdict: 'hold',        lens: 'Financial infrastructure',  rationale: 'Too large to displace — financial infrastructure with government backstop. Mo: systemic importance is its own moat.' },
    dario: { verdict: 'hold',        lens: 'Power concentration risk',  rationale: 'Large banks benefit from AI productivity but also concentrate power. Dario\'s power concentration risk applies — hold with awareness.' },
    overlap: 'both',
  },

  GS: {
    mo:    { verdict: 'watch',       lens: 'White-collar adjacent',     rationale: 'Investment banking and research are high-displacement white-collar work. Mo\'s "hell before heaven" hits financial services hard in the transition window.' },
    dario: { verdict: 'watch',       lens: 'Economic disruption victim', rationale: 'IB advisory and research are exactly the white-collar knowledge work Dario says gets disrupted first. Not catastrophic but under structural pressure.' },
    overlap: 'both',
  },

  BAC: {
    mo:    { verdict: 'hold',        lens: 'Financial infrastructure',  rationale: 'Retail banking infrastructure — inelastic. Less exposed than GS to high-displacement knowledge work.' },
    dario: { verdict: 'hold',        lens: 'Neutral',                   rationale: 'Retail banking is not leading the AI disruption nor being led by it. Steady infrastructure hold.' },
    overlap: 'mo-only',
  },

  AXP: {
    mo:    { verdict: 'watch',       lens: 'Premium moat eroding',      rationale: 'Amex\'s premium is built on affluent white-collar T&E spending — exactly the demographic Mo\'s disruption hits hardest.' },
    dario: { verdict: 'watch',       lens: 'Economic disruption exposed', rationale: 'Corporate T&E is a leading indicator of white-collar employment. As Dario\'s economic disruption materializes, AXP charge-offs rise.' },
    overlap: 'both',
  },

  // ── ENTERPRISE SOFTWARE ──────────────────────────────────────────────────────

  ORCL: {
    mo:    { verdict: 'hold',        lens: 'Enterprise data layer',     rationale: 'Database backbone of Fortune 500 with switching cost measured in years. OCI GPU cloud is genuine AI infrastructure.' },
    dario: { verdict: 'hold',        lens: 'OCI infrastructure',        rationale: 'Oracle Cloud Infrastructure is actively building GPU cluster capacity for AI training and inference. Real infrastructure pivot, not marketing.' },
    overlap: 'both',
  },

  ZS: {
    mo:    { verdict: 'strong-hold', lens: 'Security infrastructure',   rationale: 'Cybersecurity spend is non-discretionary. Every AI agent proliferating in enterprise is a new attack surface Zscaler protects.' },
    dario: { verdict: 'strong-hold', lens: 'Cyber misuse defense',      rationale: 'Dario\'s risk #2: cyber operations as primary AI misuse vector. Zscaler is in the mandatory defensive spend stack.' },
    overlap: 'both',
  },

  CRM: {
    mo:    { verdict: 'watch',       lens: 'Seat model under pressure', rationale: 'Front-office displacement is real. Mo: sales reps are among the first white-collar roles the machine replaces.' },
    dario: { verdict: 'watch',       lens: 'Agentforce offsetting',     rationale: 'Agentforce is beating targets but MSFT Agent365 competition is fierce. Seat model risk acknowledged; pivot is real but incomplete.' },
    overlap: 'both',
  },

  DDOG: {
    mo:    { verdict: 'hold',        lens: 'Infra observability',       rationale: 'Observability becomes more critical as AI agents proliferate — more systems to monitor, not fewer. Relevant to Sri\'s Databricks work.' },
    dario: { verdict: 'hold',        lens: 'AI monitoring essential',   rationale: 'Every AI pipeline needs observability. Datadog\'s LLM observability product is directly aligned with Dario\'s agentic AI buildout.' },
    overlap: 'both',
  },

  TEAM: {
    mo:    { verdict: 'watch',       lens: 'Collaboration at risk',     rationale: 'Jira and Confluence are seat-based workflow tools. Agentic AI manages tasks and writes documentation autonomously.' },
    dario: { verdict: 'watch',       lens: 'Agentic AI disruption',     rationale: 'The feedback loop Dario describes — AI writing code at Anthropic — directly competes with Atlassian\'s core use case.' },
    overlap: 'both',
  },

  SNOW: {
    mo:    { verdict: 'watch',       lens: 'Data layer risk',           rationale: 'Not a machine landlord. Hyperscalers building native data layers threaten Snowflake\'s positioning as neutral data infrastructure.' },
    dario: { verdict: 'watch',       lens: 'Displaced by cloud-native', rationale: 'AWS, GCP, Azure all building native data warehousing. Not in Dario\'s feedback loop. Consolidation risk from hyperscalers is real.' },
    overlap: 'both',
  },

  IBM: {
    mo:    { verdict: 'reduce',      lens: 'Legacy labor intermediary', rationale: 'IBM sells consulting hours and legacy enterprise software. Exactly Mo\'s "displaced white-collar labor intermediary." Not a machine landlord.' },
    dario: { verdict: 'reduce',      lens: 'Not in feedback loop',      rationale: 'IBM is not building the next generation of AI systems. Watsonx is playing catch-up. Not in the civilizational infrastructure stack.' },
    overlap: 'both',
  },

  // ── MEGA-CAP TECH ────────────────────────────────────────────────────────────

  META: {
    mo:    { verdict: 'hold',        lens: 'Social graph moat',         rationale: '3.2B users is irreplaceable social infrastructure. Mo: human connection is the last moat — META owns the platform for it.' },
    dario: { verdict: 'hold',        lens: 'Feedback loop participant', rationale: 'Massive AI investment, Llama open source, Reality Labs. Active in the feedback loop as both builder and user of frontier AI.' },
    overlap: 'both',
  },

  MSFT: {
    mo:    { verdict: 'watch',       lens: 'Seat model under pressure', rationale: 'Azure is strong infrastructure but Copilot seat repricing is slower than promised. Mo: the seat-model is the vulnerability.' },
    dario: { verdict: 'watch',       lens: 'Feedback loop + Copilot risk', rationale: 'Agent365 in 80% of Fortune 500 is Dario-aligned but execution on AI monetization has been slower than the market priced in.' },
    overlap: 'both',
  },

  AAPL: {
    mo:    { verdict: 'watch',       lens: 'Hardware moat fading',      rationale: 'Hardware moat is still large but AI integration is slow. Mo: Apple Intelligence is reactive, not leading the machine landlord economy.' },
    dario: { verdict: 'watch',       lens: 'Not leading AI',            rationale: 'Not in Dario\'s feedback loop. Revenue growing only 9%. Not building the next generation of AI systems — deploying someone else\'s.' },
    overlap: 'both',
  },

  TSLA: {
    mo:    { verdict: 'watch',       lens: 'EV brand damage',           rationale: 'EV tax credit ending, margins compressed, Musk brand damage. Mo: not a machine landlord in the AI infrastructure sense.' },
    dario: { verdict: 'watch',       lens: 'Physical AI + robotics',    rationale: 'FSD and Optimus are Dario-aligned (physical AI) but timelines are perpetually uncertain. Feedback loop contribution unclear.' },
    overlap: 'both',
  },

  INTC: {
    mo:    { verdict: 'reduce',      lens: 'Lost machine landlord race', rationale: 'Intel lost the AI chip race to NVDA, AVGO, AMD. Not a machine landlord in the AI economy. Execution risk is existential.' },
    dario: { verdict: 'reduce',      lens: 'Behind in AI silicon',      rationale: 'Not in Dario\'s feedback loop. The AI training and inference infrastructure Dario describes runs on NVDA, not Intel.' },
    overlap: 'both',
  },

  // ── CONSUMER / RETAIL ────────────────────────────────────────────────────────

  SBUX: {
    mo:    { verdict: 'hold',        lens: 'Human connection ritual',   rationale: 'Coffee is a ritual of human connection — maximally resistant to AI displacement. Physical experience and community moat.' },
    dario: { verdict: 'hold',        lens: 'Neutral',                   rationale: 'Not in the AI feedback loop or civilizational risk stack. Consumer staple behavior is inelastic.' },
    overlap: 'mo-only',
  },

  WBD: {
    mo:    { verdict: 'exit',        lens: 'Displaced content platform', rationale: 'Heavily indebted, no AI strategy, linear TV declining, streaming wars intensifying. Not inelastic, not a moat.' },
    dario: { verdict: 'exit',        lens: 'AI content disruption',     rationale: 'AI-generated content accelerates the cost pressure on traditional content production. No role in Dario\'s civilizational infrastructure.' },
    overlap: 'both',
  },

  NFLX: {
    mo:    { verdict: 'watch',       lens: 'Content disruption risk',   rationale: 'AI-generated content is coming for Netflix\'s production costs. Mo: entertainment is not inelastic and the content moat is shrinking.' },
    dario: { verdict: 'watch',       lens: 'Creative AI target',        rationale: 'Dario\'s feedback loop produces creative AI faster than Netflix can adapt its content production model.' },
    overlap: 'both',
  },

  DIS: {
    mo:    { verdict: 'watch',       lens: 'IP moat vs AI content',     rationale: 'IP library is real but AI content creation threatens the production cost model that monetizes it. Mixed signal.' },
    dario: { verdict: 'watch',       lens: 'Creative disruption target', rationale: 'Same as NFLX — AI-generated content accelerates production cost deflation. Disney\'s streaming losses are structural not cyclical.' },
    overlap: 'both',
  },

  ABNB: {
    mo:    { verdict: 'watch',       lens: 'Booking intermediary risk', rationale: 'AI travel agents disintermediate booking platforms. Mo: the platform layer between humans is exactly what gets compressed.' },
    dario: { verdict: 'watch',       lens: 'Travel platform risk',      rationale: 'Agentic AI trip planners (Dario\'s autonomous agents) bypass booking intermediaries. The platform take rate is the leading indicator.' },
    overlap: 'both',
  },

  CPB: {
    mo:    { verdict: 'hold',        lens: 'Inelastic consumer staple', rationale: 'Food is maximally inelastic. Soup is recession-proof and AI-displacement-proof. Solid defensive hold during Mo\'s "hell" phase.' },
    dario: { verdict: 'hold',        lens: 'Neutral',                   rationale: 'Not in the AI feedback loop or civilizational stack. Consumer staple — steady hold, no specific AI thesis either way.' },
    overlap: 'mo-only',
  },

  // ── DEFENSE / INDUSTRIALS ───────────────────────────────────────────────────

  BA: {
    mo:    { verdict: 'watch',       lens: 'Defense + execution risk',  rationale: 'Defense is structurally funded but Boeing\'s execution issues (737 MAX, quality failures) are company-specific risk layered on top.' },
    dario: { verdict: 'watch',       lens: 'Defense + execution risk',  rationale: 'Dario\'s power concentration risk mandates defense spending — but Boeing\'s production failures make it the wrong vehicle.' },
    overlap: 'both',
  },

  // ── TELECOM ─────────────────────────────────────────────────────────────────

  CSCO: {
    mo:    { verdict: 'hold',        lens: 'Network infrastructure',    rationale: 'Network infrastructure is inelastic — AI data centers need high-speed networking. Mo: physical network is durable.' },
    dario: { verdict: 'hold',        lens: 'AI networking tailwind',    rationale: 'AI data center networking is a genuine Cisco tailwind. But hardware commoditization remains a long-term structural pressure.' },
    overlap: 'both',
  },

  T: {
    mo:    { verdict: 'reduce',      lens: 'Commodity utility',         rationale: 'Telecom is not in the AI value chain. Heavily indebted with no structural moat. Mo: not a machine landlord, not inelastic human need.' },
    dario: { verdict: 'reduce',      lens: 'Not relevant to AI thesis', rationale: 'Not infrastructure for the AI feedback loop. Not in the civilizational risk stack. Capital better deployed elsewhere.' },
    overlap: 'both',
  },
}

// ─── Verdict config for UI rendering ──────────────────────────────────────────
export const TL_VERDICTS = {
  'strong-hold': { label: 'Strong Hold', color: '#1D9E75', bg: 'rgba(29,158,117,0.1)',  border: 'rgba(29,158,117,0.25)' },
  'hold':        { label: 'Hold',        color: '#378ADD', bg: 'rgba(55,138,221,0.1)',  border: 'rgba(55,138,221,0.25)' },
  'watch':       { label: 'Watch',       color: '#BA7517', bg: 'rgba(186,117,23,0.1)',  border: 'rgba(186,117,23,0.25)' },
  'reduce':      { label: 'Reduce',      color: '#E07B39', bg: 'rgba(224,123,57,0.1)',  border: 'rgba(224,123,57,0.25)' },
  'exit':        { label: 'Exit',        color: '#E24B4A', bg: 'rgba(226,75,74,0.1)',   border: 'rgba(226,75,74,0.25)' },
}

// ─── Overlap config for UI rendering ──────────────────────────────────────────
export const TL_OVERLAPS = {
  'both':      { label: 'Both agree',  color: '#7F77DD', bg: 'rgba(127,119,221,0.12)', border: 'rgba(127,119,221,0.3)' },
  'mo-only':   { label: 'Mo only',     color: '#1D9E75', bg: 'rgba(29,158,117,0.1)',   border: 'rgba(29,158,117,0.25)' },
  'dario-only':{ label: 'Dario only',  color: '#378ADD', bg: 'rgba(55,138,221,0.1)',   border: 'rgba(55,138,221,0.25)' },
  'diverge':   { label: 'Diverge',     color: '#BA7517', bg: 'rgba(186,117,23,0.1)',   border: 'rgba(186,117,23,0.25)' },
}

// ─── Public accessors ──────────────────────────────────────────────────────────

/** Get full thought leader data for a ticker. Returns null if not classified. */
export function getTL(ticker) {
  return TL[ticker] || null
}

/** Get Mo's verdict config for a ticker. */
export function getMoVerdict(ticker) {
  const d = TL[ticker]
  if (!d) return null
  return { ...d.mo, ...TL_VERDICTS[d.mo.verdict] }
}

/** Get Dario's verdict config for a ticker. */
export function getDarioVerdict(ticker) {
  const d = TL[ticker]
  if (!d) return null
  return { ...d.dario, ...TL_VERDICTS[d.dario.verdict] }
}

/** Get overlap config for a ticker. */
export function getTLOverlap(ticker) {
  const d = TL[ticker]
  if (!d) return null
  return { overlap: d.overlap, ...TL_OVERLAPS[d.overlap] }
}

/** Filter tickers where Mo endorses (strong-hold or hold) */
export function getMoEndorsed() {
  return Object.entries(TL)
    .filter(([, d]) => d.mo.verdict === 'strong-hold' || d.mo.verdict === 'hold')
    .map(([ticker]) => ticker)
}

/** Filter tickers where Dario endorses (strong-hold or hold) */
export function getDarioEndorsed() {
  return Object.entries(TL)
    .filter(([, d]) => d.dario.verdict === 'strong-hold' || d.dario.verdict === 'hold')
    .map(([ticker]) => ticker)
}

/** Filter tickers where both agree on strong-hold or hold */
export function getBothEndorsed() {
  return Object.entries(TL)
    .filter(([, d]) => d.overlap === 'both' &&
      (d.mo.verdict === 'strong-hold' || d.mo.verdict === 'hold') &&
      (d.dario.verdict === 'strong-hold' || d.dario.verdict === 'hold'))
    .map(([ticker]) => ticker)
}

export default TL
