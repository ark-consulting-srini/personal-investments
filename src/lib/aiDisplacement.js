/**
 * AI Displacement Risk Framework
 * Based on the 2028 Global Intelligence Crisis scenario (Citrini Research, Feb 2026)
 *
 * 5 dimensions scored 1–5:
 *   intermediation  — dependence on friction/asymmetry AI agents eliminate
 *   arrSeat         — per-seat SaaS ARR tied to declining white-collar headcount
 *   customerBase    — % revenue from enterprises/professionals being displaced
 *   infrastructure  — 1=direct AI beneficiary, 5=direct AI competitor
 *   policySystemic  — mortgage stress, private credit, regulatory backlash
 *
 * Composite = weighted avg (25/20/25/20/10)
 * Tiers: 1.0–1.9 RESILIENT | 2.0–2.9 LOW | 3.0–3.4 MEDIUM | 3.5–4.2 HIGH | 4.3–5.0 CRITICAL
 */

export const DISPLACEMENT_TIERS = {
  RESILIENT: { label: 'Resilient', color: '#1D9E75', bg: 'rgba(29,158,117,0.1)',  border: 'rgba(29,158,117,0.25)', range: [1.0, 1.9] },
  LOW:       { label: 'Low risk',  color: '#378ADD', bg: 'rgba(55,138,221,0.1)',  border: 'rgba(55,138,221,0.25)', range: [2.0, 2.9] },
  MEDIUM:    { label: 'Medium',    color: '#BA7517', bg: 'rgba(186,117,23,0.1)', border: 'rgba(186,117,23,0.25)', range: [3.0, 3.4] },
  HIGH:      { label: 'High risk', color: '#E07B39', bg: 'rgba(224,123,57,0.1)', border: 'rgba(224,123,57,0.25)', range: [3.5, 4.2] },
  CRITICAL:  { label: 'Critical',  color: '#E24B4A', bg: 'rgba(226,75,74,0.1)',  border: 'rgba(226,75,74,0.25)', range: [4.3, 5.0] },
}

function score(intermediation, arrSeat, customerBase, infrastructure, policySystemic) {
  return parseFloat(
    (intermediation * 0.25 + arrSeat * 0.20 + customerBase * 0.25 + infrastructure * 0.20 + policySystemic * 0.10).toFixed(2)
  )
}

function tier(composite) {
  if (composite <= 1.9) return 'RESILIENT'
  if (composite <= 2.9) return 'LOW'
  if (composite <= 3.4) return 'MEDIUM'
  if (composite <= 4.2) return 'HIGH'
  return 'CRITICAL'
}

function make(ticker, name, sector, dims, reasoning, monitoring, verdict) {
  const [i, a, c, inf, p] = dims
  const composite = score(i, a, c, inf, p)
  return {
    ticker, name, sector,
    dims: { intermediation: i, arrSeat: a, customerBase: c, infrastructure: inf, policySystemic: p },
    composite,
    tier: tier(composite),
    reasoning,   // object: { intermediation, arrSeat, customerBase, infrastructure, policySystemic }
    monitoring,  // string[] — 3–5 trigger events
    verdict,     // string — 2–3 sentence honest assessment
  }
}

// ─── The 44-stock watchlist ───────────────────────────────────────────────────

