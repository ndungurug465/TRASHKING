import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Menu,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  HERO_LOGISTICS_IMAGE,
  PARTNER_TESTIMONIALS,
  PLATFORM_PROFILES,
  TRADE_METRICS,
  WHOLESALE_LOTS,
  resolveAffiliateUrl,
  type CategoryId,
  type PlatformId,
  type WholesaleLot,
} from './data/wholesaleData';
import { ResilientImage } from './components/ResilientImage';
import { WholesaleCalculator } from './components/WholesaleCalculator';
import { ProductLotModal } from './components/ProductLotModal';
import { ManifestDrawer, type ManifestItem } from './components/ManifestDrawer';
import { AddProductModal } from './components/AddProductModal';
import { CompareLotsPanel } from './components/CompareLotsPanel';
import {
  RegistrationForm,
  type RegisteredPartnerProfile,
} from './components/RegistrationForm';

type SortOption = 'commission' | 'moq' | 'margin' | 'price-asc';
type DeskMode = 'sourcing' | 'affiliate';

const STORAGE_CUSTOM_LOTS_KEY = 'meridian_custom_affiliate_lots_v1';
const STORAGE_URL_OVERRIDES_KEY = 'meridian_affiliate_url_overrides_v1';
const STORAGE_CLICKS_KEY = 'meridian_affiliate_clicks_v1';

const PLATFORM_FILTERS: { id: 'all' | PlatformId; label: string }[] = [
  { id: 'all', label: 'All Platforms' },
  { id: 'alibaba', label: 'Alibaba B2B' },
  { id: 'pinduoduo', label: 'Pinduoduo' },
  { id: 'aliexpress', label: 'AliExpress' },
  { id: 'amazon', label: 'Amazon Wholesale' },
];

