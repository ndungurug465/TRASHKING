import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { WHOLESALE_LOTS, type WholesaleLot } from '../data/wholesaleData';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'USD — US Dollar ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR — Euro (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound (£)', symbol: '£' },
  { code: 'CAD', label: 'CAD — Canadian Dollar (CA$)', symbol: 'CA$' },
];

const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
};

export interface CalculatorTransferPayload {
  lot: WholesaleLot;
  quantity: number;
  shippingLane: string;
  landedUnitCost: number;
  estimatedCommission: number;
}

interface WholesaleCalculatorProps {
  partnerCode: string;
  onAddLotToManifest: (lot: WholesaleLot, quantity: number) => void;
  onRequestCustomDesk: (summaryNote: string) => void;
}

const SHIPPING_LANES = [
  { id: 'air-ddp', label: 'Air Express DDP (6–9 days)', ratePerKg: 5.80, dutyPct: 0.08 },
  { id: 'sea-lcl', label: 'Sea LCL Consolidated (22–28 days)', ratePerKg: 1.45, dutyPct: 0.06 },
  { id: 'fba-prep', label: 'Amazon FBA Prep + Sea (15–20 days)', ratePerKg: 2.35, dutyPct: 0.07 },
];

const PARTNER_TIERS = [
  { id: 'standard', label: 'Standard Affiliate (5.5%)', rateBoost: 0 },
  { id: 'broker', label: 'Verified Broker (7.5%)', rateBoost: 1.5 },
  { id: 'agency', label: 'Volume Agency (9.5%)', rateBoost: 2.5 },
];

export function getTierUnitPrice(lot: WholesaleLot, qty: number): number {
  let matched = lot.tiers[0].unitPrice;
  for (const tier of lot.tiers) {
    if (qty >= tier.minQty) {
      matched = tier.unitPrice;
    }
  }
  return matched;
}