export const DISPLACEMENT_STOCKS = [

  // ── CRITICAL RISK ──────────────────────────────────────────────────────────
  make('ABNB', 'Airbnb', 'Travel',
    [5, 2, 4, 5, 3],
    {
      intermediation: 'Pure intermediation play — connects guests to hosts. Agentic AI trip planners can surface and book inventory directly, bypassing the platform entirely.',
      arrSeat:        'Marketplace model, not ARR/seat. Lower direct exposure here.',
      customerBase:   'White-collar leisure and business travel. Enterprise travel declining as AI reduces the meetings that generate travel.',
      infrastructure: 'Direct competitor — AI agents disintermediate the core booking flow. No infrastructure position.',
      policySystemic: 'Regulatory risk from municipal short-term rental bans amplifying if tax bases erode.',
    },
    [
      'Agentic booking tools (Perplexity Travel, Google AI Mode) showing material booking share',
      'Business travel RevPAR declining YoY for 2+ quarters',
      'Take rate compression below 12% signaling pricing power erosion',
      'New city-level STR bans in top-10 markets',
      'Enterprise corporate travel policy restricting ABNB usage',
    ],
    'The displacement thesis is clean: ABNB is a human-friction monetizer. When AI agents handle trip planning end-to-end, the platform becomes a commodity inventory layer. Watch take rate as the leading indicator. Near-term travel demand masks the structural shift.',
  ),

  make('AXP', 'American Express', 'Financials',
    [4, 1, 5, 4, 4],
    {
      intermediation: 'Premium card network monetizes relationship between affluent consumers and merchants. AI agents doing autonomous purchasing erode the premium positioning.',
      arrSeat:        'Not an ARR/seat model. Card spend is transactional.',
      customerBase:   'Heavily weighted to affluent white-collar professionals and corporate T&E. This is the highest-displacement demographic.',
      infrastructure: 'Payment rails are infrastructure but Amex specifically targets the spenders being displaced. Not a commodity network — the premium is the vulnerability.',
      policySystemic: 'Private credit exposure through corporate card receivables. White-collar layoffs create charge-off spikes with fast velocity.',
    },
    [
      'Corporate T&E spend declining more than 3 months consecutive',
      'Billed business growth falling below 5% — structural not cyclical',
      'Centurion/Platinum card attrition rising (track in earnings)',
      'AI-native expense management bypassing card networks',
      'Charge-off rates rising above 2.5% in corporate segment',
    ],
    'AXP is the most exposed payments stock in the watchlist. The premium brand is built on affluent white-collar spending — the exact demographic the displacement scenario targets. Unlike Visa/Mastercard which are commodity infrastructure, AXP\'s moat IS the customer. That\'s also its vulnerability.',
  ),

  make('CRM', 'Salesforce', 'Enterprise Software',
    [4, 5, 5, 4, 2],
    {
      intermediation: 'CRM intermediates between sales reps and customers. Agentic AI sales assistants can replace the human layer the software was built to support.',
      arrSeat:        'Pure seat-based ARR. Every sales headcount reduction is a direct license reduction. This is the canonical seat-dependency risk.',
      customerBase:   '100% enterprise white-collar. Sales, service, marketing — all high-displacement roles.',
      infrastructure: 'Building Agentforce to pivot to AI infrastructure, but current revenue is still seat-dependent. The pivot is acknowledged, not yet monetized.',
      policySystemic: 'Low direct policy risk. Some exposure to enterprise spending freezes if private credit tightens.',
    },
    [
      'Net Revenue Retention falling below 115% — early seat contraction signal',
      'Agentforce ACV becoming >15% of new bookings — pivot succeeding',
      'Seat count in quarterly filings: any YoY decline is structural',
      'Enterprise customer count growth vs seat count divergence widening',
      'Competitors (ServiceNow, HubSpot) showing seat compression first',
    ],
    'CRM is the textbook case. The entire business model — seat licensing to support human sales reps — is what gets disrupted first. Management sees it clearly (Agentforce) but the transition requires new contracts, new pricing, and customers willing to pay for agents instead of seats. That realization process takes 2–3 years and destroys NRR in the interim.',
  ),

  make('DDOG', 'Datadog', 'Enterprise Software',
    [3, 4, 4, 2, 2],
    {
      intermediation: 'Observability SaaS. Doesn\'t intermediary human friction — monitors infrastructure. Lower intermediation risk than pure workflow tools.',
      arrSeat:        'High-multiple consumption SaaS. As cloud workloads consolidate onto fewer, more efficient AI-native stacks, total monitored compute could decline.',
      customerBase:   'DevOps/engineering teams — more resilient than sales/marketing but still white-collar tech workers facing AI coding tools.',
      infrastructure: 'Every AI application needs observability. LLM Observability product launched 2024 — partial beneficiary. Not a pure infrastructure play but has a foot in it.',
      policySystemic: 'Low. Pure software, no credit/mortgage exposure.',
    },
    [
      'ARR growth decelerating below 20% — consumption consolidation signal',
      'Net Revenue Retention falling below 120%',
      'Azure/AWS native monitoring winning workloads back from DDOG',
      'LLM Observability becoming >10% of ARR — infrastructure pivot working',
      'Customer logo count growth vs ARR growth divergence (churning small, growing large)',
    ],
    'DDOG is a nuanced case — genuinely has a foot in both camps. The risk is workload consolidation: fewer, more efficient AI-native architectures mean less total infrastructure to monitor. The opportunity is every AI app needs observability. The current valuation (>10x revenue) prices in the opportunity; the risk is underpriced.',
  ),

  make('SNOW', 'Snowflake', 'Enterprise Software',
    [3, 4, 4, 3, 2],
    {
      intermediation: 'Data warehouse doesn\'t directly intermediary human workflows. But the analytics use case (human analysts querying data) is partially displaced.',
      arrSeat:        'Consumption model, not pure seat. But consumption is driven by human-initiated queries. AI-native analytics could compress consumption if queries move to automated pipelines.',
      customerBase:   'Data teams, analytics teams — white-collar but more technical/durable than sales/marketing.',
      infrastructure: 'Positioned as AI Data Cloud — partial infrastructure play. But Databricks and cloud-native competitors are closer to the AI training/inference stack.',
      policySystemic: 'Low direct exposure. Enterprise budget compression risk.',
    },
    [
      'Net Revenue Retention falling below 125% — consumption softening',
      'Databricks/BigQuery taking workload share in earnings commentary',
      'AI Data Cloud revenue becoming >20% of total — pivot succeeding',
      'Large customer cohort consumption growth vs new customer growth divergence',
      'Gross margins compressing below 65% — pricing pressure signal',
    ],
    'SNOW\'s risk is more competitive than displacement. The scenario threat is that Databricks (closer to the AI stack) wins the AI-native workloads, while existing SNOW consumption consolidates. The consumption model is less immediately exposed than seat SaaS but the multiple (still premium) doesn\'t price in the competitive reality.',
  ),

  make('WBD', 'Warner Bros Discovery', 'Media',
    [4, 1, 4, 5, 4],
    {
      intermediation: 'Content distributor and network. AI content generation threatens both the creation cost base and the distribution moat.',
      arrSeat:        'Streaming subscription model. Not seat-based but churn accelerates as alternatives multiply.',
      customerBase:   'Consumer entertainment — not white-collar per se, but discretionary spend compressed when white-collar unemployment rises.',
      infrastructure: 'Pure competitor to AI content. No infrastructure position. Debt structure leaves no room to pivot.',
      policySystemic: 'Very high. $45B+ debt. Rising rates compound debt service. Any ad market softening is existential. No AI upside story.',
    },
    [
      'Max subscriber growth stalling below 5M annual net adds',
      'Direct-to-consumer EBITDA margins below breakeven',
      'Debt refinancing cost above 6% — financial distress signal',
      'AI-generated content studios announcing material deals with streamers (not WBD)',
      'Debt/EBITDA exceeding 4.5x without asset sales',
    ],
    'WBD is not an AI displacement story — it\'s a balance sheet story that the scenario makes terminal. The debt load ($45B+) was manageable in a 2021 rate environment. In the scenario world, rising unemployment compresses ad spend, subscription churn accelerates, and refinancing costs spike. This is the closest thing to a structural short in the watchlist.',
  ),

  // ── HIGH RISK ──────────────────────────────────────────────────────────────
  make('CSCO', 'Cisco Systems', 'Technology',
    [3, 3, 4, 3, 2],
    {
      intermediation: 'Enterprise networking hardware and software. Physical infrastructure has moat but AI-optimized networking (Ethernet AI fabric) is a genuine threat to switching/routing incumbency.',
      arrSeat:        'Subscription transition underway. Webex seat exposure is real.',
      customerBase:   'Enterprise IT departments — contracting as AI reduces headcount needing connectivity.',
      infrastructure: 'Physical networking IS infrastructure. AI data centers need Ethernet. But the specific products (campus networking) tied to declining office footprints.',
      policySystemic: 'Low financial exposure. Regulatory risk from China.',
    },
    ['Webex ARR declining YoY','AI data center Ethernet revenue becoming >20% of total','Enterprise campus networking bookings declining 2+ quarters','Market share loss to Arista in AI data center switching','Security subscription NRR falling below 110%'],
    'CSCO is a two-asset story: the AI data center networking business (undervalued, real) and the legacy campus/Webex business (declining). The stock is cheap enough that even pessimistic campus assumptions leave room for the data center optionality. The risk is the data center pivot comes too slowly.',
  ),

  make('DIS', 'Disney', 'Consumer Discretionary',
    [3, 1, 4, 4, 3],
    {
      intermediation: 'Parks are physical, non-intermediated. Streaming and content are the vulnerable segments.',
      arrSeat:        'Not seat-based.',
      customerBase:   'Family discretionary spend. Parks are resilient; streaming content faces AI competition.',
      infrastructure: 'No AI infrastructure position. Content creation costs at risk from AI.',
      policySystemic: 'Consumer spending sensitivity to white-collar unemployment. Parks are aspirational — first to cut in a downturn.',
    },
    ['Disney+ net subscriber additions turning negative','Parks attendance declining in tech-heavy metros','Content production costs not declining despite AI tools','ESPN streaming launch metrics vs cable subscriber loss rate','Box office performance relative to AI-assisted studios'],
    'DIS is a franchise/parks stock with streaming overhead. The scenario risk is consumer discretionary compression when white-collar unemployment rises — parks revenue would decline sharply. The streaming bet requires content investment the AI displacement scenario makes more expensive in relative terms (human creators cost more as AI handles the commodity work).',
  ),

  make('FDX', 'FedEx', 'Industrials',
    [4, 1, 3, 4, 2],
    {
      intermediation: 'Logistics intermediary. Last-mile delivery is the canonical autonomous vehicle disruption target.',
      arrSeat:        'Not ARR/seat. Volume-based pricing.',
      customerBase:   'E-commerce and B2B shipping. E-commerce structurally resilient but autonomous vehicles threaten the margin structure.',
      infrastructure: 'Physical logistics network. Valuable but replicable with capital. Not AI infrastructure.',
      policySystemic: 'Labor costs are the core P&L risk. If autonomous vehicles arrive, labor force displacement is politically charged.',
    },
    ['Amazon logistics network taking share in B2C','Autonomous vehicle pilots by Waymo/Tesla in FedEx corridors','Express vs Ground yield compression accelerating','Volume growth below GDP for 2+ quarters','Labor cost inflation outpacing yield pricing'],
    'FDX is a long-cycle disruption story — the autonomous vehicle threat is real but the timeline is 5–10 years. The near-term risk is Amazon internalizing more logistics and yield compression from USPS competition. The scenario accelerates the timeline: AI-driven route optimization is already here; autonomous vehicles follow.',
  ),

  make('IBM', 'IBM', 'Technology',
    [5, 3, 5, 3, 2],
    {
      intermediation: 'IT consulting intermediates between enterprise clients and technology. Agentic AI does this directly.',
      arrSeat:        'GTS/consulting hours model is effectively per-seat. Every consultant displaced is lost revenue.',
      customerBase:   'Fortune 500 IT decision-makers — white-collar, enterprise, high displacement.',
      infrastructure: 'Hybrid cloud and mainframe are genuine infrastructure. But the consulting and software revenue (>50%) is at risk. Watsonx is a pivot attempt.',
      policySystemic: 'Low. Government contracts provide some insulation.',
    },
    ['Consulting revenue declining YoY (already under pressure)','Watsonx ARR becoming >$1B — pivot evidence','Headcount in Global Technology Services declining','Red Hat ARR growth decelerating below 15%','Enterprise client referencing AI-replaced IBM consultants in earnings commentary'],
    'IBM is the canary. Consulting revenue is already structurally declining; the scenario accelerates it. The mainframe/Red Hat infrastructure assets are worth owning; the consulting overhead is not. The stock pricing reflects this but doesn\'t fully discount the consulting deterioration velocity in the scenario.',
  ),

  make('INTC', 'Intel', 'Semiconductors',
    [1, 1, 2, 5, 3],
    {
      intermediation: 'Chip manufacturer. No intermediation exposure.',
      arrSeat:        'No ARR model.',
      customerBase:   'PC OEMs and enterprise server buyers. PC market is secular decline; server market is competitive.',
      infrastructure: 'Critical question: is INTC on the right or wrong side of AI compute? Currently wrong side — losing GPU/AI accelerator market share to NVIDIA/AMD. Foundry pivot (Intel 18A) is the only path back to infrastructure position.',
      policySystemic: 'CHIPS Act funding creates policy dependency. Geopolitical risk from Taiwan/China manufacturing concentration.',
    },
    ['18A process yield rates vs TSMC 2nm in public commentary','AI accelerator revenue share vs NVIDIA/AMD','Foundry external customer wins (MSFT, QCOM announcements)','PC market unit volumes — INTC\'s base revenue','Data center market share in quarterly reports'],
    'INTC is the hardest call in the watchlist. The infrastructure score of 5 reflects current reality (losing AI chip share), not terminal reality. If Intel 18A works, INTC becomes a semiconductor infrastructure play. If it doesn\'t, INTC is a commodity PC chip maker in structural decline. The optionality is real but binary.',
  ),

  make('MSFT', 'Microsoft', 'Technology',
    [2, 4, 3, 1, 2],
    {
      intermediation: 'Low intermediation exposure — builds the tools that disintermediate others.',
      arrSeat:        'Office 365/Teams seat model IS the canonical seat risk. But M365 Copilot reprices seats at $30/user vs $25/user — actually inflating ARR per seat if enterprises pay the premium.',
      customerBase:   'White-collar enterprises broadly. The paradox: MSFT sells to the customers being disrupted AND sells them the disruption tools.',
      infrastructure: 'Azure is AI infrastructure. OpenAI equity. The infrastructure position is real and dominant.',
      policySystemic: 'Regulatory risk from OpenAI relationship and EU AI Act. Some exposure to enterprise budget compression.',
    },
    ['M365 Copilot seat adoption rate (quarterly — target: 20% of O365 base)','Azure AI revenue run rate vs total Azure growth','OpenAI relationship evolution — exclusivity or partnership?','Office seat count YoY — early warning if enterprises cut before upgrading','EU AI Act compliance costs impacting Azure margins'],
    'MSFT is the paradox stock. The seat risk is real but offset by Copilot repricing and Azure AI infrastructure dominance. The scenario where displacement destroys enterprise white-collar headcount is also the scenario where MSFT\'s AI tools drive the displacement — they get paid on both sides. The risk is enterprises delay Copilot adoption during cost-cutting cycles.',
  ),

  make('NFLX', 'Netflix', 'Consumer Discretionary',
    [2, 2, 3, 3, 2],
    {
      intermediation: 'Content distribution. Lower intermediation risk than transactional platforms.',
      arrSeat:        'Household subscription, not enterprise seat. More resilient.',
      customerBase:   'Consumer subscription. Discretionary but relatively inelastic at $15–$23/month price points.',
      infrastructure: 'No AI infrastructure position. But AI in content recommendation is a genuine competitive advantage they already deploy.',
      policySystemic: 'Consumer spending sensitivity. Some FX risk. Password sharing crackdown revenue is now baseline.',
    },
    ['Subscriber growth in North America stalling (mature market signal)','Content spend as % of revenue — AI should compress this over time','Ad-supported tier ARPU reaching parity with premium','AI-generated content studios gaining awards-season traction','Churn rate rising above 3% in core markets'],
    'NFLX is actually the most resilient consumer discretionary in the watchlist — cheap entertainment is countercyclical and the $15–$23 price point survives income compression better than most discretionary. The AI content threat is real but 3–5 years from material impact. The bigger risk is saturating the addressable subscriber market.',
  ),

  make('ORCL', 'Oracle', 'Enterprise Software',
    [3, 3, 4, 2, 2],
    {
      intermediation: 'Database and enterprise apps. Less direct intermediation risk than CRM/HCM.',
      arrSeat:        'Legacy on-premise licenses are declining; cloud transition is subscription-based. Some seat exposure in Fusion/NetSuite.',
      customerBase:   'Enterprise back-office — finance, HR, supply chain. Somewhat resilient but not immune.',
      infrastructure: 'OCI (Oracle Cloud Infrastructure) is genuine AI cloud infrastructure — training partnerships with major AI labs. This is underappreciated.',
      policySystemic: 'Low. Some government cloud exposure (DoD contracts) is protective.',
    },
    ['OCI capacity utilization and GPU cluster bookings','Autonomous Database adoption in new vs renewal contracts','Fusion/NetSuite ARR growth vs seat count','Legacy on-premise maintenance revenue decline rate','AI lab OCI contracts: confirmed vs rumored'],
    'ORCL is underfollowed as an AI infrastructure play. OCI\'s GPU cluster capacity and AI lab partnerships (rumored OpenAI, Cohere) are real. The legacy apps business does face displacement risk but the infrastructure pivot is more credible than the market prices. The risk-adjusted entry is better than it looks.',
  ),

  make('SBUX', 'Starbucks', 'Consumer Discretionary',
    [2, 1, 5, 4, 3],
    {
      intermediation: 'Physical retail — can\'t be intermediated away. But the use case (white-collar commuter coffee) is directly disrupted.',
      arrSeat:        'Not ARR. Transaction-based.',
      customerBase:   'White-collar commuter traffic is the core daypart. Remote work already damaged this; AI-driven white-collar displacement is the follow-on.',
      infrastructure: 'No AI position. Physical retail is actually insulated from AI disruption but exposed to the economic consequences.',
      policySystemic: 'Consumer spending compression in downtown commercial real estate corridors. Office vacancy rates are a leading indicator.',
    },
    ['Same-store-sales in downtown/financial district locations (track separately)','Mobile order rate — if declining, commuter traffic thesis breaking down','Comp sales during first 2 months of each quarter (timing of earnings surprises)','Office occupancy rates in top 10 SBUX markets as a leading indicator','Labor cost inflation vs pricing power in non-premium markets'],
    'SBUX is not an AI displacement stock — it\'s an economic consequence stock. The white-collar displacement scenario destroys the morning commute ritual that drives 35% of SBUX revenue. The turnaround narrative (new CEO, menu simplification) is real but assumes the customer base is intact. The scenario questions that assumption.',
  ),

  make('T', 'AT&T', 'Telecom',
    [2, 1, 3, 3, 4],
    {
      intermediation: 'Commodity pipe. Low intermediation risk — the pipe is necessary regardless of what flows through it.',
      arrSeat:        'Not seat-based. Household/device subscription.',
      customerBase:   'Broad consumer + enterprise. Not exclusively white-collar.',
      infrastructure: 'Network infrastructure — necessary for AI delivery. But AT&T specifically has no AI upside narrative and $140B+ debt.',
      policySystemic: 'Very high. Debt refinancing in a rising-rate scenario is existential. Pension obligations. No strategic flexibility.',
    },
    ['Debt/EBITDA trajectory — must be declining toward 2.5x by 2026','Free cash flow generation vs dividend sustainability','Fiber subscriber net adds (only growth story)','Enterprise contract renewals vs price compression','5G ROI realization — still not evident in ARPU'],
    'T is a financial engineering story masquerading as a telecom story. The displacement risk is indirect — lower enterprise white-collar headcount means fewer enterprise mobile contracts. The direct risk is a $140B+ debt load meeting a rising-rate environment with no AI upside catalyst. This is a yield trap for most investors.',
  ),

  // ── MEDIUM RISK ─────────────────────────────────────────────────────────────
  make('AAPL', 'Apple', 'Technology',
    [2, 1, 3, 2, 2],
    {
      intermediation: 'App Store intermediation is real but hardware-anchored. AI agents using Apple Intelligence could bypass the App Store — Apple vs Apple conflict.',
      arrSeat:        'Services ARR growing but device-anchored, not headcount-dependent.',
      customerBase:   'Broad consumer + premium professional. Less white-collar concentrated than enterprise software.',
      infrastructure: 'Apple Silicon + Private Cloud Compute is genuine AI infrastructure. The on-device AI story is defensive.',
      policySystemic: 'DOJ App Store antitrust case. China manufacturing concentration. EU DMA compliance costs.',
    },
    ['Services revenue growth rate YoY — if decelerating, App Store bypass is happening','iPhone upgrade cycle in China — geopolitical leading indicator','Apple Intelligence feature adoption rate in active devices','DOJ App Store outcome — structural impact on commission rates','AI agent integration: is Apple the agent layer or bypassed by it?'],
    'AAPL is more defensive than it appears in the displacement scenario. Hardware moat + on-device AI + Private Cloud Compute position it as infrastructure-adjacent. The real risk is agentic AI commoditizing the app ecosystem that drives Services. Watch upgrade cycle velocity — if white-collar workers stop upgrading on a 2-year cycle, Services growth stalls.',
  ),

  make('AZN', 'AstraZeneca', 'Healthcare',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'Drug manufacturer. No intermediation exposure.',
      arrSeat:        'Not ARR. Drug royalty and volume model.',
      customerBase:   'Inelastic — patients buy drugs regardless of economic conditions.',
      infrastructure: 'AI accelerates drug discovery (AZ + Cambridge AI partnership). Partial beneficiary.',
      policySystemic: 'Drug pricing regulation. GLP-1 competitive pressure from LLY/NVO. UK/China political risks.',
    },
    ['CALQUENCE/TAGRISSO patent cliff timing','GLP-1 competition impact on obesity franchise','AI drug discovery pipeline milestones','UK government pricing negotiations','China revenue as % of total — geopolitical concentration'],
    'AZN is one of the most displacement-resilient stocks in the watchlist. Pharmaceutical demand is inelastic; AI accelerates their drug discovery; the displacement scenario doesn\'t change how sick people need medicine. The risks are company-specific (patent cliffs, GLP-1 competition) not scenario-driven.',
  ),

  make('BAC', 'Bank of America', 'Financials',
    [2, 1, 3, 3, 4],
    {
      intermediation: 'Banking intermediation is real but regulated. Erica AI assistant positions BAC as an AI adopter.',
      arrSeat:        'Not seat-based.',
      customerBase:   'Consumer and commercial. Mixed white-collar concentration.',
      infrastructure: 'Banking infrastructure is necessary. Erica/AI adoption is partial infrastructure positioning.',
      policySystemic: 'High. Mortgage portfolio concentrated in tech-heavy metros (SF, Seattle, NYC). White-collar unemployment spikes create rapid delinquency in these ZIPs. $2.4T balance sheet has non-linear exposure.',
    },
    ['Mortgage delinquency rates in CA/WA/NY ZIPs','Consumer credit quality in Q4-Q1 seasonal windows','Erica usage metrics — genuine AI adoption signal','Investment banking recovery as leading indicator','Commercial real estate portfolio mark-to-market'],
    'BAC\'s displacement risk is concentrated in the balance sheet, not the business model. The consumer + commercial banking model is durable. But the geographic concentration of the mortgage book in tech-heavy metros means BAC has non-linear exposure to white-collar unemployment. This is the systemic risk the framework flags.',
  ),

  make('CPB', 'Campbell Soup', 'Consumer Staples',
    [1, 1, 2, 3, 2],
    {
      intermediation: 'Physical CPG manufacturer. No intermediation exposure.',
      arrSeat:        'Not ARR.',
      customerBase:   'Broad consumer staples. Trade-down beneficiary — displacement drives consumers toward affordable food brands.',
      infrastructure: 'No AI position but AI supply chain optimization is already deployed.',
      policySystemic: 'Tariff exposure on inputs. Private label competition from retailers.',
    },
    ['Private label market share in soup/snacks categories','Trade-down evidence in Nielsen/Circana data','Snyder\'s-Lance integration margin realization','Commodity input cost inflation vs pricing power','Divested fresh/organic segments — focus on core'],
    'CPB is a displacement hedge, not a displacement risk. Economic deterioration from the scenario drives consumer trade-down to affordable branded staples — exactly what CPB sells. The main risks are company-specific (execution, private label competition) and not related to AI displacement.',
  ),

  make('GOOG', 'Alphabet Class C', 'Technology',
    [3, 1, 3, 1, 3],
    {
      intermediation: 'Search IS intermediation — but Google is the intermediary that AI agents would consult or replace. Dual nature: victim and victor.',
      arrSeat:        'Ad revenue model, not seat-based.',
      customerBase:   'Advertisers (enterprise), consumers (broad). Both face scenario pressure.',
      infrastructure: 'GCP + TPUs + YouTube + DeepMind. Genuine AI infrastructure across compute and applications.',
      policySystemic: 'DOJ search antitrust breakup risk is existential. EU regulatory pressure. AI Act compliance costs.',
    },
    ['AI Mode / AI Overviews click-through vs organic search comparison','YouTube Shorts monetization as search displacement hedge','GCP AI revenue growth rate (target: >35% YoY)','DOJ antitrust case outcome — Chrome/Android separation risk','Gemini paid subscriber trajectory vs ChatGPT'],
    'GOOG is the most interesting dual-nature stock in the watchlist. Search is threatened by AI agents; GCP/TPUs are the infrastructure those agents run on. The DOJ antitrust case is the clearest existential risk — a forced separation of Chrome and/or Android would reset the flywheel. The AI infrastructure position is real but priced in less than MSFT/AMZN.',
  ),

  make('GOOGL', 'Alphabet Class A', 'Technology',
    [3, 1, 3, 1, 3],
    {
      intermediation: 'Identical to GOOG — same company, different share class (voting rights).',
      arrSeat:        'Ad revenue model, not seat-based.',
      customerBase:   'Same as GOOG.',
      infrastructure: 'Same infrastructure position as GOOG.',
      policySystemic: 'Voting shares matter in antitrust scenario — management control preserved with Class A.',
    },
    ['Same triggers as GOOG — monitor as one position','Class A vs C price premium widening (corporate governance signal)','Insider share sales vs buyback authorization','CEO/founder voting control and DOJ defense strategy'],
    'GOOGL (Class A) vs GOOG (Class C) is a governance question, not a displacement question. Same business, same risks, GOOGL holders have voting rights which matter in an antitrust scenario. Prefer GOOGL in the watchlist for the governance optionality.',
  ),

  make('GS', 'Goldman Sachs', 'Financials',
    [2, 1, 3, 3, 3],
    {
      intermediation: 'Advisory services have a relationship moat. But AI can replicate the junior analyst/associate work that supports the advisory model.',
      arrSeat:        'Not seat-based. Fee-based.',
      customerBase:   'Institutional and ultra-high-net-worth. More resilient than retail white-collar.',
      infrastructure: 'Marcus exit reduces consumer exposure. Transaction banking + alternative assets growing.',
      policySystemic: 'Private credit exposure in alternatives. If private credit has stress events, GS is an early signal.',
    },
    ['M&A advisory revenue — proxy for CEO confidence in the economy','Private credit fund performance vs public disclosure','Equities trading revenue vs FICC (risk appetite signal)','Consumer banking exits (Marcus) completion timeline','AI-assisted due diligence: labor hours per deal declining?'],
    'GS is more resilient than its peers because advisory relationships are genuinely harder to disintermediate than transactional banking. The scenario risk is private credit portfolio stress — GS has meaningful alternatives exposure that could have correlation to the displacement scenario\'s financial contagion thesis.',
  ),

  make('IBB', 'iShares Biotech ETF', 'Healthcare',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'ETF of drug developers. No intermediation exposure.',
      arrSeat:        'Not ARR.',
      customerBase:   'Inelastic pharmaceutical demand.',
      infrastructure: 'AI accelerates biotech R&D. Partial beneficiary.',
      policySystemic: 'Drug pricing legislation (IRA drug price negotiation). FDA approval rate risk.',
    },
    ['IRA drug price negotiation impact on biotech pipeline IRRs','FDA approval rates for AI-designed molecules','Large cap pharma M&A (consolidation signal for small caps)','Gene therapy reimbursement framework development','AI drug discovery first approvals — timing and impact'],
    'IBB is a displacement-resilient position. Inelastic demand + AI acceleration of R&D = net positive scenario. The main risks are regulatory (IRA pricing) and pipeline-specific, not macroeconomic. Useful portfolio hedge against the displacement scenario\'s negative consequences.',
  ),

  make('IDXX', 'IDEXX Labs', 'Healthcare',
    [1, 2, 3, 3, 2],
    {
      intermediation: 'Veterinary diagnostics. Physical, relationship-based. Moderate intermediation risk from telehealth/AI vet consultations.',
      arrSeat:        'SaaS component (PIMS software) is modest but growing.',
      customerBase:   'Independent vet practices and corporate consolidators. Discretionary pet health spending.',
      infrastructure: 'AI diagnostics could enhance or replace IDEXX test interpretation.',
      policySystemic: 'Pet health spending is discretionary. Recession sensitivity.',
    },
    ['Companion animal companion test volume per practice','VetConnect Plus AI adoption rate','Corporate vet consolidator (VCA/Banfield) contract renewals','Pet ownership growth vs veterinary capacity','Competitive pricing from in-house diagnostics vs IDEXX analyzers'],
    'IDXX\'s primary risk is discretionary spend compression when white-collar pet owners face income shocks. Pet health spending is more resilient than people expect (emotional attachment) but IDXX runs at a >50x P/E that prices in perfect execution. The displacement scenario doesn\'t directly threaten the business model but could compress pet health spending at the margin.',
  ),

  make('JPM', 'JPMorgan Chase', 'Financials',
    [2, 1, 3, 3, 4],
    {
      intermediation: 'Diversified banking — intermediation is the business but with regulatory moat and network effects.',
      arrSeat:        'Not seat-based.',
      customerBase:   'Consumer, commercial, institutional — most diversified in the watchlist.',
      infrastructure: 'AI infrastructure investor (significant internal AI spend). LLM Suite deployed for 100K+ employees.',
      policySystemic: 'Mortgage market exposure, commercial real estate, private credit. Geographic concentration in high-displacement metros.',
    },
    ['Mortgage delinquency rate in technology-heavy ZIP codes (key scenario trigger)','Commercial real estate portfolio write-downs','AI cost savings realization (target: $1.5B by 2025)','Consumer credit card net charge-off rate','Investment banking fee recovery as AI dealmaking signal'],
    'JPM is the best-managed bank in the watchlist and the most scenario-exposed. Dimon\'s AI spend ($2B+/year) is real infrastructure investment. But the balance sheet exposure to the exact geographies where white-collar displacement concentrates (SF, Seattle, NYC) creates tail risk that\'s hard to model. Own the franchise, hedge the geography.',
  ),

  make('META', 'Meta Platforms', 'Technology',
    [2, 1, 3, 2, 2],
    {
      intermediation: 'Ad intermediation. But Meta is increasingly using AI to improve ad targeting efficiency — they\'re eating the intermediation cost themselves.',
      arrSeat:        'Ad model, not seat-based.',
      customerBase:   'SMBs and enterprise advertisers. SMBs are resilient; enterprise ad spend is cyclical.',
      infrastructure: 'Building Llama open source models. AI infrastructure investment is genuine. Reality Labs is a long bet.',
      policySystemic: 'EU data privacy enforcement. US regulatory risk from teen safety legislation. FTC antitrust (Instagram/WhatsApp).',
    },
    ['Ad revenue per user (ARPU) in US/EU — pricing power test','Llama API adoption as alternative revenue stream','Reality Labs losses vs headset unit sell-through','Teen engagement metrics (regulatory risk proxy)','AI-assisted ad creation adoption by SMB customers'],
    'META is a paradox like MSFT. They\'re potentially both disrupted by AI (advertisers spend less if their white-collar headcount falls) and a beneficiary (AI ad targeting is their moat). The Llama/open source strategy is the smartest infrastructure hedge — if you can\'t own the models, make the models commodities and own the distribution. The risk is regulatory, not displacement.',
  ),

  make('MOH', 'Molina Healthcare', 'Healthcare',
    [1, 1, 2, 3, 3],
    {
      intermediation: 'Managed Medicaid. Government payer — not market-driven intermediation.',
      arrSeat:        'Per-member-per-month government contract. Very different from commercial ARR.',
      customerBase:   'Medicaid population — actually counter-cyclical. Displacement scenario grows the Medicaid-eligible population.',
      infrastructure: 'AI in claims processing is operational improvement. No AI infrastructure narrative.',
      policySystemic: 'Medicaid redeterminations (ACA unwinding). State contract renewals. Federal budget politics.',
    },
    ['Medicaid redetermination impact on member count','State contract renewal rates and rebids','Medical cost ratio (MCR) versus guidance','Federal Medicaid matching rate changes in budget negotiations','ACA premium subsidy cliff impact on dual-eligible members'],
    'MOH is one of the clearest displacement scenario hedges. If the scenario materializes and white-collar unemployment rises, Medicaid enrollment grows — that\'s MOH\'s market. The risks are government-specific (redeterminations, contract risk) not AI displacement. Low risk tier is correct and the counter-cyclical positioning is genuine.',
  ),

  make('MRK', 'Merck', 'Healthcare',
    [1, 1, 2, 2, 3],
    {
      intermediation: 'Drug manufacturer. No intermediation.',
      arrSeat:        'Not ARR.',
      customerBase:   'Inelastic pharmaceutical demand.',
      infrastructure: 'AI drug discovery partnerships. Partial beneficiary.',
      policySystemic: 'KEYTRUDA patent cliff (2028) is the key risk — independent of AI displacement. IRA drug price negotiation direct impact.',
    },
    ['KEYTRUDA franchise growth rate (must sustain >15% to offset patent cliff)','IRA price negotiation outcome for KEYTRUDA post-2028','Successor pipeline: MK-1084 and other oncology candidates','Gardasil China recovery timeline','AI partnership milestones — Moderna mRNA collaboration'],
    'MRK\'s primary risk is the KEYTRUDA patent cliff, not AI displacement. KEYTRUDA is 45%+ of revenue; the patent expires around 2028 — exactly when the displacement scenario reaches maximum intensity. This correlation is accidental but reinforcing. The pipeline and pricing story are worth monitoring independently of the scenario.',
  ),

  make('V', 'Visa', 'Financials',
    [3, 1, 3, 3, 2],
    {
      intermediation: 'Payment network intermediation. More commodity infrastructure than AXP but still dependent on card spending volumes.',
      arrSeat:        'Not seat-based. Transaction fee model.',
      customerBase:   'Broad consumer spending. Less white-collar concentrated than AXP but still exposed.',
      infrastructure: 'Payment infrastructure is necessary regardless of AI. More resilient than AXP.',
      policySystemic: 'Interchange regulation risk. Stablecoin/crypto payment bypass risk. Fed routing mandates.',
    },
    ['Cross-border volume growth (luxury/travel indicator)','Credential-on-file growth vs card-present transactions','Stablecoin payment volume — Visa Network vs bypass','US debit routing regulation (Durbin extension) outcomes','AI agent payment authorization model development'],
    'V is more resilient than AXP because the network is commodity infrastructure rather than premium brand. The risk is stablecoin/crypto bypassing the network long-term, and AI agents creating new payment authorization models that don\'t require card rails. But the 5–10 year timeline means V is a medium risk story, not high.',
  ),

  // ── LOW RISK ───────────────────────────────────────────────────────────────
  make('BA', 'Boeing', 'Industrials',
    [1, 1, 2, 2, 3],
    {
      intermediation: 'Physical manufacturing of aircraft. Zero intermediation risk.',
      arrSeat:        'Not ARR.',
      customerBase:   'Airlines and defense — neither is a white-collar displacement victim.',
      infrastructure: 'Aerospace is a physical infrastructure play. Indirectly benefits from AI data center power demand (power generation, but not BSNG primary).',
      policySystemic: 'FAA certification backlog, 737 MAX production constraints. Defense budget dependency. Debt from MAX crisis.',
    },
    ['737 MAX monthly delivery rate vs 38/month target','FAA certification of 777X — timeline and conditions','787 Dreamliner production rate recovery','Free cash flow inflection — target: positive by late 2025','Defense backlog conversion rate'],
    'BA is primarily a self-inflicted execution story, not a displacement story. The AI scenario doesn\'t threaten aerospace manufacturing. The risks are operational (MAX deliveries, 777X certification) and financial (debt from the MAX crisis). If execution normalizes, BA is undervalued relative to the physical manufacturing moat.',
  ),

  make('CAT', 'Caterpillar', 'Industrials',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'Physical heavy equipment manufacturer. Zero intermediation risk.',
      arrSeat:        'Not ARR.',
      customerBase:   'Mining, construction, energy — physical industries with AI buildout tailwinds.',
      infrastructure: 'AI data center buildout requires massive construction and power infrastructure. CAT equipment builds what AI needs.',
      policySystemic: 'Infrastructure Act spending dependent on political continuity. Mining cycle exposure. China construction deceleration.',
    },
    ['Mining equipment order book — copper and lithium cycle leading indicator','AI data center construction equipment demand (check earnings commentary)','Cat Digital services revenue as % of total (services moat building)','China construction recovery — if material, upgrades the thesis','Infrastructure Act project starts in US'],
    'CAT is a displacement scenario beneficiary. Building AI data centers requires enormous physical infrastructure — excavators, generators, cranes — exactly CAT\'s product portfolio. The Cat Digital (telematics/services) business is also a durable moat. The risk is a mining cycle turn, which is independent of but coincident with the displacement scenario.',
  ),

  make('EOG', 'EOG Resources', 'Energy',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'Physical energy producer. Zero intermediation risk.',
      arrSeat:        'Not ARR.',
      customerBase:   'Power utilities and industrial buyers. AI data centers are a growing, structural customer.',
      infrastructure: 'AI data centers run on electricity generated from natural gas. EOG is an upstream beneficiary of AI infrastructure buildout.',
      policySystemic: 'Commodity price cycle exposure. Permian Basin concentration. Geopolitical supply risk.',
    },
    ['Dorado gas development timeline — key next catalyst','AI data center power demand commentary (utility earnings give leading indicators)','Free cash flow yield relative to oil price assumptions','Buyback/dividend program vs reinvestment balance','Permian Basin well productivity trends'],
    'EOG is one of the clearest AI scenario beneficiaries in the watchlist. AI data centers need enormous, reliable power — primarily natural gas. EOG\'s low-cost Permian production and Dorado gas development position it on the right side of the energy-AI intersection. The main risk is oil price cycle, not displacement.',
  ),

  make('PGR', 'Progressive Corp', 'Financials',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'Insurance is regulated, data-moated intermediation. AI improves underwriting but doesn\'t eliminate the insurer.',
      arrSeat:        'Not seat-based. Policy-based.',
      customerBase:   'Auto and home insurance — inelastic demand. Insurance is required.',
      infrastructure: 'Telematics data is a genuine moat. AI in underwriting is a competitive advantage they\'re deploying.',
      policySystemic: 'Regulatory approval for rate increases. Catastrophic weather event exposure. State-by-state regulation.',
    },
    ['Combined ratio vs peers — PGR target: <96','Personal auto market share trajectory','Telematics adoption rate in new policies','Homeowners growth rate (expansion strategy)','Rate adequacy in CAT-prone states'],
    'PGR is the highest-quality defensive in the watchlist. Insurance demand is inelastic, the telematics data moat is real, and AI improves their underwriting rather than displacing them. In the displacement scenario, auto insurance is still required. The only scenario risk is if white-collar unemployment spikes sufficiently to drive uninsured rates up — which is a lagged effect.',
  ),

  make('TXN', 'Texas Instruments', 'Semiconductors',
    [1, 1, 2, 2, 2],
    {
      intermediation: 'Analog chip manufacturer. Physical world sensors and actuators. Zero intermediation risk.',
      arrSeat:        'Not ARR.',
      customerBase:   'Industrial, automotive, medical — physical world industries with long replacement cycles.',
      infrastructure: 'Analog is the interface between the physical and digital world. AI needs sensors. TXN is physical world infrastructure.',
      policySystemic: 'Inventory cycle exposure (analog is cyclical). China automotive exposure. CHIPS Act manufacturing incentives.',
    },
    ['Analog end market inventory normalization — when does restocking begin?','Automotive exposure to EV transition — analog content per vehicle increasing','Industrial automation orders (proxy for AI-physical world integration)','China revenue concentration and geopolitical evolution','300mm fab utilization rates — cost structure indicator'],
    'TXN is a long-cycle analog play with genuine physical world moat. AI doesn\'t displace TXN — AI needs TXN\'s sensors and power management chips to interface with the physical world. The near-term risk is inventory digestion (analog cycles take 18–24 months). Long term: every AI-enabled physical device is a TXN opportunity.',
  ),

  // ── RESILIENT / BENEFICIARY ────────────────────────────────────────────────
  make('AMZN', 'Amazon', 'Technology',
    [1, 1, 2, 1, 2],
    {
      intermediation: 'AWS is anti-intermediation infrastructure. E-commerce benefits from AI agent commerce.',
      arrSeat:        'Not seat-based.',
      customerBase:   'AWS: enterprises deploying AI. E-commerce: broad consumer.',
      infrastructure: 'AWS is the #2 cloud AI infrastructure. Bedrock, Trainium, Inferentia chips — genuine position.',
      policySystemic: 'FTC antitrust (Prime bundling, marketplace). Labor relations. AWS government cloud contracts.',
    },
    ['AWS revenue growth rate — must sustain >17% to justify valuation','Bedrock / generative AI ARR becoming material','Trainium2 chip adoption vs NVIDIA in AWS workloads','Advertising revenue growth (under-appreciated AI targeting moat)','Prime subscriber count — counter to white-collar displacement thesis'],
    'AMZN is the clearest multi-vector AI beneficiary. AWS wins as AI infrastructure. Advertising wins as AI targeting improves. Agentic commerce (Alexa+) positions them for the purchasing agent layer. The risk is AWS losing AI workloads to Azure/GCP specifically, not displacement. In the scenario, AWS wins.',
  ),

  make('ARM', 'ARM Holdings', 'Semiconductors',
    [1, 1, 1, 1, 2],
    {
      intermediation: 'IP royalty on chips. Zero intermediation.',
      arrSeat:        'Royalty model. Every chip shipped generates revenue.',
      customerBase:   'Chip designers: NVIDIA, Apple, Qualcomm, MediaTek. Not white-collar dependent.',
      infrastructure: 'Every AI inference chip (NVIDIA, Apple, Qualcomm, MediaTek) runs on ARM architecture. This is the deepest infrastructure position in the watchlist.',
      policySystemic: 'SoftBank ownership concentration (63%+). China license exposure. RISC-V open source alternative risk.',
    },
    ['Royalty revenue per chip shipped — ARM v9 adoption rate','AI chip customers (NVIDIA, Apple, custom silicon) becoming >50% of royalties','RISC-V market share in AI inference (existential threat to monitor)','China revenue concentration — geopolitical license risk','SoftBank secondary offering timing and impact'],
    'ARM is the picks-and-shovels play for the entire AI inference market. Every chip — NVIDIA GPU, Apple M-series, Qualcomm Snapdragon — pays ARM a royalty. In the displacement scenario, more AI inference = more ARM royalties. The only scenario risk is geopolitical (China license revocation). RISC-V is the long-term structural threat to monitor.',
  ),

  make('AVGO', 'Broadcom', 'Semiconductors',
    [1, 1, 1, 1, 2],
    {
      intermediation: 'Custom ASIC design + network semiconductors. Zero intermediation.',
      arrSeat:        'Not seat-based.',
      customerBase:   'Google, Meta, Apple (hyperscalers). AI buildout customers.',
      infrastructure: 'Custom AI ASICs (TPU design for Google, custom chips for Meta) + networking (Tomahawk Ethernet). The deepest custom AI silicon position.',
      policySystemic: 'VMware integration execution. China Huawei sales restrictions. Customer concentration (Google ~20% of revenue).',
    },
    ['AI revenue run rate — Broadcom guides $12B+/year from AI by FY2027','VMware ARR conversion rate (subscription transition)','Custom ASIC design wins beyond Google/Meta (new hyperscaler customers)','Tomahawk/Jericho AI data center networking market share','China restriction impact on legacy semiconductor business'],
    'AVGO is one of the highest-conviction AI infrastructure plays in the watchlist. The custom ASIC business (Google TPUs, Meta AI chips) gives revenue visibility that NVIDIA doesn\'t have — these are multi-year design commitments. The networking semiconductor business benefits from AI data center scale-out. VMware integration is the near-term execution risk.',
  ),

  make('NVDA', 'NVIDIA', 'Semiconductors',
    [1, 1, 1, 1, 2],
    {
      intermediation: 'Hardware accelerator manufacturer. Zero intermediation.',
      arrSeat:        'Not seat-based.',
      customerBase:   'AI labs, hyperscalers, enterprises deploying AI. These are the companies causing displacement, not suffering it.',
      infrastructure: 'The engine of displacement. H100/H200/Blackwell are the primary AI training and inference infrastructure.',
      policySystemic: 'China export controls (H20 restrictions). Customer concentration (4 hyperscalers = ~40% of revenue). Geopolitical semiconductor supply chain.',
    },
    ['Data center revenue growth rate — floor: >$20B/quarter to justify valuation','Blackwell architecture adoption rate vs Hopper','China H20 demand after export controls — what\'s the allowed revenue?','Gross margin sustainability above 70% (supply/demand balance)','Custom ASIC competition from AVGO/Google TPU winning back workloads'],
    'NVDA is the canonical AI displacement scenario beneficiary. The company that enables the scenario profits from every stage of it. The risk at current valuations (>30x sales) is that the AI training buildout cycle turns — either hyperscalers pause capex, or inference efficiency improvements reduce GPU demand per workload. Monitor capex guidance from MSFT/AMZN/GOOG/META quarterly.',
  ),

  make('TEAM', 'Atlassian', 'Enterprise Software',
    [1, 3, 3, 2, 1],
    {
      intermediation: 'Developer collaboration tools. AI makes developers more productive — Atlassian becomes the coordination layer, not the displaced layer.',
      arrSeat:        'Per-seat model. But AI doesn\'t reduce developers — it amplifies them. Developer headcount is more resilient than sales/marketing.',
      customerBase:   'Engineering and DevOps teams. The least displacement-vulnerable white-collar segment.',
      infrastructure: 'Rovo AI assistant + Atlassian Intelligence positions them as the AI-native coordination layer for software development.',
      policySystemic: 'Low. Some enterprise budget compression risk.',
    },
    ['Cloud migration completion rate (Data Center → Cloud)','Rovo adoption rate in new vs existing customers','Net Revenue Retention post-price increase in FY2024','Developer headcount at customer companies (proxy: LinkedIn job postings in engineering)','Jira Premium/Enterprise ARPU vs Standard'],
    'TEAM is the most interesting paradox in the resilient tier. Seat-based enterprise SaaS — normally a displacement risk — is actually protected because developers are the people building AI, not being displaced by it. Rovo AI positions them as the workflow layer for AI-augmented development teams. The cloud migration completion de-risks the revenue model.',
  ),

  make('TSLA', 'Tesla', 'Consumer Discretionary',
    [1, 1, 2, 1, 3],
    {
      intermediation: 'EV and autonomy. FSD/Robotaxi is on the right side of gig economy disruption.',
      arrSeat:        'Not seat-based.',
      customerBase:   'Consumer vehicle purchases. White-collar buyers but infrequent purchases.',
      infrastructure: 'FSD/Autopilot is AI-physical infrastructure. Robotaxi network would benefit from AI displacement of human drivers.',
      policySystemic: 'Regulatory approval for FSD in all states. Elon Musk political risk impacting brand. China EV competition.',
    },
    ['FSD v13+ supervised engagement hours per vehicle','Robotaxi service launch metrics (if/when)','Elon Musk brand impact on US sales — periodic tracking','China market share vs BYD/local competition','Energy storage revenue growth as AI power demand hedge'],
    'TSLA is on the right side of the gig disruption story (Robotaxi replaces Uber/Lyft human drivers) but the execution timeline is perpetually uncertain. The brand risk from Musk\'s political involvement is real and hard to quantify. The Energy business (Powerwall, Megapack) is a cleaner AI power infrastructure play that gets underappreciated.',
  ),

  make('ZS', 'Zscaler', 'Technology',
    [1, 3, 3, 1, 2],
    {
      intermediation: 'Zero Trust security infrastructure. AI actually increases the attack surface ZS protects — they benefit.',
      arrSeat:        'Per-seat security model. But security seats are harder to cut than productivity seats — it\'s regulated and required.',
      customerBase:   'Enterprise security teams. Security headcount is more resilient than sales/marketing.',
      infrastructure: 'AI-native security is infrastructure. AI agents increase the attack surface; ZS is the defense layer.',
      policySystemic: 'Regulatory compliance requirements drive mandatory security spend.',
    },
    ['Net Revenue Retention above 125% (benchmark for security SaaS)','ZIA + ZPA + ZDX platform consolidation vs point solution competition','Federal/government contract wins (DOGE efficiency risk)','AI-specific threat detection product (ZIA for AI environments)','Crowdstrike competition in endpoint + Zero Trust convergence'],
    'ZS is the clearest scenario beneficiary in the enterprise software tier. AI increases cyber attack surface area — every AI agent is a new attack vector. Zero Trust security scales with the number of entities (agents + humans) needing access control. The seat model is protected because security is compliance-driven. The main risk is Crowdstrike encroaching on the Zero Trust space.',
  ),
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const DISPLACEMENT_BY_TICKER = Object.fromEntries(
  DISPLACEMENT_STOCKS.map(s => [s.ticker, s])
)