const CATEGORY_FILTERS: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'tech', label: 'Consumer Tech' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'carry', label: 'Carry & Apparel' },
  { id: 'lighting', label: 'Workspace Lighting' },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformId>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId>('all');
  const [sortBy, setSortBy] = useState<SortOption>('commission');
  const [searchQuery, setSearchQuery] = useState('');

  const [partnerCode, setPartnerCode] = useState('AGENT-842');
  const [copiedLotId, setCopiedLotId] = useState<string | null>(null);
  const [sharedLotId, setSharedLotId] = useState<string | null>(null);
  const [addedLotId, setAddedLotId] = useState<string | null>(null);

  const [customLots, setCustomLots] = useState<WholesaleLot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_LOTS_KEY);
      return saved ? (JSON.parse(saved) as WholesaleLot[]) : [];
    } catch {
      return [];
    }
  });

  const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_URL_OVERRIDES_KEY);
      return saved ? (JSON.parse(saved) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const [clickCounts, setClickCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLICKS_KEY);
      return saved ? (JSON.parse(saved) as Record<string, number>) : {};
    } catch {
      return {};
    }
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [manifestOpen, setManifestOpen] = useState(false);
  const [manifestItems, setManifestItems] = useState<ManifestItem[]>([
    { lot: WHOLESALE_LOTS[0], quantity: 50 },
  ]);

  // Agent Sourcing Desk state
  const [deskMode, setDeskMode] = useState<DeskMode>('sourcing');
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetQty, setTargetQty] = useState('100');
  const [destCountry, setDestCountry] = useState('United States');
  const [contactEmail, setContactEmail] = useState('');
  const [sourcingNotes, setSourcingNotes] = useState('');
  const [deskError, setDeskError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    url: string;
    qty: string;
    email: string;
  } | null>(null);

  // Affiliate Link Generator state
  const [affTargetUrl, setAffTargetUrl] = useState(WHOLESALE_LOTS[1].sourceUrlSample);
  const [affCampaign, setAffCampaign] = useState('q4-wholesale-guide');
  const [affCopied, setAffCopied] = useState(false);

  const sourceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_LOTS_KEY, JSON.stringify(customLots));
    } catch {
      // Ignore storage quota issues
    }
  }, [customLots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_URL_OVERRIDES_KEY, JSON.stringify(urlOverrides));
    } catch {
      // Ignore storage quota issues
    }
  }, [urlOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CLICKS_KEY, JSON.stringify(clickCounts));
    } catch {
      // Ignore storage quota issues
    }
  }, [clickCounts]);

  const allCatalogLots = useMemo(() => {
    return [...customLots, ...WHOLESALE_LOTS].map((lot) =>
      urlOverrides[lot.id]
        ? { ...lot, affiliateUrl: urlOverrides[lot.id] }
        : lot,
    );
  }, [customLots, urlOverrides]);

  const selectedLot = useMemo(
    () => allCatalogLots.find((lot) => lot.id === selectedLotId) || null,
    [allCatalogLots, selectedLotId],
  );

  const filteredLots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allCatalogLots.filter((lot) => {
      if (platformFilter !== 'all' && lot.platform !== platformFilter) return false;
      if (categoryFilter !== 'all' && lot.category !== categoryFilter) return false;
      if (q) {
        const hay = `${lot.title} ${lot.sku} ${lot.platformLabel} ${lot.factoryHub} ${lot.categoryLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'commission') return b.affiliateRatePct - a.affiliateRatePct;
      if (sortBy === 'moq') return a.moq - b.moq;
      if (sortBy === 'price-asc') return a.unitPriceMin - b.unitPriceMin;
      return b.marginPct - a.marginPct;
    });
  }, [allCatalogLots, platformFilter, categoryFilter, sortBy, searchQuery]);

  const compareLots = useMemo(
    () =>
      compareIds
        .map((id) => allCatalogLots.find((lot) => lot.id === id))
        .filter((lot): lot is WholesaleLot => Boolean(lot)),
    [compareIds, allCatalogLots],
  );

  const handleToggleCompare = (lotId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(lotId)) {
        return prev.filter((id) => id !== lotId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, lotId];
    });
  };

  const totalOutboundClicks = useMemo(
    () => Object.values(clickCounts).reduce((sum, n) => sum + n, 0),
    [clickCounts],
  );

  const totalManifestLots = manifestItems.length;

  const handleTrackOutboundClick = (lotId: string) => {
    setClickCounts((prev) => ({
      ...prev,
      [lotId]: (prev[lotId] || 0) + 1,
    }));
  };

  const handlePublishCustomLot = (newLot: WholesaleLot) => {
    setCustomLots((prev) => [newLot, ...prev]);
    setPlatformFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const handleDeleteCustomLot = (lotId: string) => {
    setCustomLots((prev) => prev.filter((item) => item.id !== lotId));
    setCompareIds((prev) => prev.filter((id) => id !== lotId));
  };

  const handleUpdateAffiliateUrl = (lotId: string, nextUrl: string) => {
    setUrlOverrides((prev) => ({
      ...prev,
      [lotId]: nextUrl,
    }));
  };

  const handleAddToManifest = (lot: WholesaleLot, quantity: number) => {
    setManifestItems((prev) => {
      const existing = prev.find((item) => item.lot.id === lot.id);
      if (existing) {
        return prev.map((item) =>
          item.lot.id === lot.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { lot, quantity }];
    });
    setAddedLotId(lot.id);
    window.setTimeout(() => setAddedLotId((cur) => (cur === lot.id ? null : cur)), 1600);
  };

  const handleUpdateManifestQty = (lotId: string, nextQty: number) => {
    setManifestItems((prev) =>
      prev.map((item) =>
        item.lot.id === lotId ? { ...item, quantity: nextQty } : item,
      ),
    );
  };

  const handleRemoveManifestItem = (lotId: string) => {
    setManifestItems((prev) => prev.filter((item) => item.lot.id !== lotId));
  };

  const handleCopyLotAffiliate = async (lot: WholesaleLot) => {
    const link = resolveAffiliateUrl(lot, partnerCode);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard fallback
    }
    setCopiedLotId(lot.id);
    window.setTimeout(() => setCopiedLotId((cur) => (cur === lot.id ? null : cur)), 1800);
  };

  const handleShareLot = async (lot: WholesaleLot) => {
    const shareUrl = resolveAffiliateUrl(lot, partnerCode);
    const shareTitle = `${lot.title} — ${lot.platformLabel}`;
    const shareText = `${lot.title} (${lot.platformLabel}) · Wholesale $${lot.unitPriceMin.toFixed(2)}–$${lot.unitPriceMax.toFixed(2)}/unit · MOQ ${lot.moq} · ${lot.factoryHub}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setSharedLotId(lot.id);
        window.setTimeout(() => setSharedLotId((cur) => (cur === lot.id ? null : cur)), 2000);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    } catch {
      // Clipboard fallback
    }
    setSharedLotId(lot.id);
    window.setTimeout(() => setSharedLotId((cur) => (cur === lot.id ? null : cur)), 2000);
  };

  const scrollToSection = (id: string, mode?: DeskMode) => {
    setMobileMenuOpen(false);
    if (mode) setDeskMode(mode);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (id === 'agent-desk') {
        window.setTimeout(() => sourceInputRef.current?.focus({ preventScroll: true }), 350);
      }
    }
  };

  const handleFilterByPlatform = (platformId: PlatformId) => {
    setPlatformFilter(platformId);
    scrollToSection('catalog');
  };

  const handlePrefillCustomDesk = (summaryNote: string) => {
    setDeskMode('sourcing');
    setSubmittedTicket(null);
    setSourcingNotes(summaryNote);
    scrollToSection('agent-desk', 'sourcing');
  };

  const handleSubmitSourcing = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUrl = sourceUrl.trim();
    const trimmedEmail = contactEmail.trim();

    if (!trimmedUrl || !/^https?:\/\/.+/i.test(trimmedUrl)) {
      setDeskError('Paste a valid supplier URL starting with https:// (Alibaba, Pinduoduo, AliExpress, or Amazon).');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setDeskError('Enter a valid email address for the agent quotation.');
      return;
    }

    setDeskError(null);
    setSubmittedTicket({
      ticketId: `REQ-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      url: trimmedUrl,
      qty: targetQty || '100',
      email: trimmedEmail,
    });
  };

  const detectedAffiliatePlatform = useMemo(() => {
    const lower = affTargetUrl.toLowerCase();
    if (lower.includes('alibaba') || lower.includes('1688')) {
      return { name: 'Alibaba B2B / 1688', rate: '6.0% – 9.5%' };
    }
    if (lower.includes('pinduoduo') || lower.includes('yangkeduo')) {
      return { name: 'Pinduoduo Wholesale', rate: '5.5% – 8.0%' };
    }
    if (lower.includes('aliexpress')) {
      return { name: 'AliExpress Direct', rate: '7.0% – 9.0%' };
    }
    if (lower.includes('amazon') || lower.includes('amzn.to')) {
      return { name: 'Amazon Wholesale', rate: '4.5% – 6.5%' };
    }
    return { name: 'Cross-Platform Direct', rate: '5.5% Standard' };
  }, [affTargetUrl]);

  const generatedAffiliateLink = useMemo(() => {
    const cleanRef = (partnerCode || 'AGENT-842').trim().replace(/\s+/g, '-');
    const cleanCampaign = (affCampaign || 'direct').trim().replace(/\s+/g, '-');
    const encodedTarget = encodeURIComponent(affTargetUrl.trim() || 'https://www.alibaba.com');
    return `https://meridiantrade.example/go?ref=${encodeURIComponent(
      cleanRef,
    )}&tag=${encodeURIComponent(cleanCampaign)}&url=${encodedTarget}`;
  }, [partnerCode, affCampaign, affTargetUrl]);

  const handleCopyGeneratedAffiliate = async () => {
    try {
      await navigator.clipboard.writeText(generatedAffiliateLink);
    } catch {
      // Clipboard fallback
    }
    setAffCopied(true);
    window.setTimeout(() => setAffCopied(false), 2000);
  };

  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D4ED8] rounded-sm"
          >
            Meridian Trade
          </a>

          {/* Zone 2: 4 concise single-line text links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]"
          >
            <a
              href="#register"
              className="hover:text-[#0F172A] hover:underline underline-offset-4 decoration-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
            >
              Register
            </a>
            <a
              href="#catalog"
              className="hover:text-[#0F172A] hover:underline underline-offset-4 decoration-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
            >
              Catalog
            </a>
            <a
              href="#platforms"
              className="hover:text-[#0F172A] hover:underline underline-offset-4 decoration-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
            >
              Platforms
            </a>
            <a
              href="#agent-desk"
              className="hover:text-[#0F172A] hover:underline underline-offset-4 decoration-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
            >
              Agent Desk
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setManifestOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              Manifest ({totalManifestLots})
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 space-y-1">
            <a
              href="#catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0F172A] rounded-md hover:bg-[#F1F5F9]"
            >
              Catalog
            </a>
            <a
              href="#platforms"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0F172A] rounded-md hover:bg-[#F1F5F9]"
            >
              Platforms
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0F172A] rounded-md hover:bg-[#F1F5F9]"
            >
              Calculator
            </a>
            <a
              href="#agent-desk"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0F172A] rounded-md hover:bg-[#F1F5F9]"
            >
              Agent Desk
            </a>
            <a
              href="#register"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0F172A] rounded-md hover:bg-[#F1F5F9]"
            >
              Register
            </a>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Section 1: Registration First + Hero Overview */}
        <section
          id="register"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-12 lg:pb-16 scroll-mt-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium text-[#475569]">
                  Shenzhen · Yiwu · Seattle · Cross-Border Wholesale Agent
                </p>
                <h1 className="font-display text-[clamp(2.1rem,3.6vw,3.15rem)] leading-[1.08] font-semibold tracking-tight text-[#0F172A] text-balance">
                  Register first to source wholesale lots and earn affiliate commissions
                </h1>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  Complete your partner registration to activate your tracking code across Pinduoduo, Alibaba B2B, AliExpress, and Amazon wholesale links before sharing or dispatching orders.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('catalog')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Browse Wholesale Lots</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Paste Affiliate Link</span>
                </button>
              </div>

              <div>
                <div className="aspect-16/10 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                  <ResilientImage
                    src={HERO_LOGISTICS_IMAGE.src}
                    alt={HERO_LOGISTICS_IMAGE.alt}
                    fallbackTitle="Meridian Trade Fulfillment & QC Desk"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs text-[#475569]">
                  <span>Active Partner ID: <span className="font-mono font-medium text-[#0F172A]">{partnerCode}</span></span>
                  <span className="font-mono tabular-nums">Outbound Clicks: {totalOutboundClicks}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <RegistrationForm
                onPartnerRegistered={(profile: RegisteredPartnerProfile) => {
                  setPartnerCode(profile.partnerCode);
                }}
                onBrowseCatalog={() => scrollToSection('catalog')}
                onPasteLink={() => setAddModalOpen(true)}
              />
            </div>
          </div>

          {/* 4-column full-width trade proof strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-8 border-t border-[#E2E8F0]">
            {TRADE_METRICS.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-[#0F172A]">{metric.label}</p>
                <p className="text-xs text-[#475569]">{metric.context}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Wholesale Catalog & Affiliate Deal Finder */}
        <section
          id="catalog"
          className="border-t border-[#E2E8F0] bg-[#F1F5F9]/60 py-14 lg:py-20 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-[#1D4ED8]">
                  Direct-Redirect Wholesale Catalog
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F172A] text-balance">
                  Click any product to open the marketplace page with your affiliate tag
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2">
                  <label htmlFor="partner-code-input" className="text-xs font-medium text-[#475569] whitespace-nowrap">
                    Agent Ref:
                  </label>
                  <input
                    id="partner-code-input"
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    className="w-24 text-xs font-mono font-medium text-[#0F172A] bg-transparent border-b border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none py-0.5"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Paste Affiliate Product Link</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* Platform Segmented Tabs */}
              <div
                role="tablist"
                aria-label="Filter wholesale lots by marketplace"
                className="inline-flex flex-wrap gap-1 p-1 bg-[#E2E8F0] rounded-lg self-start"
              >
                {PLATFORM_FILTERS.map((tab) => {
                  const active = platformFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPlatformFilter(tab.id)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-[#0F172A] shadow-xs'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search
                    className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU, product, hub..."
                    aria-label="Search wholesale lots"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <select
                  aria-label="Filter by product category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryId)}
                  className="px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  {CATEGORY_FILTERS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort wholesale lots"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="commission">Sort: Highest Affiliate %</option>
                  <option value="price-asc">Sort: Lowest Unit Price</option>
                  <option value="margin">Sort: Highest Retail Margin</option>
                  <option value="moq">Sort: Lowest MOQ</option>
                </select>
              </div>
            </div>

            {/* Side-by-Side Comparison Panel (up to 3 lots) */}
            <CompareLotsPanel
              lots={compareLots}
              partnerCode={partnerCode}
              onRemoveLot={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
              onClearAll={() => setCompareIds([])}
              onAddToManifest={handleAddToManifest}
              onTrackClick={handleTrackOutboundClick}
            />

            {/* 3-Column Uniform Product Grid */}
            {filteredLots.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
                <p className="font-display text-lg font-semibold text-[#0F172A]">
                  No wholesale lots match your current filters
                </p>
                <p className="text-sm text-[#475569]">
                  Reset your search or paste a direct Pinduoduo, Alibaba, AliExpress, or Amazon affiliate link to publish a new item.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPlatformFilter('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLots.map((lot) => {
                  const isCopied = copiedLotId === lot.id;
                  const isShared = sharedLotId === lot.id;
                  const isAdded = addedLotId === lot.id;
                  const destinationUrl = resolveAffiliateUrl(lot, partnerCode);
                  const lotClicks = clickCounts[lot.id] || 0;

                  return (
                    <article
                      key={lot.id}
                      className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <div>
                        <a
                          href={destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackOutboundClick(lot.id)}
                          className="block w-full aspect-4/3 bg-[#F1F5F9] overflow-hidden border-b border-[#E2E8F0]"
                        >
                          <ResilientImage
                            src={lot.image}
                            alt={lot.imageAlt}
                            fallbackTitle={lot.title}
                            className="w-full h-full object-cover"
                          />
                        </a>

                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#475569] min-w-0">
                              <span className="font-medium text-[#1D4ED8]">{lot.platformLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span>{lot.factoryHub}</span>
                              {lotClicks > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums text-[#0F172A]">
                                    {lotClicks} clicks
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleCompare(lot.id)}
                                disabled={!compareIds.includes(lot.id) && compareIds.length >= 3}
                                aria-pressed={compareIds.includes(lot.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap ${
                                  compareIds.includes(lot.id)
                                    ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white cursor-pointer'
                                    : compareIds.length >= 3
                                      ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:border-[#94A3B8] cursor-pointer'
                                }`}
                              >
                                {compareIds.includes(lot.id) && (
                                  <Check className="w-3 h-3" aria-hidden="true" />
                                )}
                                <span>{compareIds.includes(lot.id) ? 'Comparing' : 'Compare'}</span>
                              </button>

                              {lot.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomLot(lot.id)}
                                  aria-label={`Remove ${lot.title}`}
                                  className="text-[#64748B] hover:text-[#DC2626] p-1 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h3 className="font-display text-base font-semibold text-[#0F172A] leading-snug">
                            <a
                              href={destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleTrackOutboundClick(lot.id)}
                              className="hover:text-[#1D4ED8] transition-colors"
                            >
                              {lot.title}
                            </a>
                          </h3>

                          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
                            {lot.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-[#E2E8F0] space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#475569]">Wholesale</p>
                            <p className="font-mono tabular-nums font-semibold text-[#0F172A] mt-0.5">
                              ${lot.unitPriceMin.toFixed(2)}–${lot.unitPriceMax.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#475569]">MOQ / Margin</p>
                            <p className="font-mono tabular-nums font-semibold text-[#0F172A] mt-0.5">
                              {lot.moq} · {lot.marginPct}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[#475569]">Commission</p>
                            <p className="font-mono tabular-nums font-semibold text-[#1D4ED8] mt-0.5">
                              {lot.affiliateRatePct.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <a
                            href={destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleTrackOutboundClick(lot.id)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap"
                          >
                            <span>Order on {lot.platformLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleShareLot(lot)}
                              aria-label={`Share ${lot.title}`}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {isShared ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                                  <span>Shared</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Share</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddToManifest(lot, lot.moq)}
                              title="Add MOQ to consolidated manifest"
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Manifest</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLotAffiliate(lot)}
                              title="Copy affiliate redirect URL"
                              aria-label={`Copy affiliate link for ${lot.title}`}
                              className="inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-[#15803D]" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedLotId(lot.id)}
                              title="Inspect tiers & edit affiliate URL"
                              aria-label={`Inspect ${lot.title}`}
                              className="inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Platform Agent Network & Commission Matrix */}
        <section
          id="platforms"
          className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-14 lg:py-20 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-[#1D4ED8]">
                  Supported Marketplaces
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F172A] text-balance">
                  One buying agent desk across four wholesale ecosystems
                </h2>
              </div>
              <p className="text-sm text-[#475569] max-w-sm leading-relaxed">
                Combine domestic Chinese factory rates from Pinduoduo and Alibaba with rapid AliExpress split-SKUs and Amazon FBA pallet lots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PLATFORM_PROFILES.map((platform) => (
                <article
                  key={platform.id}
                  className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#475569]">
                          {platform.role}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-[#0F172A] mt-0.5">
                          {platform.name}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-[#475569]">Affiliate Tier</p>
                        <p className="font-mono tabular-nums text-sm font-semibold text-[#1D4ED8]">
                          {platform.commissionRange}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#475569] leading-relaxed">
                      {platform.bestFor}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-[#475569]">Typical MOQ</dt>
                        <dd className="font-mono tabular-nums font-medium text-[#0F172A] mt-0.5">
                          {platform.typicalMoq}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#475569]">Payout Settlement</dt>
                        <dd className="font-mono tabular-nums font-medium text-[#0F172A] mt-0.5">
                          {platform.settlementWindow}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#475569]">Consolidation Hub</dt>
                        <dd className="font-medium text-[#0F172A] mt-0.5">
                          {platform.consolidationHub}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#475569]">Inspection Protocol</dt>
                        <dd className="font-medium text-[#0F172A] mt-0.5">
                          {platform.qcProtocol}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => handleFilterByPlatform(platform.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] cursor-pointer"
                      >
                        <span>Filter {platform.name} Lots</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollToSection('agent-desk', 'affiliate')}
                        className="text-xs font-medium text-[#475569] hover:text-[#0F172A] cursor-pointer"
                      >
                        Build Partner Link
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Adjacent Attributable Partner Proof */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[#E2E8F0]">
              {PARTNER_TESTIMONIALS.map((item) => (
                <blockquote key={item.author} className="space-y-2.5">
                  <p className="text-sm sm:text-base text-[#0F172A] leading-relaxed">
                    “{item.quote}”
                  </p>
                  <footer className="text-xs text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">{item.author}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{item.role}, {item.organization}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Landed Cost & Affiliate Commission Calculator */}
        <section
          id="calculator"
          className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-14 lg:py-20 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WholesaleCalculator
              partnerCode={partnerCode}
              onAddLotToManifest={handleAddToManifest}
              onRequestCustomDesk={handlePrefillCustomDesk}
            />
          </div>
        </section>

        {/* Section 5: Agent Sourcing Desk & Custom URL Affiliate Link Builder */}
        <section
          id="agent-desk"
          className="border-t border-[#E2E8F0] bg-[#F1F5F9]/60 py-14 lg:py-20 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#1D4ED8]">
                    24/7 Wholesale Agent Desk
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F172A] text-balance">
                    Source any supplier URL or build an affiliate link
                  </h2>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    Found a product directly on Pinduoduo, Alibaba B2B, AliExpress, or Amazon? Paste the URL to request a factory-negotiated agent quote, or wrap it into a tracked affiliate referral link for your buyers.
                  </p>
                </div>

                <ol className="space-y-3 pt-4 border-t border-[#E2E8F0] text-sm text-[#0F172A]">
                  <li className="flex gap-3">
                    <span className="font-mono tabular-nums text-xs text-[#475569] pt-0.5">01</span>
                    <span>Factory price verification & supplier license check within 12 hours</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono tabular-nums text-xs text-[#475569] pt-0.5">02</span>
                    <span>Multi-platform carton consolidation in Shenzhen, Yiwu, or Seattle</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono tabular-nums text-xs text-[#475569] pt-0.5">03</span>
                    <span>Automated affiliate commission ledger on every settled invoice</span>
                  </li>
                </ol>
              </div>

              <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 space-y-6">
                {/* Mode Toggle */}
                <div
                  role="tablist"
                  aria-label="Agent desk tool selector"
                  className="inline-flex p-1 bg-[#F1F5F9] rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={deskMode === 'sourcing'}
                    onClick={() => setDeskMode('sourcing')}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      deskMode === 'sourcing'
                        ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    Source Custom URL
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={deskMode === 'affiliate'}
                    onClick={() => setDeskMode('affiliate')}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      deskMode === 'affiliate'
                        ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    Affiliate Link Builder
                  </button>
                </div>

                {deskMode === 'sourcing' ? (
                  submittedTicket ? (
                    <div className="space-y-4 py-2">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#15803D]">
                        <Check className="w-5 h-5" />
                        <span>Sourcing Ticket Created</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold text-[#0F172A]">
                        Ticket {submittedTicket.ticketId} Assigned to Buying Desk
                      </h3>
                      <p className="text-sm text-[#475569] leading-relaxed">
                        Our regional sourcing specialist is verifying factory tier pricing and DDP freight for{' '}
                        <span className="font-mono tabular-nums font-medium text-[#0F172A]">
                          {submittedTicket.qty} units
                        </span>
                        . A full cost sheet will arrive at{' '}
                        <span className="font-mono text-[#0F172A]">{submittedTicket.email}</span>{' '}
                        within 12 business hours.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedTicket(null);
                          setSourceUrl('');
                          setSourcingNotes('');
                        }}
                        className="px-4 py-2.5 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg cursor-pointer"
                      >
                        Submit Another Product URL
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitSourcing} noValidate className="space-y-4">
                      {deskError && <p className="text-xs text-[#B91C1C]">{deskError}</p>}

                      <div className="space-y-1.5">
                        <label htmlFor="desk-source-url" className="block text-xs font-medium text-[#0F172A]">
                          Marketplace Product URL (Alibaba, Pinduoduo, AliExpress, or Amazon) *
                        </label>
                        <input
                          ref={sourceInputRef}
                          id="desk-source-url"
                          type="url"
                          value={sourceUrl}
                          onChange={(e) => {
                            setSourceUrl(e.target.value);
                            if (deskError) setDeskError(null);
                          }}
                          placeholder="https://www.alibaba.com/product-detail/..."
                          className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="desk-qty" className="block text-xs font-medium text-[#0F172A]">
                            Target Quantity
                          </label>
                          <input
                            id="desk-qty"
                            type="number"
                            min={10}
                            value={targetQty}
                            onChange={(e) => setTargetQty(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="desk-dest" className="block text-xs font-medium text-[#0F172A]">
                            Destination Market
                          </label>
                          <select
                            id="desk-dest"
                            value={destCountry}
                            onChange={(e) => setDestCountry(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                          >
                            <option value="United States">United States (DDP)</option>
                            <option value="European Union">European Union (DDP)</option>
                            <option value="United Kingdom">United Kingdom (DDP)</option>
                            <option value="Australia / Canada">Australia / Canada</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="desk-email" className="block text-xs font-medium text-[#0F172A]">
                            Business Email *
                          </label>
                          <input
                            id="desk-email"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => {
                              setContactEmail(e.target.value);
                              if (deskError) setDeskError(null);
                            }}
                            placeholder="buyer@company.com"
                            className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="desk-notes" className="block text-xs font-medium text-[#0F172A]">
                          Packaging, Private-Label, or QC Notes
                        </label>
                        <textarea
                          id="desk-notes"
                          rows={3}
                          value={sourcingNotes}
                          onChange={(e) => setSourcingNotes(e.target.value)}
                          placeholder="Specify custom logo embossing, FNSKU labels, or target unit price."
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <p className="text-xs text-[#475569]">
                          Includes factory verification & DDP freight options.
                        </p>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>Request Agent Quote</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="aff-target-url" className="block text-xs font-medium text-[#0F172A]">
                        Paste Pinduoduo, Alibaba, AliExpress, or Amazon Product URL
                      </label>
                      <input
                        id="aff-target-url"
                        type="url"
                        value={affTargetUrl}
                        onChange={(e) => setAffTargetUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="aff-ref-input" className="block text-xs font-medium text-[#0F172A]">
                          Your Partner Ref ID
                        </label>
                        <input
                          id="aff-ref-input"
                          type="text"
                          value={partnerCode}
                          onChange={(e) => setPartnerCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="aff-campaign-input" className="block text-xs font-medium text-[#0F172A]">
                          Campaign Sub-ID Tag
                        </label>
                        <input
                          id="aff-campaign-input"
                          type="text"
                          value={affCampaign}
                          onChange={(e) => setAffCampaign(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[#475569]">
                          Detected Channel:{' '}
                          <strong className="font-medium text-[#0F172A]">
                            {detectedAffiliatePlatform.name}
                          </strong>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                          Commission: {detectedAffiliatePlatform.rate}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          aria-label="Generated affiliate tracking URL"
                          value={generatedAffiliateLink}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                        />
                        <button
                          type="button"
                          onClick={handleCopyGeneratedAffiliate}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {affCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied Link</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Tracking URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <a href="#top" className="font-display text-base font-bold text-[#0F172A]">
              Meridian Trade
            </a>
            <p className="text-xs text-[#475569]">
              Shenzhen · Yiwu · Seattle · desk@meridiantrade.example
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#475569]">
            <a href="#catalog" className="hover:text-[#0F172A] transition-colors">
              Catalog
            </a>
            <a href="#platforms" className="hover:text-[#0F172A] transition-colors">
              Platforms
            </a>
            <a href="#calculator" className="hover:text-[#0F172A] transition-colors">
              Calculator
            </a>
            <a href="#agent-desk" className="hover:text-[#0F172A] transition-colors">
              Agent Desk
            </a>
            <a href="#register" className="hover:text-[#0F172A] transition-colors">
              Register
            </a>
            <span className="text-[#94A3B8]">© {new Date().getFullYear()} Meridian Trade Logistics Ltd.</span>
          </div>
        </div>
      </footer>

      {/* Publish Custom Affiliate Product Modal */}
      <AddProductModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onPublishProduct={handlePublishCustomLot}
      />

      {/* Product Lot Detail Modal */}
      <ProductLotModal
        lot={selectedLot}
        partnerCode={partnerCode}
        clickCount={selectedLot ? clickCounts[selectedLot.id] || 0 : 0}
        onClose={() => setSelectedLotId(null)}
        onAddToManifest={handleAddToManifest}
        onTrackClick={handleTrackOutboundClick}
        onUpdateAffiliateUrl={handleUpdateAffiliateUrl}
      />

      {/* Slide-Over Sourcing Manifest Drawer */}
      <ManifestDrawer
        open={manifestOpen}
        items={manifestItems}
        partnerCode={partnerCode}
        onClose={() => setManifestOpen(false)}
        onUpdateQty={handleUpdateManifestQty}
        onRemoveItem={handleRemoveManifestItem}
        onClearManifest={() => setManifestItems([])}
      />
    </div>
  );
}
