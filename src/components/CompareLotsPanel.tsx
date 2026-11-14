import { Check, ExternalLink, Plus, X } from 'lucide-react';
import { resolveAffiliateUrl, type WholesaleLot } from '../data/wholesaleData';
import { ResilientImage } from './ResilientImage';

interface CompareLotsPanelProps {
  lots: WholesaleLot[];
  partnerCode: string;
  onRemoveLot: (lotId: string) => void;
  onClearAll: () => void;
  onAddToManifest: (lot: WholesaleLot, qty: number) => void;
  onTrackClick: (lotId: string) => void;
}

export function CompareLotsPanel({
  lots,
  partnerCode,
  onRemoveLot,
  onClearAll,
  onAddToManifest,
  onTrackClick,
}: CompareLotsPanelProps) {
  if (lots.length === 0) return null;

  const lowestMoq = Math.min(...lots.map((l) => l.moq));
  const lowestUnitMin = Math.min(...lots.map((l) => l.unitPriceMin));
  const highestCommission = Math.max(...lots.map((l) => l.affiliateRatePct));

  return (
    <div
      id="compare-panel"
      className="bg-white border border-[#CBD5E1] rounded-xl overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-[#F1F5F9] border-b border-[#E2E8F0]">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#1D4ED8]">
            Side-by-Side Lot Comparison ({lots.length} of 3 selected)
          </p>
          <p className="text-xs text-[#475569]">
            {lots.length < 2
              ? 'Select at least 1 more product card below to compare MOQ, unit pricing, and affiliate payouts.'
              : 'Comparing MOQ, wholesale price range, retail margin, and affiliate commission across selected lots.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Clear Comparison
        </button>
      </div>

      {lots.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="w-48 p-4 text-xs font-semibold text-[#475569] align-top bg-[#F8FAFC]">
                  Specification
                </th>
                {lots.map((lot) => (
                  <th key={lot.id} className="p-4 align-top border-l border-[#E2E8F0]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-11 rounded-md overflow-hidden border border-[#E2E8F0] shrink-0 bg-[#F1F5F9]">
                          <ResilientImage
                            src={lot.image}
                            alt={lot.imageAlt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-[#1D4ED8] truncate">
                            {lot.platformLabel} · {lot.sku}
                          </p>
                          <p className="font-display text-sm font-semibold text-[#0F172A] line-clamp-2 mt-0.5">
                            {lot.title}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveLot(lot.id)}
                        aria-label={`Remove ${lot.title} from comparison`}
                        className="p-1 text-[#64748B] hover:text-[#DC2626] rounded-md cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Minimum Order (MOQ)
                </td>
                {lots.map((lot) => {
                  const isBest = lot.moq === lowestMoq;
                  return (
                    <td key={lot.id} className="p-4 border-l border-[#E2E8F0]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                          {lot.moq} units
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Lowest MOQ</span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Unit Price Range
                </td>
                {lots.map((lot) => {
                  const isBest = lot.unitPriceMin === lowestUnitMin;
                  return (
                    <td key={lot.id} className="p-4 border-l border-[#E2E8F0]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                          ${lot.unitPriceMin.toFixed(2)} – ${lot.unitPriceMax.toFixed(2)}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Lowest Cost</span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Affiliate Commission Rate
                </td>
                {lots.map((lot) => {
                  const isBest = lot.affiliateRatePct === highestCommission;
                  return (
                    <td key={lot.id} className="p-4 border-l border-[#E2E8F0]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                          {lot.affiliateRatePct.toFixed(1)}%
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D4ED8]">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Top Rate</span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Est. Commission / MOQ Lot
                </td>
                {lots.map((lot) => {
                  const moqSubtotal = lot.unitPriceMax * lot.moq;
                  const estComm = moqSubtotal * (lot.affiliateRatePct / 100);
                  return (
                    <td key={lot.id} className="p-4 border-l border-[#E2E8F0]">
                      <span className="font-mono tabular-nums font-medium text-[#0F172A]">
                        ${estComm.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#475569] ml-1.5">
                        (on ${moqSubtotal.toFixed(0)} lot)
                      </span>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Target Retail & Margin
                </td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-4 border-l border-[#E2E8F0] font-mono tabular-nums text-xs text-[#0F172A]">
                    ${lot.msrp.toFixed(2)} MSRP · {lot.marginPct}% gross margin
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Origin Hub & Lead Time
                </td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-4 border-l border-[#E2E8F0] text-xs text-[#475569]">
                    {lot.factoryHub} · <span className="font-mono tabular-nums text-[#0F172A]">{lot.leadTimeDays}</span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-medium text-[#475569] bg-[#F8FAFC]">
                  Actions
                </td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-4 border-l border-[#E2E8F0]">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={resolveAffiliateUrl(lot, partnerCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrackClick(lot.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <span>Order</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onAddToManifest(lot, lot.moq)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add MOQ</span>
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-3 flex items-center justify-between gap-4 bg-white">
          <span className="text-xs font-medium text-[#0F172A]">
            Selected: {lots[0].title} ({lots[0].platformLabel} · MOQ {lots[0].moq})
          </span>
          <button
            type="button"
            onClick={() => onRemoveLot(lots[0].id)}
            className="text-xs text-[#475569] hover:text-[#DC2626] cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