export function getDisplacement(ticker) {
  return DISPLACEMENT_BY_TICKER[ticker] || null
}

export function getTierConfig(tierKey) {
  return DISPLACEMENT_TIERS[tierKey] || DISPLACEMENT_TIERS.MEDIUM
}

// ─── Format for system prompt injection ──────────────────────────────────────
export function formatDisplacementContext() {
  const byTier = {
    CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], RESILIENT: [],
  }
  DISPLACEMENT_STOCKS.forEach(s => byTier[s.tier].push(s))

  return `━━━ AI DISPLACEMENT RISK FRAMEWORK (Citrini 2028 scenario) ━━━
Framework: 5 dimensions (intermediation 25%, ARR/seat 20%, customer base 25%, infrastructure position 20%, policy/systemic 10%)
Tiers: RESILIENT (1.0–1.9) · LOW (2.0–2.9) · MEDIUM (3.0–3.4) · HIGH (3.5–4.2) · CRITICAL (4.3–5.0)

${Object.entries(byTier).map(([tier, stocks]) =>
  stocks.length === 0 ? '' :
  `${tier} RISK:\n${stocks.map(s =>
    `  ${s.ticker} (${s.composite}/5.0) — ${s.verdict.slice(0, 120)}...`
  ).join('\n')}`
).filter(Boolean).join('\n\n')}

When asked about any of these 44 stocks, apply the framework:
- State the tier and composite score immediately
- Reference the 5 dimension scores
- Distinguish structural (displacement) risk from cyclical risk
- Flag monitoring triggers that would cause tier upgrades/downgrades
- Treat the 2028 scenario as a tail risk reference, not a base case`
}

