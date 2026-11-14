import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Link2, Upload } from 'lucide-react';
import {
  WHOLESALE_LOTS,
  type CategoryId,
  type PlatformId,
  type WholesaleLot,
} from '../data/wholesaleData';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onPublishProduct: (lot: WholesaleLot) => void;
}

const PLATFORM_OPTIONS: { id: PlatformId; label: string; defaultComm: number; hub: string }[] = [
  { id: 'alibaba', label: 'Alibaba B2B', defaultComm: 8.5, hub: 'Shenzhen, CN' },
  { id: 'pinduoduo', label: 'Pinduoduo', defaultComm: 7.5, hub: 'Yiwu, CN' },
  { id: 'aliexpress', label: 'AliExpress', defaultComm: 8.0, hub: 'Ningbo, CN' },
  { id: 'amazon', label: 'Amazon Wholesale', defaultComm: 6.0, hub: 'Seattle Hub, US' },
];

const CATEGORY_OPTIONS: { id: Exclude<CategoryId, 'all'>; label: string }[] = [
  { id: 'tech', label: 'Consumer Tech' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'carry', label: 'Carry & Apparel' },
  { id: 'lighting', label: 'Workspace Lighting' },
];

function detectPlatformFromUrl(url: string): PlatformId | null {
  const lower = url.toLowerCase();
  if (lower.includes('alibaba') || lower.includes('1688')) return 'alibaba';
  if (lower.includes('pinduoduo') || lower.includes('yangkeduo')) return 'pinduoduo';
  if (lower.includes('aliexpress') || lower.includes('s.click.aliexpress')) return 'aliexpress';
  if (lower.includes('amazon') || lower.includes('amzn.to')) return 'amazon';
  return null;
}