export function WholesaleCalculator({
  partnerCode,
  onAddLotToManifest,
  onRequestCustomDesk,
}: WholesaleCalculatorProps) {
  const [selectedLotId, setSelectedLotId] = useState<string>(WHOLESALE_LOTS[0].id);
  const [quantity, setQuantity] = useState<number>(120);
  const [laneId, setLaneId] = useState<string>(SHIPPING_LANES[1].id);
  const [tierId, setTierId] = useState<string>(PARTNER_TIERS[1].id);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
  const [rateDate, setRateDate] = useState<string | null>(null);

  const fetchLiveRates = async () => {
    setRateStatus('loading');
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        date?: string;
        rates?: Partial<Record<'EUR' | 'GBP' | 'CAD', number>>;
      };
      if (data.rates && data.rates.EUR && data.rates.GBP && data.rates.CAD) {
        setRates({
          USD: 1,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP,
          CAD: data.rates.CAD,
        });
        setRateDate(data.date || null);
        setRateStatus('live');
      } else {
        throw new Error('Incomplete rate payload');
      }
    } catch {
      setRates(FALLBACK_RATES);
      setRateStatus('fallback');
    }
  };

  useEffect(() => {
    void fetchLiveRates();
  }, []);

  const activeRate = rates[currency] || 1;
  const currencyMeta = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const formatMoney = (usdAmount: number, decimals = 2) => {
    const converted = usdAmount * activeRate;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${currencyMeta.symbol}${formatted}`;
  };

  const selectedLot = useMemo(
    () => WHOLESALE_LOTS.find((l) => l.id === selectedLotId) || WHOLESALE_LOTS[0],
    [selectedLotId],
  );

  const lane = useMemo(
    () => SHIPPING_LANES.find((l) => l.id === laneId) || SHIPPING_LANES[0],
    [laneId],
  );

  const partnerTier = useMemo(
    () => PARTNER_TIERS.find((t) => t.id === tierId) || PARTNER_TIERS[0],
    [tierId],
  );

  const handleLotChange = (lotId: string) => {
    setSelectedLotId(lotId);
    const nextLot = WHOLESALE_LOTS.find((l) => l.id === lotId);
    if (nextLot) {
      setQuantity(Math.max(nextLot.moq, 100));
    }
  };

  const calculation = useMemo(() => {
    const effectiveQty = Math.max(selectedLot.moq, quantity);
    const unitPrice = getTierUnitPrice(selectedLot, effectiveQty);
    const factorySubtotal = unitPrice * effectiveQty;
    const agentQcFee = factorySubtotal * 0.035;
    const totalWeightKg = selectedLot.weightKg * effectiveQty;
    const freightCost = totalWeightKg * lane.ratePerKg;
    const customsDuty = factorySubtotal * lane.dutyPct;
    const totalLanded = factorySubtotal + agentQcFee + freightCost + customsDuty;
    const landedPerUnit = totalLanded / effectiveQty;

    const grossRetailRevenue = selectedLot.msrp * effectiveQty;
    const projectedProfit = grossRetailRevenue - totalLanded;
    const netMarginPct = Math.round((projectedProfit / grossRetailRevenue) * 100);

    const effectiveAffiliatePct = Math.min(
      11.5,
      selectedLot.affiliateRatePct + partnerTier.rateBoost,
    );
    const affiliatePayout = factorySubtotal * (effectiveAffiliatePct / 100);

    return {
      effectiveQty,
      unitPrice,
      factorySubtotal,
      agentQcFee,
      freightCost,
      customsDuty,
      totalLanded,
      landedPerUnit,
      projectedProfit,
      netMarginPct,
      effectiveAffiliatePct,
      affiliatePayout,
    };
  }, [selectedLot, quantity, lane, partnerTier]);

  const affiliateUrl = `https://meridiantrade.example/lot/${selectedLot.sku}?ref=${encodeURIComponent(
    partnerCode || 'AGENT-01',
  )}&qty=${calculation.effectiveQty}`;

  const handleCopyAffiliate = async () => {
    try {
      await navigator.clipboard.writeText(affiliateUrl);
    } catch {
      // Clipboard fallback in restricted iframes
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs font-semibold text-[#1D4ED8]">
            Landed Cost & Commission Estimator
          </p>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-[#0F172A]">
            Model factory tiers, DDP freight, and affiliate payouts
          </h3>
          <p className="text-sm text-[#475569] leading-relaxed">
            Compare wholesale volume price breaks across our four partner platforms, calculate door-to-door landed unit cost, and preview exact affiliate agent commissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="w-full sm:w-72 space-y-1.5">
            <label htmlFor="calc-lot-select" className="block text-xs font-medium text-[#0F172A]">
              Select Catalog Lot
            </label>
            <select
              id="calc-lot-select"
              value={selectedLot.id}
              onChange={(e) => handleLotChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
            >
              {WHOLESALE_LOTS.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.platformLabel} · {lot.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-52 space-y-1.5">
            <label htmlFor="calc-currency-select" className="block text-xs font-medium text-[#0F172A]">
              Display Currency
            </label>
            <select
              id="calc-currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="calc-qty-slider" className="font-medium text-[#0F172A]">
                Order Quantity (MOQ {selectedLot.moq})
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                {calculation.effectiveQty.toLocaleString()} units
              </span>
            </div>
            <input
              id="calc-qty-slider"
              type="range"
              min={selectedLot.moq}
              max={1000}
              step={10}
              value={calculation.effectiveQty}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="trade-slider w-full"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedLot.tiers.map((tier) => {
                const isCurrent = calculation.unitPrice === tier.unitPrice;
                return (
                  <button
                    key={tier.minQty}
                    type="button"
                    onClick={() => setQuantity(tier.minQty)}
                    className={`px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-white border-[#1D4ED8] text-[#1D4ED8] font-medium'
                        : 'bg-white/60 border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {tier.label}: {formatMoney(tier.unitPrice)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="calc-lane-select" className="block text-sm font-medium text-[#0F172A]">
              Logistics & Customs Lane
            </label>
            <select
              id="calc-lane-select"
              value={laneId}
              onChange={(e) => setLaneId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
            >
              {SHIPPING_LANES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-[#0F172A]">
              Affiliate Agent Tier
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PARTNER_TIERS.map((tier) => {
                const active = tier.id === tierId;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setTierId(tier.id)}
                    className={`text-left px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-white border-[#1D4ED8] text-[#0F172A]'
                        : 'bg-transparent border-[#CBD5E1] text-[#475569] hover:bg-white/60'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Tabular Financial Readout */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] text-xs">
            <span className="font-mono tabular-nums text-[#475569]">
              {currency === 'USD'
                ? 'Base currency: USD'
                : rateStatus === 'loading'
                  ? 'Fetching live exchange rate...'
                  : rateStatus === 'live'
                    ? `1 USD = ${activeRate.toFixed(4)} ${currency}${rateDate ? ` · ECB rate (${rateDate})` : ''}`
                    : `1 USD = ${activeRate.toFixed(4)} ${currency} · Reference fallback rate`}
            </span>

            {currency !== 'USD' && (
              <button
                type="button"
                onClick={() => void fetchLiveRates()}
                className="inline-flex items-center gap-1 text-[#1D4ED8] hover:text-[#1E40AF] font-medium cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${rateStatus === 'loading' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Refresh rate</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-[#E2E8F0]">
            <div>
              <p className="text-xs text-[#475569]">Landed Unit Cost</p>
              <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0F172A] mt-1">
                {formatMoney(calculation.landedPerUnit)}
              </p>
              <p className="text-xs font-mono tabular-nums text-[#475569] mt-0.5">
                MSRP {formatMoney(selectedLot.msrp)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#475569]">Net Resale Margin</p>
              <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0F172A] mt-1">
                {calculation.netMarginPct}%
              </p>
              <p className="text-xs font-mono tabular-nums text-[#15803D] mt-0.5">
                +{formatMoney(Math.round(calculation.projectedProfit), 0)} est. gross
              </p>
            </div>

            <div>
              <p className="text-xs text-[#475569]">Affiliate Agent Payout</p>
              <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#1D4ED8] mt-1">
                {formatMoney(calculation.affiliatePayout)}
              </p>
              <p className="text-xs font-mono tabular-nums text-[#475569] mt-0.5">
                {calculation.effectiveAffiliatePct.toFixed(1)}% of factory GMV
              </p>
            </div>
          </div>

          {/* Itemized Ledger */}
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#475569]">
                Factory Lot ({calculation.effectiveQty} × {formatMoney(calculation.unitPrice)})
              </dt>
              <dd className="font-mono tabular-nums font-medium text-[#0F172A]">
                {formatMoney(calculation.factorySubtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#475569]">
                Meridian QC Inspection & Hub Consolidation (3.5%)
              </dt>
              <dd className="font-mono tabular-nums font-medium text-[#0F172A]">
                {formatMoney(calculation.agentQcFee)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#475569]">
                DDP Freight ({Math.round(selectedLot.weightKg * calculation.effectiveQty)} kg) & Est. Duty
              </dt>
              <dd className="font-mono tabular-nums font-medium text-[#0F172A]">
                {formatMoney(calculation.freightCost + calculation.customsDuty)}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] font-semibold">
              <dt className="text-[#0F172A]">Total Landed Dispatch Estimate ({currency})</dt>
              <dd className="font-mono tabular-nums text-[#0F172A]">
                {formatMoney(calculation.totalLanded)}
              </dd>
            </div>
          </dl>

          {/* Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleCopyAffiliate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                  <span>Partner Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Affiliate Link</span>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  onRequestCustomDesk(
                    `Lot ${selectedLot.sku} (${selectedLot.platformLabel}) · ${calculation.effectiveQty} units via ${lane.label}. Target landed cost $${calculation.landedPerUnit.toFixed(2)}/unit.`,
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#1D4ED8] hover:text-[#1E40AF] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Lock Custom Quote</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onAddLotToManifest(selectedLot, calculation.effectiveQty)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Lot to Manifest</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
