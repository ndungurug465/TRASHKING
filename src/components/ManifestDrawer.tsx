import { useEffect, useState, type FormEvent } from 'react';
import { X, Trash2, CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { resolveAffiliateUrl, type WholesaleLot } from '../data/wholesaleData';
import { getTierUnitPrice } from './WholesaleCalculator';
import { ResilientImage } from './ResilientImage';

export interface ManifestItem {
  lot: WholesaleLot;
  quantity: number;
}

interface ManifestDrawerProps {
  open: boolean;
  items: ManifestItem[];
  partnerCode: string;
  onClose: () => void;
  onUpdateQty: (lotId: string, nextQty: number) => void;
  onRemoveItem: (lotId: string) => void;
  onClearManifest: () => void;
}

export function ManifestDrawer({
  open,
  items,
  partnerCode,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearManifest,
}: ManifestDrawerProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [destination, setDestination] = useState('United States (DDP)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedPo, setConfirmedPo] = useState<{
    poNumber: string;
    totalUsd: number;
    commissionUsd: number;
    itemCount: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const totals = items.reduce(
    (acc, item) => {
      const unitPrice = getTierUnitPrice(item.lot, item.quantity);
      const lineTotal = unitPrice * item.quantity;
      const lineCommission = lineTotal * (item.lot.affiliateRatePct / 100);
      return {
        subtotal: acc.subtotal + lineTotal,
        commission: acc.commission + lineCommission,
        units: acc.units + item.quantity,
      };
    },
    { subtotal: 0, commission: 0, units: 0 },
  );

  const handleDispatch = (e: FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) {
      setErrorMsg('Please enter your name and a valid business email address.');
      return;
    }
    setErrorMsg(null);
    const poNumber = `MT-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    setConfirmedPo({
      poNumber,
      totalUsd: totals.subtotal,
      commissionUsd: totals.commission,
      itemCount: totals.units,
    });
    onClearManifest();
  };

  const escapeCsvCell = (value: string | number) => {
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;

    const headers = [
      'SKU',
      'Product Title',
      'Platform',
      'Factory Hub',
      'Quantity',
      'Unit Price (USD)',
      'Line Subtotal (USD)',
      'Affiliate Rate (%)',
      'Estimated Commission (USD)',
      'Partner Ref Code',
      'Destination Market',
      'Supplier / Affiliate URL',
    ];

    const rows = items.map(({ lot, quantity }) => {
      const unitPrice = getTierUnitPrice(lot, quantity);
      const lineTotal = unitPrice * quantity;
      const commission = lineTotal * (lot.affiliateRatePct / 100);
      return [
        lot.sku,
        lot.title,
        lot.platformLabel,
        lot.factoryHub,
        quantity,
        unitPrice.toFixed(2),
        lineTotal.toFixed(2),
        lot.affiliateRatePct.toFixed(1),
        commission.toFixed(2),
        partnerCode,
        destination,
        resolveAffiliateUrl(lot, partnerCode),
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `meridian-sourcing-manifest-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sourcing Manifest and Consolidated Dispatch"
      className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[#F8FAFC] border-l border-[#E2E8F0] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F172A]">
              Sourcing Manifest
            </h2>
            <p className="text-xs text-[#475569]">
              Consolidated agent dispatch & affiliate attribution ({partnerCode})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manifest drawer"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {confirmedPo ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#15803D]">
                <CheckCircle2 className="w-5 h-5" />
                <span>Consolidated Manifest Dispatched</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-[#0F172A]">
                Order {confirmedPo.poNumber} Confirmed — Preparing Factory QC
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Your agent desk in Shenzhen & Yiwu has received the manifest for{' '}
                <span className="font-mono tabular-nums font-medium text-[#0F172A]">
                  {confirmedPo.itemCount.toLocaleString()} units
                </span>
                . Confirmation and proforma invoice sent to{' '}
                <span className="font-mono text-[#0F172A]">{buyerEmail}</span>.
              </p>
              <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0] text-xs">
                <div>
                  <dt className="text-[#475569]">Factory Merchandise Value</dt>
                  <dd className="font-mono tabular-nums text-base font-semibold text-[#0F172A] mt-0.5">
                    ${confirmedPo.totalUsd.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#475569]">Attributed Affiliate Payout</dt>
                  <dd className="font-mono tabular-nums text-base font-semibold text-[#1D4ED8] mt-0.5">
                    ${confirmedPo.commissionUsd.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  setConfirmedPo(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                Return to Wholesale Catalog
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="font-display text-base font-semibold text-[#0F172A]">
                Your sourcing manifest is empty
              </p>
              <p className="text-sm text-[#475569] max-w-xs mx-auto">
                Add wholesale lots from Pinduoduo, Alibaba B2B, AliExpress, or Amazon to bundle inspection and shipping.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                Browse Wholesale Lots
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ lot, quantity }) => {
                const unitPrice = getTierUnitPrice(lot, quantity);
                const lineTotal = unitPrice * quantity;
                return (
                  <div
                    key={lot.id}
                    className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex gap-4"
                  >
                    <div className="w-20 h-16 rounded-md overflow-hidden border border-[#E2E8F0] shrink-0 bg-[#F1F5F9]">
                      <ResilientImage
                        src={lot.image}
                        alt={lot.imageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#475569]">
                            {lot.platformLabel} · {lot.sku}
                          </p>
                          <p className="text-sm font-semibold text-[#0F172A] truncate">
                            {lot.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(lot.id)}
                          aria-label={`Remove ${lot.title}`}
                          className="text-[#64748B] hover:text-[#DC2626] p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-[#CBD5E1] rounded-md">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(lot.id, Math.max(lot.moq, quantity - 10))
                            }
                            className="px-2.5 py-1 text-xs font-medium hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-mono tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(lot.id, quantity + 10)}
                            className="px-2.5 py-1 text-xs font-medium hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-mono tabular-nums font-semibold text-[#0F172A]">
                            ${lineTotal.toFixed(2)}
                          </p>
                          <p className="text-[11px] font-mono tabular-nums text-[#475569]">
                            ${unitPrice.toFixed(2)}/unit · {lot.affiliateRatePct}% comm.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && !confirmedPo && (
          <form
            onSubmit={handleDispatch}
            className="border-t border-[#E2E8F0] bg-white p-6 space-y-4"
          >
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#475569]">
                  Merchandise Subtotal ({totals.units.toLocaleString()} units)
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#475569]">Attributed Affiliate Commission</span>
                <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                  +${totals.commission.toFixed(2)}
                </span>
              </div>
            </div>

            {errorMsg && <p className="text-xs text-[#B91C1C]">{errorMsg}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Buyer / Agent Name *"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
              <input
                type="email"
                placeholder="Business Email *"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <select
              aria-label="Destination country"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#1D4ED8]"
            >
              <option value="United States (DDP)">United States (DDP Air/Sea)</option>
              <option value="European Union (Rotterdam DDP)">European Union (Rotterdam DDP)</option>
              <option value="United Kingdom (Felixstowe DDP)">United Kingdom (Felixstowe DDP)</option>
              <option value="Canada / Australia DDP">Canada / Australia DDP</option>
            </select>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download CSV</span>
              </button>

              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Dispatch Consolidated Agent Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
