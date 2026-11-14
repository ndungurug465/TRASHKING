export type PlatformId =
  | 'alibaba'
  | 'pinduoduo'
  | 'aliexpress'
  | 'amazon';

export type CategoryId =
  | 'all'
  | 'tech'
  | 'home'
  | 'carry'
  | 'lighting';

export interface PriceTier {
  minQty: number;
  label: string;
  unitPrice: number;
}

export interface WholesaleLot {
  id: string;
  sku: string;
  title: string;
  platform: PlatformId;
  platformLabel: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  factoryHub: string;
  leadTimeDays: string;
  moq: number;
  unitPriceMin: number;
  unitPriceMax: number;
  msrp: number;
  affiliateRatePct: number;
  marginPct: number;
  stockNote: string;
  image: string;
  imageAlt: string;
  summary: string;
  compliance: string;
  weightKg: number;
  cartonUnits: number;
  sourceUrlSample: string;
  affiliateUrl?: string;
  isCustom?: boolean;
  tiers: PriceTier[];
}

export function resolveAffiliateUrl(lot: WholesaleLot, partnerCode: string): string {
  const raw = (lot.affiliateUrl || lot.sourceUrlSample).trim();
  if (!raw) return '#';
  // If the owner pasted a custom affiliate link with tracking parameters already, preserve it directly
  if (lot.affiliateUrl && (raw.includes('?') || raw.includes('aff') || raw.includes('tag=') || raw.includes('ref='))) {
    return raw;
  }
  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}aff_agent=${encodeURIComponent(partnerCode || 'AGENT-842')}`;
}

export interface PlatformProfile {
  id: PlatformId;
  name: string;
  role: string;
  typicalMoq: string;
  commissionRange: string;
  settlementWindow: string;
  consolidationHub: string;
  qcProtocol: string;
  bestFor: string;
}

export const HERO_LOGISTICS_IMAGE = {
  src: '/src/assets/images/hero_wholesale_logistics_1794635326564.jpg',
  alt: 'Cross-border wholesale fulfillment and quality inspection center with stacked export cartons and inspection workbench',
};

export const TRADE_METRICS = [
  {
    value: '4.5%–9.5%',
    label: 'Affiliate Agent Commission',
    context: 'Paid on verified wholesale GMV',
  },
  {
    value: '48 hr',
    label: 'Factory QC & Photo Audit',
    context: 'Before international dispatch',
  },
  {
    value: '4 Platforms',
    label: 'Unified Sourcing Desk',
    context: 'Alibaba B2B · Pinduoduo · AliExpress · Amazon',
  },
  {
    value: '$4.2M+',
    label: 'Quarterly Wholesale Volume',
    context: 'Across 16 DDP air & sea lanes',
  },
];

export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: 'alibaba',
    name: 'Alibaba B2B',
    role: 'Direct Factory OEM / ODM Lots',
    typicalMoq: '50 – 500 units',
    commissionRange: '6.0% – 9.5%',
    settlementWindow: 'Net-15 post-inspection',
    consolidationHub: 'Shenzhen & Ningbo Warehouses',
    qcProtocol: 'AQL 2.5 pre-shipment carton & drop test',
    bestFor: 'Private-label electronics, custom packaging, and repeat container restocks.',
  },
  {
    id: 'pinduoduo',
    name: 'Pinduoduo Wholesale',
    role: 'Domestic Factory-Direct Group Lots',
    typicalMoq: '20 – 100 units',
    commissionRange: '5.5% – 8.0%',
    settlementWindow: 'Net-10 upon hub arrival',
    consolidationHub: 'Yiwu & Guangzhou Sorting Hubs',
    qcProtocol: 'Unit-level barcode count & packaging re-boxing',
    bestFor: 'High-velocity household goods, drinkware, and rapid test batches below standard export MOQ.',
  },
  {
    id: 'aliexpress',
    name: 'AliExpress Direct',
    role: 'Micro-Wholesale & Split-SKU Packs',
    typicalMoq: '10 – 50 units',
    commissionRange: '7.0% – 9.0%',
    settlementWindow: 'Net-7 on cleared tracking',
    consolidationHub: 'Hangzhou Export Consolidation',
    qcProtocol: 'Label verification & customs HS-code prep',
    bestFor: 'Boutique store testing, affiliate storefront bundles, and fast air-parcel replenishment.',
  },
  {
    id: 'amazon',
    name: 'Amazon Wholesale',
    role: 'Brand-Authorized Overstock & FBA Pallets',
    typicalMoq: '25 – 200 units',
    commissionRange: '4.5% – 6.5%',
    settlementWindow: 'Net-14 on manifest sign-off',
    consolidationHub: 'Seattle & Rotterdam FBA Prep Hubs',
    qcProtocol: 'FNSKU relabeling, polybagging & invoice audit',
    bestFor: 'Compliant North American/EU retail arbitrage, FBA prep, and rapid domestic turnover.',
  },
];

export const WHOLESALE_LOTS: WholesaleLot[] = [
  {
    id: 'gan-140w-station',
    sku: 'MT-EL-140',
    title: '140W GaN 4-Port Desktop Power Station & 100W Braided Cable',
    platform: 'alibaba',
    platformLabel: 'Alibaba B2B',
    category: 'tech',
    categoryLabel: 'Consumer Tech',
    factoryHub: 'Shenzhen, CN',
    leadTimeDays: '7–10 days',
    moq: 50,
    unitPriceMin: 11.40,
    unitPriceMax: 14.80,
    msrp: 49.99,
    affiliateRatePct: 8.5,
    marginPct: 71,
    stockNote: 'Ready to ship',
    image: '/src/assets/images/prod_gan_charger_1794635327271.jpg',
    imageAlt: 'Matte graphite 140W GaN multi-port USB-C charger with coiled braided cable on stone surface',
    summary:
      'UL/CE/FCC certified GaN III desktop charger with three PD 3.1 USB-C ports and one USB-A port, shipped with anodized aluminum cable straps.',
    compliance: 'UL 62368-1 · CE · FCC · RoHS',
    weightKg: 0.34,
    cartonUnits: 40,
    sourceUrlSample: 'https://www.alibaba.com/product-detail/140w-gan-desktop-charger-oem_mt140',
    tiers: [
      { minQty: 50, label: '50–199 units', unitPrice: 14.80 },
      { minQty: 200, label: '200–499 units', unitPrice: 12.90 },
      { minQty: 500, label: '500+ units', unitPrice: 11.40 },
    ],
  },
  {
    id: 'espresso-micro-scale',
    sku: 'MT-HM-208',
    title: 'Anodized Digital Espresso & Pour-Over Scale (0.1 g Precision)',
    platform: 'pinduoduo',
    platformLabel: 'Pinduoduo',
    category: 'home',
    categoryLabel: 'Home & Kitchen',
    factoryHub: 'Yiwu, CN',
    leadTimeDays: '5–8 days',
    moq: 30,
    unitPriceMin: 8.60,
    unitPriceMax: 11.20,
    msrp: 38.00,
    affiliateRatePct: 7.5,
    marginPct: 68,
    stockNote: 'Ready to ship',
    image: '/src/assets/images/prod_espresso_scale_1794635326197.jpg',
    imageAlt: 'Matte black anodized aluminum precision digital coffee scale with white numeric LED display',
    summary:
      'USB-C rechargeable espresso scale with auto-tare timer, waterproof silicone mat, and high-contrast hidden LED readout sourced via Pinduoduo factory group lots.',
    compliance: 'CE · RoHS · UN38.3 Battery Cert',
    weightKg: 0.42,
    cartonUnits: 30,
    sourceUrlSample: 'https://mobile.yangkeduo.com/goods.html?goods_id=88492014',
    tiers: [
      { minQty: 30, label: '30–99 units', unitPrice: 11.20 },
      { minQty: 100, label: '100–299 units', unitPrice: 9.75 },
      { minQty: 300, label: '300+ units', unitPrice: 8.60 },
    ],
  },
  {
    id: 'waxed-canvas-carryall',
    sku: 'MT-CR-312',
    title: '18oz Waxed Canvas & Full-Grain Leather Commuter Tote',
    platform: 'alibaba',
    platformLabel: 'Alibaba B2B',
    category: 'carry',
    categoryLabel: 'Carry & Apparel',
    factoryHub: 'Guangzhou, CN',
    leadTimeDays: '10–14 days',
    moq: 40,
    unitPriceMin: 13.50,
    unitPriceMax: 17.90,
    msrp: 68.00,
    affiliateRatePct: 9.0,
    marginPct: 74,
    stockNote: 'Custom logo ready',
    image: '/src/assets/images/prod_linen_tote_1794635327442.jpg',
    imageAlt: 'Structured slate-grey waxed canvas and brown leather commuter tote bag on stone plinth',
    summary:
      'Water-repellent waxed cotton canvas carryall with brass hardware, padded 16-inch laptop sleeve, and debossed leather patch ready for private-label branding.',
    compliance: 'REACH Dye Compliant · OEKO-TEX',
    weightKg: 0.78,
    cartonUnits: 20,
    sourceUrlSample: 'https://www.alibaba.com/product-detail/waxed-canvas-leather-tote_mt312',
    tiers: [
      { minQty: 40, label: '40–149 units', unitPrice: 17.90 },
      { minQty: 150, label: '150–399 units', unitPrice: 15.20 },
      { minQty: 400, label: '400+ units', unitPrice: 13.50 },
    ],
  },
  {
    id: 'aluminum-mist-diffuser',
    sku: 'MT-HM-419',
    title: 'Brushed Aluminum & Ceramic Ultrasonic Aroma Diffuser (300 ml)',
    platform: 'aliexpress',
    platformLabel: 'AliExpress',
    category: 'home',
    categoryLabel: 'Home & Kitchen',
    factoryHub: 'Ningbo, CN',
    leadTimeDays: '4–7 days',
    moq: 20,
    unitPriceMin: 9.20,
    unitPriceMax: 12.10,
    msrp: 42.00,
    affiliateRatePct: 8.0,
    marginPct: 70,
    stockNote: 'Low MOQ trial lot',
    image: '/src/assets/images/prod_smart_diffuser_1794635327796.jpg',
    imageAlt: 'Cylindrical brushed aluminum and matte ceramic ultrasonic aroma diffuser releasing fine mist',
    summary:
      'Whisper-quiet 2.4 MHz ultrasonic transducer housed in brushed alloy and matte stoneware ceramic, pre-packed in retail-ready minimalist kraft cartons.',
    compliance: 'CE · UKCA · FCC · UL Adapter',
    weightKg: 0.56,
    cartonUnits: 24,
    sourceUrlSample: 'https://www.aliexpress.com/item/1005007841209.html',
    tiers: [
      { minQty: 20, label: '20–79 units', unitPrice: 12.10 },
      { minQty: 80, label: '80–249 units', unitPrice: 10.40 },
      { minQty: 250, label: '250+ units', unitPrice: 9.20 },
    ],
  },
  {
    id: 'articulated-led-lamp',
    sku: 'MT-LT-504',
    title: 'Machined Aluminum Articulated LED Task Lamp (CRI 95+)',
    platform: 'amazon',
    platformLabel: 'Amazon Wholesale',
    category: 'lighting',
    categoryLabel: 'Workspace Lighting',
    factoryHub: 'Seattle Hub, US',
    leadTimeDays: '3–5 days',
    moq: 25,
    unitPriceMin: 21.50,
    unitPriceMax: 26.80,
    msrp: 89.00,
    affiliateRatePct: 6.0,
    marginPct: 69,
    stockNote: 'Domestic US pallet',
    image: '/src/assets/images/prod_ergo_lamp_1794635327665.jpg',
    imageAlt: 'Matte black anodized aluminum articulated LED desk lamp with rotary dimmer dial',
    summary:
      'Authorized wholesale pallet lot of high-CRI architectural desk lamps featuring stepless rotary dimming (2700K–5000K) and weighted cast base.',
    compliance: 'UL Listed · Energy Star · FCC',
    weightKg: 1.85,
    cartonUnits: 8,
    sourceUrlSample: 'https://www.amazon.com/dp/B0CLAMP504',
    tiers: [
      { minQty: 25, label: '25–74 units', unitPrice: 26.80 },
      { minQty: 75, label: '75–199 units', unitPrice: 23.90 },
      { minQty: 200, label: '200+ units', unitPrice: 21.50 },
    ],
  },
  {
    id: 'insulated-tumbler-trio',
    sku: 'MT-HM-615',
    title: 'Double-Wall 18/8 Vacuum Travel Tumbler (16 oz Powder-Coated)',
    platform: 'pinduoduo',
    platformLabel: 'Pinduoduo',
    category: 'home',
    categoryLabel: 'Home & Kitchen',
    factoryHub: 'Yongkang, CN',
    leadTimeDays: '5–8 days',
    moq: 60,
    unitPriceMin: 3.15,
    unitPriceMax: 4.40,
    msrp: 22.00,
    affiliateRatePct: 7.0,
    marginPct: 76,
    stockNote: '3 colorways mixed',
    image: '/src/assets/images/prod_vacuum_tumbler_1794635328059.jpg',
    imageAlt: 'Three matte powder-coated stainless steel tumblers in navy, white, and slate grey',
    summary:
      'Food-grade 304 stainless steel double-wall insulated tumblers with leak-resistant slide lids, sourced directly from Yongkang drinkware factories.',
    compliance: 'FDA Food Contact · LFGB · BPA-Free',
    weightKg: 0.29,
    cartonUnits: 50,
    sourceUrlSample: 'https://mobile.yangkeduo.com/goods.html?goods_id=91024877',
    tiers: [
      { minQty: 60, label: '60–299 units', unitPrice: 4.40 },
      { minQty: 300, label: '300–999 units', unitPrice: 3.70 },
      { minQty: 1000, label: '1,000+ units', unitPrice: 3.15 },
    ],
  },
];

export const PARTNER_TESTIMONIALS = [
  {
    quote:
      'Consolidating Pinduoduo factory trials with our Alibaba restocks through one Shenzhen desk cut our air-freight fees by 28%, and our affiliate partner referrals now cover 40% of our own inventory spend.',
    author: 'Nadia Tan',
    role: 'Head of Merchandising',
    organization: 'Northport Home Goods (Seattle)',
  },
  {
    quote:
      'Every creator in our sourcing network gets an exact lot tracking link with transparent MOQ pricing. Payouts clear automatically once the Yiwu QC photos are signed off.',
    author: 'David Okafor',
    role: 'Managing Partner',
    organization: 'Bridgeway Commerce Collective',
  },
];