export function AddProductModal({
  open,
  onClose,
  onPublishProduct,
}: AddProductModalProps) {
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<PlatformId>('alibaba');
  const [category, setCategory] = useState<Exclude<CategoryId, 'all'>>('tech');
  const [unitPrice, setUnitPrice] = useState('12.50');
  const [msrp, setMsrp] = useState('44.99');
  const [moq, setMoq] = useState('25');
  const [commissionPct, setCommissionPct] = useState('8.5');
  const [summary, setSummary] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>(WHOLESALE_LOTS[0].image);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleUrlChange = (val: string) => {
    setAffiliateUrl(val);
    if (error) setError(null);
    const detected = detectPlatformFromUrl(val);
    if (detected) {
      setPlatform(detected);
      const match = PLATFORM_OPTIONS.find((p) => p.id === detected);
      if (match) setCommissionPct(String(match.defaultComm));
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUrl = affiliateUrl.trim();
    const cleanTitle = title.trim();

    if (!cleanUrl || !/^https?:\/\/.+/i.test(cleanUrl)) {
      setError('Paste a valid product or affiliate link starting with https://');
      return;
    }
    if (!cleanTitle) {
      setError('Enter a product name for the storefront card.');
      return;
    }

    const parsedUnit = Math.max(0.5, Number(unitPrice) || 10);
    const parsedMsrp = Math.max(parsedUnit + 1, Number(msrp) || parsedUnit * 3);
    const parsedMoq = Math.max(1, Math.round(Number(moq) || 20));
    const parsedComm = Math.min(25, Math.max(1, Number(commissionPct) || 7.5));
    const marginPct = Math.max(10, Math.round(((parsedMsrp - parsedUnit) / parsedMsrp) * 100));

    const platformMeta = PLATFORM_OPTIONS.find((p) => p.id === platform) || PLATFORM_OPTIONS[0];
    const categoryMeta = CATEGORY_OPTIONS.find((c) => c.id === category) || CATEGORY_OPTIONS[0];
    const id = `custom-${Date.now()}`;
    const sku = `MT-AFF-${Math.floor(100 + Math.random() * 899)}`;

    const newLot: WholesaleLot = {
      id,
      sku,
      title: cleanTitle,
      platform,
      platformLabel: platformMeta.label,
      category,
      categoryLabel: categoryMeta.label,
      factoryHub: platformMeta.hub,
      leadTimeDays: '5–10 days',
      moq: parsedMoq,
      unitPriceMin: Number((parsedUnit * 0.85).toFixed(2)),
      unitPriceMax: Number(parsedUnit.toFixed(2)),
      msrp: Number(parsedMsrp.toFixed(2)),
      affiliateRatePct: parsedComm,
      marginPct,
      stockNote: 'Direct Affiliate Link',
      image: selectedImage,
      imageAlt: cleanTitle,
      summary:
        summary.trim() ||
        `Direct ${platformMeta.label} wholesale product listing. Clicking redirects visitors directly to the verified supplier page with your affiliate tracking attached.`,
      compliance: 'Verified Supplier Listing',
      weightKg: 0.45,
      cartonUnits: Math.max(10, parsedMoq),
      sourceUrlSample: cleanUrl,
      affiliateUrl: cleanUrl,
      isCustom: true,
      tiers: [
        { minQty: parsedMoq, label: `${parsedMoq}–${parsedMoq * 3 - 1} units`, unitPrice: Number(parsedUnit.toFixed(2)) },
        { minQty: parsedMoq * 3, label: `${parsedMoq * 3}–${parsedMoq * 8 - 1} units`, unitPrice: Number((parsedUnit * 0.92).toFixed(2)) },
        { minQty: parsedMoq * 8, label: `${parsedMoq * 8}+ units`, unitPrice: Number((parsedUnit * 0.85).toFixed(2)) },
      ],
    };

    onPublishProduct(newLot);
    setAffiliateUrl('');
    setTitle('');
    setSummary('');
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F172A]/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs font-medium text-[#1D4ED8]">Affiliate Publisher</p>
            <h3 id="add-product-modal-title" className="font-display text-lg font-semibold text-[#0F172A]">
              Paste a marketplace affiliate link to publish a product
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {error && <p className="text-xs font-medium text-[#B91C1C]">{error}</p>}

          <div className="space-y-1.5">
            <label htmlFor="pub-url" className="block text-xs font-medium text-[#0F172A]">
              Copied Affiliate / Product URL (Alibaba, Pinduoduo, AliExpress, or Amazon) *
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="pub-url"
                type="url"
                value={affiliateUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://s.click.aliexpress.com/e/... or https://amzn.to/..."
                className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
            <p className="text-[11px] text-[#475569]">
              Visitors clicking this product will be redirected straight to this exact URL so your commission tracks automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pub-title" className="block text-xs font-medium text-[#0F172A]">
              Product Title *
            </label>
            <input
              id="pub-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Portable Thermal Shipping Label Printer (Bluetooth)"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pub-platform" className="block text-xs font-medium text-[#0F172A]">
                Marketplace Platform
              </label>
              <select
                id="pub-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-category" className="block text-xs font-medium text-[#0F172A]">
                Category
              </label>
              <select
                id="pub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<CategoryId, 'all'>)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pub-price" className="block text-xs font-medium text-[#0F172A]">
                Wholesale ($)
              </label>
              <input
                id="pub-price"
                type="number"
                step="0.01"
                min="0.5"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-msrp" className="block text-xs font-medium text-[#0F172A]">
                Target Retail ($)
              </label>
              <input
                id="pub-msrp"
                type="number"
                step="0.01"
                min="1"
                value={msrp}
                onChange={(e) => setMsrp(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-moq" className="block text-xs font-medium text-[#0F172A]">
                MOQ (Units)
              </label>
              <input
                id="pub-moq"
                type="number"
                min="1"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pub-comm" className="block text-xs font-medium text-[#0F172A]">
                Commission (%)
              </label>
              <input
                id="pub-comm"
                type="number"
                step="0.5"
                min="1"
                max="30"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#0F172A]">
                Product Photo (Choose studio thumbnail or upload)
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8] hover:text-[#1E40AF] cursor-pointer">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {WHOLESALE_LOTS.map((preset) => {
                const active = selectedImage === preset.image;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedImage(preset.image)}
                    className={`aspect-4/3 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                      active ? 'border-[#1D4ED8]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.image}
                      alt={preset.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pub-summary" className="block text-xs font-medium text-[#0F172A]">
              Short Product Note (Optional)
            </label>
            <textarea
              id="pub-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key specs, packaging options, or shipping notes for buyers."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
            >
              Publish Product to Website
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
