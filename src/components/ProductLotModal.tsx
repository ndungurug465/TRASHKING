import { useEffect, useState } from 'react';
import { X, Check, Copy, Plus, ExternalLink } from 'lucide-react';
import { resolveAffiliateUrl, type WholesaleLot } from '../data/wholesaleData';
import { ResilientImage } from './ResilientImage';
import { getTierUnitPrice } from './WholesaleCalculator';

interface ProductLotModalProps {
  lot: WholesaleLot | null;
  partnerCode: string;
  clickCount: number;
  onClose: () => void;
  onAddToManifest: (lot: WholesaleLot, quantity: number) => void;
  onTrackClick: (lotId: string) => void;
  onUpdateAffiliateUrl: (lotId: string, nextUrl: string) => void;
}

export function ProductLotModal({
  lot,
  partnerCode,
  clickCount,
  onClose,
  onAddToManifest,
  onTrackClick,
  onUpdateAffiliateUrl,
}: ProductLotModalProps) {
  const [qty, setQty] = useState<number>(50);
  const [copied, setCopied] = useState(false);
  const [editableUrl, setEditableUrl] = useState('');
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    if (lot) {
      setQty(lot.moq);
      setCopied(false);
      setEditableUrl(lot.affiliateUrl || lot.sourceUrlSample);
      setUrlSaved(false);
    }
  }, [lot]);

  useEffect(() => {
    if (!lot) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lot, onClose]);

  if (!lot) return null;

  const activeUnitPrice = getTierUnitPrice(lot, qty);
  const subtotal = activeUnitPrice * qty;
  const estCommission = subtotal * (lot.affiliateRatePct / 100);
  const destinationUrl = resolveAffiliateUrl(lot, partnerCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(destinationUrl);
    } catch {
      // Clipboard fallback
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomUrl = () => {
    const clean = editableUrl.trim();
    if (!clean || !/^https?:\/\/.+/i.test(clean)) return;
    onUpdateAffiliateUrl(lot.id, clean);
    setUrlSaved(true);
    window.setTimeout(() => setUrlSaved(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lot-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F172A]/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
              <span className="font-medium text-[#1D4ED8]">{lot.platformLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{lot.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{lot.sku}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{clickCount} outbound clicks</span>
            </div>
            <h3
              id="lot-modal-title"
              className="font-display text-xl font-semibold text-[#0F172A] truncate mt-0.5"
            >
              {lot.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close wholesale lot details"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Gallery & Carton Spec */}
          <div className="lg:col-span-6 space-y-5">
            <div className="aspect-4/3 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white">
              <ResilientImage
                src={lot.image}
                alt={lot.imageAlt}
                fallbackTitle={lot.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-[#0F172A]">
                Factory & Export Carton Specifications
              </h4>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-[#475569]">Origin Hub</dt>
                  <dd className="font-medium text-[#0F172A] mt-0.5">{lot.factoryHub}</dd>
                </div>
                <div>
                  <dt className="text-[#475569]">Dispatch Lead Time</dt>
                  <dd className="font-medium font-mono tabular-nums text-[#0F172A] mt-0.5">
                    {lot.leadTimeDays}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#475569]">Carton Pack</dt>
                  <dd className="font-medium font-mono tabular-nums text-[#0F172A] mt-0.5">
                    {lot.cartonUnits} units · {(lot.weightKg * lot.cartonUnits).toFixed(1)} kg
                  </dd>
                </div>
                <div>
                  <dt className="text-[#475569]">Compliance</dt>
                  <dd className="font-medium text-[#0F172A] mt-0.5">{lot.compliance}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right Contiguous Purchase & Affiliate Module */}
          <div className="lg:col-span-6 space-y-5">
            <p className="text-sm text-[#475569] leading-relaxed">
              {lot.summary}
            </p>

            {/* Volume Tier Table */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#0F172A]">
                Wholesale Volume Price Tiers (Click to select)
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {lot.tiers.map((tier) => {
                  const active = activeUnitPrice === tier.unitPrice;
                  return (
                    <button
                      key={tier.minQty}
                      type="button"
                      onClick={() => setQty(tier.minQty)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-white border-[#1D4ED8]'
                          : 'bg-[#F1F5F9] border-[#E2E8F0] hover:bg-white'
                      }`}
                    >
                      <p className="text-[11px] font-mono tabular-nums text-[#475569]">
                        {tier.label}
                      </p>
                      <p className="text-base font-mono tabular-nums font-semibold text-[#0F172A] mt-1">
                        ${tier.unitPrice.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Financial Summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="modal-qty-input" className="text-xs font-medium text-[#0F172A]">
                  Order Quantity (MOQ {lot.moq})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((prev) => Math.max(lot.moq, prev - 10))}
                    className="w-8 h-8 rounded-md border border-[#CBD5E1] text-sm font-medium hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    id="modal-qty-input"
                    type="number"
                    min={lot.moq}
                    step={5}
                    value={qty}
                    onChange={(e) => setQty(Math.max(lot.moq, Number(e.target.value) || lot.moq))}
                    className="w-20 px-2 py-1.5 text-center text-sm font-mono tabular-nums border border-[#CBD5E1] rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((prev) => prev + 10)}
                    className="w-8 h-8 rounded-md border border-[#CBD5E1] text-sm font-medium hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0]">
                <div>
                  <p className="text-xs text-[#475569]">Factory Lot Subtotal</p>
                  <p className="font-mono tabular-nums text-lg font-semibold text-[#0F172A]">
                    ${subtotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#475569]">
                    Affiliate Payout ({lot.affiliateRatePct}%)
                  </p>
                  <p className="font-mono tabular-nums text-lg font-semibold text-[#1D4ED8]">
                    ${estCommission.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable / Copied Affiliate Redirect URL */}
            <div className="space-y-2">
              <label htmlFor="modal-aff-url" className="block text-xs font-medium text-[#0F172A]">
                Destination Affiliate Product URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="modal-aff-url"
                  type="url"
                  value={editableUrl}
                  onChange={(e) => setEditableUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomUrl}
                  className="px-3 py-2 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg cursor-pointer whitespace-nowrap"
                >
                  {urlSaved ? 'Saved' : 'Save URL'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href={destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick(lot.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open on {lot.platformLabel}</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => {
                  onAddToManifest(lot, qty);
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add to Manifest</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