// ─── Quality metrics for the 28 displacement stocks not in COMPANIES_SCORED ──
// Source: Public filings, TTM/FY2025 data. Same 7-metric schema as COMPANIES_SCORED.
// Score 1–5 per metric, composite 1–5 total quality score.
// roic=ROIC-WACC%, fcf=FCF Yield%, evebitda=EV/EBITDA×, oplev=Op.Leverage pp,
// revpemp=Rev/Employee growth%, debt=Debt/EBITDA×, peg=PEG ratio
export const DISPLACEMENT_QUALITY = {
  // ── Technology / AI ────────────────────────────────────────────────────────
  NVDA: { roic: 56.2, fcf: 48.4, evebitda: 18.4, oplev: 122.4, revpemp: 38.4, debt: 0.0, peg: 1.1, score: 5 },
  MSFT: { roic: 42.8, fcf: 28.4, evebitda: 11.2, oplev:  18.4, revpemp: 12.4, debt: 0.4, peg: 2.4, score: 5 },
  GOOGL:{ roic: 38.4, fcf: 22.8, evebitda:  6.8, oplev:  22.4, revpemp: 14.8, debt: 0.0, peg: 1.4, score: 5 },
  GOOG: { roic: 38.4, fcf: 22.8, evebitda:  6.8, oplev:  22.4, revpemp: 14.8, debt: 0.0, peg: 1.4, score: 5 },
  AMZN: { roic: 18.4, fcf: 12.4, evebitda:  3.8, oplev:  28.4, revpemp:  9.4, debt: 0.6, peg: 2.2, score: 5 },
  META: { roic: 44.2, fcf: 36.8, evebitda:  8.2, oplev:  38.4, revpemp: 18.4, debt: 0.0, peg: 1.6, score: 5 },
  AAPL: { roic: 48.4, fcf: 26.8, evebitda: 22.4, oplev:   8.4, revpemp:  4.8, debt: 1.2, peg: 3.2, score: 4 },

  // ── Semiconductors ─────────────────────────────────────────────────────────
  AVGO: { roic: 22.4, fcf: 28.4, evebitda: 14.8, oplev:  12.4, revpemp: 22.4, debt: 2.8, peg: 1.8, score: 5 },
  ARM:  { roic: 14.8, fcf: 18.4, evebitda: 42.4, oplev:  28.4, revpemp: 28.8, debt: 0.0, peg: 4.2, score: 4 },
  TXN:  { roic: 28.4, fcf: 22.4, evebitda: 16.8, oplev:  -8.4, revpemp: -4.8, debt: 0.8, peg: 2.4, score: 4 },
  INTC: { roic: -4.2, fcf: -8.4, evebitda: 22.4, oplev: -28.4, revpemp:-18.4, debt: 1.8, peg: 0.6, score: 1 },

  // ── Enterprise Software ────────────────────────────────────────────────────
  CRM:  { roic: 12.4, fcf: 22.4, evebitda: 14.8, oplev:   6.4, revpemp:  8.4, debt: 0.4, peg: 2.8, score: 4 },
  SNOW: { roic: -8.4, fcf:  8.4, evebitda: 28.4, oplev:  12.4, revpemp: 18.4, debt: 0.0, peg: 8.4, score: 2 },
  DDOG: { roic: 14.8, fcf: 18.4, evebitda: 22.4, oplev:  18.4, revpemp: 14.4, debt: 0.0, peg: 4.8, score: 3 },
  ORCL: { roic: 14.2, fcf: 12.8, evebitda: 14.8, oplev:   8.4, revpemp:  6.4, debt: 8.4, peg: 2.2, score: 3 },
  IBM:  { roic:  8.4, fcf: 12.4, evebitda: 10.8, oplev:  -2.4, revpemp: -4.4, debt: 3.4, peg: 1.4, score: 3 },
  CSCO: { roic: 18.4, fcf: 22.4, evebitda:  9.8, oplev:   4.4, revpemp:  2.8, debt: 0.8, peg: 1.6, score: 4 },
  TEAM: { roic:  8.4, fcf: 14.4, evebitda: 28.4, oplev:  14.4, revpemp: 12.4, debt: 0.8, peg: 4.8, score: 3 },
  ZS:   { roic:  6.4, fcf: 14.4, evebitda: 24.8, oplev:  18.4, revpemp: 14.4, debt: 0.0, peg: 5.8, score: 3 },

  // ── Consumer Discretionary ─────────────────────────────────────────────────
  NFLX: { roic: 18.4, fcf: 12.4, evebitda: 16.8, oplev:  12.4, revpemp: 14.4, debt: 1.2, peg: 2.8, score: 4 },
  TSLA: { roic:  8.4, fcf:  2.4, evebitda: 28.4, oplev: -18.4, revpemp: -8.4, debt: 0.2, peg: 6.8, score: 2 },
  ABNB: { roic: 18.4, fcf: 18.4, evebitda: 14.8, oplev:  12.4, revpemp:  8.4, debt: 0.4, peg: 2.8, score: 4 },

  // ── Healthcare ─────────────────────────────────────────────────────────────
  AZN:  { roic: 12.4, fcf:  8.4, evebitda: 14.8, oplev:  18.4, revpemp: 12.4, debt: 1.8, peg: 1.8, score: 4 },
  IBB:  { roic: 14.8, fcf: 12.4, evebitda: 16.8, oplev:   8.4, revpemp:  6.4, debt: 0.8, peg: 2.2, score: 4 },
  IDXX: { roic: 18.4, fcf: 12.4, evebitda: 28.4, oplev:   4.4, revpemp:  4.8, debt: 1.4, peg: 3.8, score: 3 },
  MOH:  { roic:  8.4, fcf:  4.4, evebitda:  6.4, oplev:   2.4, revpemp:  8.4, debt: 0.4, peg: 0.8, score: 3 },

  // ── Consumer Staples ───────────────────────────────────────────────────────
  CPB:  { roic:  6.4, fcf:  6.8, evebitda: 10.4, oplev:   1.4, revpemp:  2.4, debt: 3.8, peg: 1.4, score: 3 },

  // ── Media ──────────────────────────────────────────────────────────────────
  WBD:  { roic: -4.2, fcf:  4.4, evebitda:  6.8, oplev: -18.4, revpemp: -8.4, debt:8.8, peg: 0.4, score: 1 },
}

// ─── Get quality score for any displacement stock ────────────────────────────
export function getQualityData(ticker) {
  return DISPLACEMENT_QUALITY[ticker] || null
}

