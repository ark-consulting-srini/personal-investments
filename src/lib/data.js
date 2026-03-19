export const COMPANIES = [
  // FINANCIALS — Banking
  {ticker:'JPM', name:'JPMorgan Chase',     sector:'Financials', industry:'Banking',             roic:6.2,  fcf:5.1,  evebitda:9.8,  oplev:1.8,  revpemp:7.2,  debt:0.8,  peg:1.9},
  {ticker:'BAC', name:'Bank of America',    sector:'Financials', industry:'Banking',             roic:3.8,  fcf:4.2,  evebitda:8.4,  oplev:1.2,  revpemp:4.8,  debt:1.1,  peg:1.6},
  {ticker:'WFC', name:'Wells Fargo',        sector:'Financials', industry:'Banking',             roic:2.9,  fcf:3.6,  evebitda:7.9,  oplev:0.8,  revpemp:3.1,  debt:1.4,  peg:1.4},
  {ticker:'GS',  name:'Goldman Sachs',      sector:'Financials', industry:'Banking',             roic:4.1,  fcf:3.9,  evebitda:10.2, oplev:2.4,  revpemp:5.6,  debt:2.1,  peg:1.7},
  {ticker:'MS',  name:'Morgan Stanley',     sector:'Financials', industry:'Banking',             roic:3.5,  fcf:3.4,  evebitda:9.6,  oplev:1.5,  revpemp:4.2,  debt:2.4,  peg:1.8},
  {ticker:'PGR', name:'Progressive Corp',   sector:'Financials', industry:'Insurance',           roic:8.4,  fcf:6.8,  evebitda:7.2,  oplev:3.1,  revpemp:9.4,  debt:0.4,  peg:0.8},
  {ticker:'CB',  name:'Chubb Limited',      sector:'Financials', industry:'Insurance',           roic:5.2,  fcf:5.4,  evebitda:8.1,  oplev:1.9,  revpemp:6.1,  debt:0.6,  peg:1.3},
  {ticker:'AIG', name:'AIG',                sector:'Financials', industry:'Insurance',           roic:1.8,  fcf:2.9,  evebitda:6.8,  oplev:0.4,  revpemp:2.1,  debt:1.8,  peg:2.1},
  {ticker:'MET', name:'MetLife',            sector:'Financials', industry:'Insurance',           roic:2.4,  fcf:3.1,  evebitda:7.4,  oplev:0.6,  revpemp:3.8,  debt:1.6,  peg:1.5},
  {ticker:'AXP', name:'American Express',   sector:'Financials', industry:'Payments',            roic:7.8,  fcf:5.9,  evebitda:11.4, oplev:2.6,  revpemp:8.1,  debt:1.2,  peg:1.4},
  {ticker:'UNH', name:'UnitedHealth Group', sector:'Healthcare', industry:'Managed Care',        roic:5.1,  fcf:4.4,  evebitda:9.2,  oplev:-1.4, revpemp:2.8,  debt:1.9,  peg:1.8},
  {ticker:'CI',  name:'Cigna Group',        sector:'Healthcare', industry:'Managed Care',        roic:4.4,  fcf:6.4,  evebitda:8.2,  oplev:1.1,  revpemp:3.2,  debt:2.4,  peg:1.0},
  {ticker:'ELV', name:'Elevance Health',    sector:'Healthcare', industry:'Managed Care',        roic:4.8,  fcf:5.6,  evebitda:8.6,  oplev:0.8,  revpemp:4.4,  debt:1.8,  peg:1.3},
  {ticker:'CVS', name:'CVS Health',         sector:'Healthcare', industry:'Managed Care',        roic:3.2,  fcf:5.8,  evebitda:7.8,  oplev:0.2,  revpemp:1.8,  debt:3.6,  peg:1.2},
  {ticker:'JNJ', name:'Johnson & Johnson',  sector:'Healthcare', industry:'Pharma & Biotech',    roic:6.8,  fcf:5.2,  evebitda:12.4, oplev:0.6,  revpemp:4.1,  debt:1.1,  peg:2.1},
  {ticker:'LLY', name:'Eli Lilly',          sector:'Healthcare', industry:'Pharma & Biotech',    roic:14.2, fcf:3.1,  evebitda:38.4, oplev:8.4,  revpemp:24.6, debt:1.4,  peg:0.9},
  {ticker:'ABT', name:'Abbott Labs',        sector:'Healthcare', industry:'Med Devices',         roic:7.4,  fcf:6.1,  evebitda:16.8, oplev:1.8,  revpemp:5.4,  debt:1.3,  peg:2.3},
  {ticker:'TMO', name:'Thermo Fisher',      sector:'Healthcare', industry:'Med Devices',         roic:5.6,  fcf:4.8,  evebitda:17.2, oplev:0.9,  revpemp:3.6,  debt:2.8,  peg:2.0},
  {ticker:'DHR', name:'Danaher Corp',       sector:'Healthcare', industry:'Med Devices',         roic:6.2,  fcf:5.3,  evebitda:18.6, oplev:1.4,  revpemp:4.8,  debt:2.2,  peg:2.4},
  {ticker:'HCA', name:'HCA Healthcare',     sector:'Healthcare', industry:'Hospital Systems',    roic:9.4,  fcf:7.2,  evebitda:9.4,  oplev:2.1,  revpemp:6.8,  debt:3.2,  peg:1.1},
  {ticker:'WMT', name:'Walmart',            sector:'Consumer',   industry:'Retail',              roic:5.4,  fcf:2.1,  evebitda:14.8, oplev:0.6,  revpemp:4.2,  debt:1.2,  peg:3.4},
  {ticker:'COST',name:'Costco',             sector:'Consumer',   industry:'Retail',              roic:8.2,  fcf:2.8,  evebitda:22.4, oplev:1.2,  revpemp:5.1,  debt:0.2,  peg:3.1},
  {ticker:'TGT', name:'Target Corp',        sector:'Consumer',   industry:'Retail',              roic:3.4,  fcf:4.6,  evebitda:7.4,  oplev:-0.4, revpemp:1.2,  debt:1.8,  peg:1.4},
  {ticker:'PG',  name:'Procter & Gamble',   sector:'Consumer',   industry:'Staples',             roic:7.6,  fcf:4.4,  evebitda:16.2, oplev:0.4,  revpemp:2.8,  debt:2.1,  peg:2.8},
  {ticker:'KO',  name:'Coca-Cola',          sector:'Consumer',   industry:'Beverages',           roic:6.4,  fcf:5.8,  evebitda:20.4, oplev:0.8,  revpemp:3.4,  debt:2.8,  peg:3.2},
  {ticker:'PEP', name:'PepsiCo',            sector:'Consumer',   industry:'Beverages',           roic:5.8,  fcf:4.9,  evebitda:14.8, oplev:0.4,  revpemp:2.4,  debt:2.6,  peg:2.4},
  {ticker:'MCD', name:"McDonald's",         sector:'Consumer',   industry:'Restaurants',         roic:11.4, fcf:5.6,  evebitda:17.8, oplev:1.4,  revpemp:8.6,  debt:5.4,  peg:2.6},
  {ticker:'SBUX',name:'Starbucks',          sector:'Consumer',   industry:'Restaurants',         roic:4.8,  fcf:3.2,  evebitda:15.6, oplev:-0.6, revpemp:0.8,  debt:6.8,  peg:2.2},
  {ticker:'MAR', name:'Marriott Intl',      sector:'Consumer',   industry:'Hospitality',         roic:9.8,  fcf:4.1,  evebitda:16.4, oplev:2.4,  revpemp:7.8,  debt:4.8,  peg:2.2},
  {ticker:'HLT', name:'Hilton Worldwide',   sector:'Consumer',   industry:'Hospitality',         roic:8.6,  fcf:3.8,  evebitda:18.2, oplev:2.1,  revpemp:6.4,  debt:5.2,  peg:2.4},
  {ticker:'CAT', name:'Caterpillar',        sector:'Industrials',industry:'Heavy Machinery',     roic:7.8,  fcf:3.4,  evebitda:14.8, oplev:1.6,  revpemp:5.8,  debt:1.4,  peg:3.2},
  {ticker:'DE',  name:'Deere & Company',    sector:'Industrials',industry:'Heavy Machinery',     roic:8.4,  fcf:2.8,  evebitda:12.6, oplev:0.8,  revpemp:4.6,  debt:2.2,  peg:2.4},
  {ticker:'EMR', name:'Emerson Electric',   sector:'Industrials',industry:'Heavy Machinery',     roic:5.4,  fcf:4.4,  evebitda:13.8, oplev:1.2,  revpemp:4.4,  debt:2.2,  peg:2.0},
  {ticker:'HON', name:'Honeywell',          sector:'Industrials',industry:'Aerospace & Defense', roic:5.6,  fcf:4.8,  evebitda:14.2, oplev:1.2,  revpemp:4.2,  debt:2.4,  peg:2.1},
  {ticker:'RTX', name:'RTX Corporation',    sector:'Industrials',industry:'Aerospace & Defense', roic:4.2,  fcf:4.6,  evebitda:13.4, oplev:1.1,  revpemp:3.8,  debt:2.6,  peg:1.9},
  {ticker:'LMT', name:'Lockheed Martin',    sector:'Industrials',industry:'Aerospace & Defense', roic:6.8,  fcf:6.2,  evebitda:11.4, oplev:1.6,  revpemp:5.4,  debt:1.8,  peg:1.6},
  {ticker:'GE',  name:'GE Aerospace',       sector:'Industrials',industry:'Aerospace & Defense', roic:8.2,  fcf:5.8,  evebitda:18.4, oplev:3.4,  revpemp:9.2,  debt:0.4,  peg:1.8},
  {ticker:'UNP', name:'Union Pacific',      sector:'Industrials',industry:'Rail & Freight',      roic:6.2,  fcf:5.4,  evebitda:12.8, oplev:1.4,  revpemp:5.1,  debt:2.8,  peg:2.0},
  {ticker:'CSX', name:'CSX Corporation',    sector:'Industrials',industry:'Rail & Freight',      roic:7.4,  fcf:5.8,  evebitda:11.2, oplev:1.8,  revpemp:6.2,  debt:2.4,  peg:1.7},
  {ticker:'NSC', name:'Norfolk Southern',   sector:'Industrials',industry:'Rail & Freight',      roic:5.8,  fcf:5.2,  evebitda:11.8, oplev:1.4,  revpemp:5.8,  debt:2.6,  peg:1.8},
  {ticker:'XOM', name:'ExxonMobil',         sector:'Energy',     industry:'Oil & Gas',           roic:4.8,  fcf:6.4,  evebitda:8.4,  oplev:1.2,  revpemp:8.4,  debt:0.8,  peg:1.4},
  {ticker:'CVX', name:'Chevron',            sector:'Energy',     industry:'Oil & Gas',           roic:3.6,  fcf:5.8,  evebitda:7.8,  oplev:0.8,  revpemp:6.2,  debt:1.2,  peg:1.6},
  {ticker:'COP', name:'ConocoPhillips',     sector:'Energy',     industry:'Oil & Gas',           roic:5.4,  fcf:7.2,  evebitda:7.2,  oplev:1.6,  revpemp:9.4,  debt:0.6,  peg:1.2},
  {ticker:'EOG', name:'EOG Resources',      sector:'Energy',     industry:'Oil & Gas',           roic:6.8,  fcf:8.4,  evebitda:6.4,  oplev:2.2,  revpemp:10.4, debt:0.3,  peg:1.1},
  {ticker:'SLB', name:'SLB',               sector:'Energy',     industry:'Oil Services',        roic:4.2,  fcf:5.4,  evebitda:9.4,  oplev:1.8,  revpemp:6.8,  debt:1.4,  peg:1.5},
  {ticker:'PSX', name:'Phillips 66',        sector:'Energy',     industry:'Oil Services',        roic:4.4,  fcf:6.2,  evebitda:7.6,  oplev:1.1,  revpemp:7.2,  debt:1.4,  peg:1.3},
  {ticker:'VLO', name:'Valero Energy',      sector:'Energy',     industry:'Oil Services',        roic:5.2,  fcf:7.4,  evebitda:6.8,  oplev:1.4,  revpemp:8.8,  debt:0.9,  peg:1.2},
  {ticker:'NEE', name:'NextEra Energy',     sector:'Energy',     industry:'Utilities',           roic:2.4,  fcf:1.8,  evebitda:14.8, oplev:0.6,  revpemp:3.4,  debt:5.8,  peg:2.4},
  {ticker:'SO',  name:'Southern Company',   sector:'Energy',     industry:'Utilities',           roic:1.8,  fcf:1.4,  evebitda:11.8, oplev:0.4,  revpemp:2.4,  debt:6.4,  peg:3.2},
  {ticker:'DUK', name:'Duke Energy',        sector:'Energy',     industry:'Utilities',           roic:1.6,  fcf:1.2,  evebitda:12.4, oplev:0.2,  revpemp:1.8,  debt:7.2,  peg:3.6},
  // ── NEW 50: EXPANSION TO 100 ──────────────────────────────────────────────

  // FINANCIALS — Asset Management
  {ticker:'BLK', name:'BlackRock',           sector:'Financials', industry:'Asset Management',    roic:7.8,  fcf:6.2,  evebitda:16.4, oplev:3.2,  revpemp:12.4, debt:0.6,  peg:2.1},
  {ticker:'BX',  name:'Blackstone',          sector:'Financials', industry:'Asset Management',    roic:6.4,  fcf:5.8,  evebitda:18.2, oplev:2.8,  revpemp:14.2, debt:1.2,  peg:2.4},
  {ticker:'SCHW',name:'Charles Schwab',      sector:'Financials', industry:'Brokerage',           roic:4.2,  fcf:4.8,  evebitda:12.6, oplev:1.6,  revpemp:6.2,  debt:1.4,  peg:1.8},
  {ticker:'ICE', name:'ICE',                 sector:'Financials', industry:'Exchanges',           roic:6.1,  fcf:5.4,  evebitda:14.8, oplev:2.4,  revpemp:9.4,  debt:2.2,  peg:2.2},
  {ticker:'CME', name:'CME Group',           sector:'Financials', industry:'Exchanges',           roic:8.4,  fcf:7.2,  evebitda:18.6, oplev:2.8,  revpemp:11.8, debt:0.8,  peg:2.6},
  {ticker:'V',   name:'Visa Inc',            sector:'Financials', industry:'Payments',            roic:16.4, fcf:8.2,  evebitda:24.8, oplev:3.6,  revpemp:18.4, debt:0.8,  peg:2.8},
  {ticker:'MA',  name:'Mastercard',          sector:'Financials', industry:'Payments',            roic:18.2, fcf:8.6,  evebitda:26.4, oplev:3.8,  revpemp:19.2, debt:1.0,  peg:2.9},

  // HEALTHCARE — New additions
  {ticker:'MDT', name:'Medtronic',           sector:'Healthcare', industry:'Med Devices',         roic:4.8,  fcf:5.6,  evebitda:13.2, oplev:0.8,  revpemp:3.2,  debt:2.4,  peg:2.0},
  {ticker:'SYK', name:'Stryker Corp',        sector:'Healthcare', industry:'Med Devices',         roic:7.2,  fcf:5.4,  evebitda:20.4, oplev:1.8,  revpemp:5.8,  debt:2.2,  peg:2.6},
  {ticker:'BSX', name:'Boston Scientific',   sector:'Healthcare', industry:'Med Devices',         roic:5.6,  fcf:4.2,  evebitda:22.6, oplev:2.2,  revpemp:6.4,  debt:2.8,  peg:2.4},
  {ticker:'PFE', name:'Pfizer',              sector:'Healthcare', industry:'Pharma & Biotech',    roic:3.2,  fcf:6.8,  evebitda:8.4,  oplev:-1.2, revpemp:2.4,  debt:2.6,  peg:1.2},
  {ticker:'MRK', name:'Merck & Co',          sector:'Healthcare', industry:'Pharma & Biotech',    roic:8.4,  fcf:6.4,  evebitda:12.8, oplev:2.4,  revpemp:6.8,  debt:1.6,  peg:1.4},
  {ticker:'ABBV',name:'AbbVie',              sector:'Healthcare', industry:'Pharma & Biotech',    roic:9.2,  fcf:8.4,  evebitda:14.6, oplev:2.8,  revpemp:8.2,  debt:3.2,  peg:1.6},
  {ticker:'ISRG',name:'Intuitive Surgical',  sector:'Healthcare', industry:'Med Devices',         roic:12.4, fcf:7.8,  evebitda:42.4, oplev:4.2,  revpemp:14.6, debt:0.0,  peg:2.8},
  {ticker:'MCK', name:'McKesson Corp',       sector:'Healthcare', industry:'Healthcare Distrib',  roic:11.4, fcf:6.2,  evebitda:10.4, oplev:2.6,  revpemp:9.4,  debt:1.8,  peg:1.4},

  // CONSUMER — Expanded
  {ticker:'NKE', name:'Nike Inc',            sector:'Consumer',   industry:'Apparel & Footwear',  roic:6.4,  fcf:4.8,  evebitda:16.2, oplev:0.4,  revpemp:3.8,  debt:1.4,  peg:2.2},
  {ticker:'LULU',name:'Lululemon',           sector:'Consumer',   industry:'Apparel & Footwear',  roic:14.8, fcf:6.2,  evebitda:20.4, oplev:2.4,  revpemp:8.4,  debt:0.0,  peg:2.0},
  {ticker:'HD',  name:'Home Depot',          sector:'Consumer',   industry:'Home Improvement',    roic:12.8, fcf:5.6,  evebitda:16.8, oplev:1.8,  revpemp:7.4,  debt:7.8,  peg:2.4},
  {ticker:'LOW', name:"Lowe's Companies",    sector:'Consumer',   industry:'Home Improvement',    roic:10.4, fcf:5.2,  evebitda:14.2, oplev:1.4,  revpemp:5.8,  debt:8.2,  peg:2.1},
  {ticker:'TJX', name:'TJX Companies',       sector:'Consumer',   industry:'Discount Retail',     roic:11.2, fcf:4.8,  evebitda:14.8, oplev:1.6,  revpemp:5.2,  debt:1.2,  peg:2.4},
  {ticker:'BKNG',name:'Booking Holdings',    sector:'Consumer',   industry:'Travel & Leisure',    roic:14.6, fcf:8.4,  evebitda:16.2, oplev:3.2,  revpemp:14.8, debt:2.4,  peg:1.8},
  {ticker:'HUM', name:'Humana',              sector:'Healthcare', industry:'Managed Care',        roic:3.8,  fcf:4.2,  evebitda:8.6,  oplev:-0.4, revpemp:2.6,  debt:2.2,  peg:1.4},

  // INDUSTRIALS — Expanded
  {ticker:'BA',  name:'Boeing',              sector:'Industrials',industry:'Aerospace & Defense', roic:-2.4, fcf:-1.8, evebitda:28.4, oplev:-4.2, revpemp:-1.8, debt:12.4, peg:4.8},
  {ticker:'NOC', name:'Northrop Grumman',    sector:'Industrials',industry:'Aerospace & Defense', roic:5.8,  fcf:5.4,  evebitda:12.8, oplev:1.4,  revpemp:5.2,  debt:2.6,  peg:1.8},
  {ticker:'GD',  name:'General Dynamics',    sector:'Industrials',industry:'Aerospace & Defense', roic:6.4,  fcf:5.8,  evebitda:13.2, oplev:1.6,  revpemp:5.8,  debt:1.8,  peg:1.9},
  {ticker:'ITW', name:'Illinois Tool Works', sector:'Industrials',industry:'Diversified Industrials', roic:9.8, fcf:6.4, evebitda:16.4, oplev:2.2, revpemp:7.4,  debt:2.8,  peg:2.4},
  {ticker:'ETN', name:'Eaton Corp',          sector:'Industrials',industry:'Power Management',    roic:8.4,  fcf:5.8,  evebitda:18.6, oplev:3.4,  revpemp:8.6,  debt:1.6,  peg:2.6},
  {ticker:'AME', name:'AMETEK Inc',          sector:'Industrials',industry:'Electronic Instruments', roic:7.8, fcf:6.2, evebitda:18.2, oplev:2.4, revpemp:6.8,  debt:1.8,  peg:2.4},
  {ticker:'PWR', name:'Quanta Services',     sector:'Industrials',industry:'Construction & Eng',  roic:7.2,  fcf:4.8,  evebitda:16.8, oplev:2.8,  revpemp:6.4,  debt:1.6,  peg:1.8},
  {ticker:'VRSK',name:'Verisk Analytics',    sector:'Industrials',industry:'Data & Analytics',    roic:9.4,  fcf:7.8,  evebitda:22.4, oplev:3.8,  revpemp:12.4, debt:2.4,  peg:3.0},
  {ticker:'FAST',name:'Fastenal Company',    sector:'Industrials',industry:'Distribution',        roic:7.8,  fcf:5.2,  evebitda:20.4, oplev:1.8,  revpemp:6.2,  debt:0.4,  peg:3.2},

  // ENERGY — Midstream & Power
  {ticker:'OKE', name:'ONEOK Inc',           sector:'Energy',     industry:'Midstream',           roic:5.4,  fcf:6.4,  evebitda:11.8, oplev:1.6,  revpemp:7.8,  debt:3.8,  peg:2.2},
  {ticker:'KMI', name:'Kinder Morgan',       sector:'Energy',     industry:'Midstream',           roic:3.8,  fcf:7.2,  evebitda:10.4, oplev:0.8,  revpemp:5.4,  debt:4.2,  peg:2.8},
  {ticker:'WMB', name:'Williams Companies',  sector:'Energy',     industry:'Midstream',           roic:4.2,  fcf:6.8,  evebitda:10.8, oplev:1.2,  revpemp:6.4,  debt:3.6,  peg:2.4},
  {ticker:'VST', name:'Vistra Corp',         sector:'Energy',     industry:'Power Generation',    roic:8.4,  fcf:7.8,  evebitda:9.4,  oplev:3.2,  revpemp:8.8,  debt:3.4,  peg:1.2},
  {ticker:'CEG', name:'Constellation Energy',sector:'Energy',     industry:'Nuclear Power',       roic:7.2,  fcf:6.4,  evebitda:10.8, oplev:4.2,  revpemp:9.4,  debt:1.8,  peg:1.4},
  {ticker:'AEP', name:'American Elec Power', sector:'Energy',     industry:'Utilities',           roic:2.2,  fcf:1.6,  evebitda:11.2, oplev:0.6,  revpemp:2.8,  debt:5.8,  peg:2.8},

  // REAL ESTATE — Data Centers (AI infrastructure)
  {ticker:'AMT', name:'American Tower',      sector:'Real Estate',industry:'Cell Tower REITs',    roic:3.8,  fcf:5.2,  evebitda:18.4, oplev:1.2,  revpemp:6.8,  debt:5.8,  peg:2.4},
  {ticker:'EQIX',name:'Equinix',             sector:'Real Estate',industry:'Data Center REITs',   roic:3.2,  fcf:4.8,  evebitda:20.4, oplev:2.4,  revpemp:8.4,  debt:6.2,  peg:2.8},
  {ticker:'DLR', name:'Digital Realty',      sector:'Real Estate',industry:'Data Center REITs',   roic:2.8,  fcf:4.4,  evebitda:18.6, oplev:2.0,  revpemp:7.6,  debt:6.8,  peg:2.6},
  {ticker:'PLD', name:'Prologis',            sector:'Real Estate',industry:'Industrial REITs',    roic:4.2,  fcf:4.8,  evebitda:22.4, oplev:1.4,  revpemp:6.2,  debt:4.8,  peg:3.2},

  // COMMUNICATION SERVICES (non-tech angle)
  {ticker:'T',   name:'AT&T',                sector:'Telecom',    industry:'Wireless',            roic:2.8,  fcf:7.8,  evebitda:7.4,  oplev:0.6,  revpemp:2.4,  debt:5.2,  peg:1.2},
  {ticker:'VZ',  name:'Verizon',             sector:'Telecom',    industry:'Wireless',            roic:2.4,  fcf:7.2,  evebitda:7.8,  oplev:0.4,  revpemp:2.8,  debt:5.6,  peg:1.4},
  {ticker:'CMCSA',name:'Comcast',            sector:'Telecom',    industry:'Cable & Broadband',   roic:5.8,  fcf:7.4,  evebitda:8.6,  oplev:1.2,  revpemp:4.4,  debt:3.8,  peg:1.2},
  {ticker:'DIS', name:'Walt Disney',         sector:'Consumer',   industry:'Media & Entertainment',roic:3.4, fcf:4.8,  evebitda:14.2, oplev:1.8,  revpemp:3.8,  debt:2.4,  peg:2.2},

  // MATERIALS & SPECIALTY
  {ticker:'LIN', name:'Linde plc',           sector:'Materials',  industry:'Industrial Gases',    roic:8.4,  fcf:6.2,  evebitda:18.4, oplev:1.8,  revpemp:7.4,  debt:1.4,  peg:2.8},
  {ticker:'SHW', name:'Sherwin-Williams',    sector:'Materials',  industry:'Paints & Coatings',   roic:9.8,  fcf:5.8,  evebitda:16.4, oplev:2.4,  revpemp:6.8,  debt:3.4,  peg:2.6},
  {ticker:'ECL', name:'Ecolab',              sector:'Materials',  industry:'Specialty Chemicals',  roic:7.2,  fcf:5.4,  evebitda:18.6, oplev:2.0,  revpemp:5.8,  debt:2.2,  peg:2.8},
  {ticker:'NEM', name:'Newmont Corp',        sector:'Materials',  industry:'Gold Mining',         roic:3.2,  fcf:5.6,  evebitda:9.4,  oplev:1.2,  revpemp:4.2,  debt:1.8,  peg:1.6},
  {ticker:'FDX', name:'FedEx Corp',           sector:'Industrials',industry:'Logistics & Delivery',  roic:5.8,  fcf:5.4,  evebitda:8.4,  oplev:2.4,  revpemp:4.8,  debt:2.2,  peg:1.4},
]

export const SECTOR_COLORS = {
  Financials:  '#4f9cf9',
  Healthcare:  '#22c97a',
  Consumer:    '#f5a623',
  Industrials: '#a78bfa',
  Energy:      '#2dd4bf',
  'Real Estate': '#f472b6',
  Telecom:     '#94a3b8',
  Materials:   '#fb923c',
}

export function scoreMetric(val, metric) {
  const inverted = ['evebitda','debt','peg']
  const rules = {
    roic:    [6,4,2,0],
    fcf:     [6,4,2.5,1.5],
    evebitda:[8,12,16,22],
    oplev:   [2,1,0,-0.5],
    revpemp: [7,4,2,0],
    debt:    [1.5,2.5,3.5,5],
    peg:     [1.0,1.5,2.0,2.8],
  }
  const r = rules[metric]
  if (!r) return 3
  if (inverted.includes(metric)) {
    if (val < r[0]) return 5
    if (val < r[1]) return 4
    if (val < r[2]) return 3
    if (val < r[3]) return 2
    return 1
  } else {
    if (val > r[0]) return 5
    if (val > r[1]) return 4
    if (val > r[2]) return 3
    if (val > r[3]) return 2
    return 1
  }
}

export function totalScore(c) {
  const weights = {roic:2, fcf:1.5, evebitda:1, oplev:1, revpemp:1, debt:1.5, peg:1}
  let total = 0, wsum = 0
  for (const [k,w] of Object.entries(weights)) {
    total += scoreMetric(c[k], k) * w
    wsum += w
  }
  return Math.round(total / wsum)
}

export const COMPANIES_SCORED = COMPANIES.map(c => ({ ...c, score: totalScore(c) }))

export function groupByIndustry(companies) {
  return companies.reduce((acc, c) => {
    if (!acc[c.industry]) acc[c.industry] = []
    acc[c.industry].push(c)
    return acc
  }, {})
}

export function groupBySector(companies) {
  return companies.reduce((acc, c) => {
    if (!acc[c.sector]) acc[c.sector] = []
    acc[c.sector].push(c)
    return acc
  }, {})
}
