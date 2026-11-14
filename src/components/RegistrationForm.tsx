import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy } from 'lucide-react';

export interface RegisteredPartnerProfile {
  partnerCode: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: 'Affiliate Agent' | 'Wholesale Buyer' | 'Buyer & Affiliate Agent';
  marketplaces: string[];
  payoutMethod: string;
  country: string;
  registeredAt: string;
}

interface RegistrationFormProps {
  onPartnerRegistered: (profile: RegisteredPartnerProfile) => void;
  onBrowseCatalog?: () => void;
  onPasteLink?: () => void;
}

const STORAGE_PARTNER_KEY = 'meridian_registered_partner_v1';

const MARKETPLACE_OPTIONS = [
  'Alibaba B2B',
  'Pinduoduo',
  'AliExpress',
  'Amazon Wholesale',
];

const ROLE_OPTIONS: RegisteredPartnerProfile['role'][] = [
  'Affiliate Agent',
  'Wholesale Buyer',
  'Buyer & Affiliate Agent',
];

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  marketplaces?: string;
  agreed?: string;
}

export function RegistrationForm({
  onPartnerRegistered,
  onBrowseCatalog,
  onPasteLink,
}: RegistrationFormProps) {
  const [savedProfile, setSavedProfile] = useState<RegisteredPartnerProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PARTNER_KEY);
      return raw ? (JSON.parse(raw) as RegisteredPartnerProfile) : null;
    } catch {
      return null;
    }
  });

  const [fullName, setFullName] = useState(savedProfile?.fullName || '');
  const [email, setEmail] = useState(savedProfile?.email || '');
  const [phone, setPhone] = useState(savedProfile?.phone || '');
  const [company, setCompany] = useState(savedProfile?.company || '');
  const [role, setRole] = useState<RegisteredPartnerProfile['role']>(
    savedProfile?.role || 'Buyer & Affiliate Agent',
  );
  const [marketplaces, setMarketplaces] = useState<string[]>(
    savedProfile?.marketplaces || ['Alibaba B2B', 'Pinduoduo'],
  );
  const [payoutMethod, setPayoutMethod] = useState(
    savedProfile?.payoutMethod || 'Wise Multi-Currency',
  );
  const [country, setCountry] = useState(savedProfile?.country || 'Tanzania / East Africa');
  const [agreed, setAgreed] = useState(Boolean(savedProfile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (savedProfile) {
      onPartnerRegistered(savedProfile);
    }
  }, []);

  const toggleMarketplace = (name: string) => {
    setMarketplaces((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
    if (errors.marketplaces) {
      setErrors((prev) => ({ ...prev, marketplaces: undefined }));
    }
  };

  const generatePartnerCode = (name: string) => {
    const cleanPrefix =
      name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 4) || 'PART';
    const suffix = Math.floor(100 + Math.random() * 899);
    return `AGENT-${cleanPrefix}-${suffix}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Enter your full name.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      nextErrors.phone = 'Enter a valid phone or WhatsApp number (at least 7 digits).';
    }
    if (marketplaces.length === 0) {
      nextErrors.marketplaces = 'Select at least one wholesale marketplace.';
    }
    if (!agreed) {
      nextErrors.agreed = 'Confirm the partner terms to complete registration.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const partnerCode = savedProfile?.partnerCode || generatePartnerCode(fullName);
    const profile: RegisteredPartnerProfile = {
      partnerCode,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim() || 'Independent Partner',
      role,
      marketplaces,
      payoutMethod,
      country,
      registeredAt: new Date().toISOString().slice(0, 10),
    };

    try {
      localStorage.setItem(STORAGE_PARTNER_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage failures
    }

    setSavedProfile(profile);
    onPartnerRegistered(profile);
  };

  const handleCopyCode = async () => {
    if (!savedProfile) return;
    try {
      await navigator.clipboard.writeText(savedProfile.partnerCode);
    } catch {
      // Fallback
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleResetAccount = () => {
    try {
      localStorage.removeItem(STORAGE_PARTNER_KEY);
    } catch {
      // Ignore
    }
    setSavedProfile(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAgreed(false);
    setErrors({});
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7">
      {savedProfile ? (
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#15803D]">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>Registered Partner Account Active</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#0F172A]">
                {savedProfile.fullName}
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">
                {savedProfile.role} · {savedProfile.company} · {savedProfile.country}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2">
              <span className="text-xs font-mono font-semibold text-[#1D4ED8]">
                {savedProfile.partnerCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy Partner Ref ID"
                className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-[#475569]">Contact Email</dt>
              <dd className="font-mono text-[#0F172A] mt-0.5">{savedProfile.email}</dd>
            </div>
            <div>
              <dt className="text-[#475569]">Phone / WhatsApp</dt>
              <dd className="font-mono tabular-nums text-[#0F172A] mt-0.5">{savedProfile.phone}</dd>
            </div>
            <div>
              <dt className="text-[#475569]">Active Marketplaces</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {savedProfile.marketplaces.join(' · ')}
              </dd>
            </div>
            <div>
              <dt className="text-[#475569]">Payout Method</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">{savedProfile.payoutMethod}</dd>
            </div>
          </dl>

          <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
            Your tracking code{' '}
            <span className="font-mono font-semibold text-[#0F172A]">
              {savedProfile.partnerCode}
            </span>{' '}
            is active across all wholesale links, the Share button, the Landed Cost Calculator, and your Sourcing Manifest.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center gap-2.5">
              {onBrowseCatalog && (
                <button
                  type="button"
                  onClick={onBrowseCatalog}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              {onPasteLink && (
                <button
                  type="button"
                  onClick={onPasteLink}
                  className="px-4 py-2.5 text-xs font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Paste Affiliate Link
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSavedProfile(null)}
                className="text-xs font-medium text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleResetAccount}
                className="text-xs font-medium text-[#475569] hover:text-[#DC2626] cursor-pointer"
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#1D4ED8]">
              Step 1 · Register Before Sourcing or Sharing
            </p>
            <h2 className="font-display text-xl font-semibold text-[#0F172A] mt-0.5">
              Partner & Wholesale Buyer Registration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="reg-fullname" className="block text-xs font-medium text-[#0F172A]">
                Full Name *
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Amina Hassan"
                className="w-full px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
              />
              {errors.fullName && <p className="text-xs text-[#B91C1C]">{errors.fullName}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#0F172A]">
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="amina@storefront.com"
                className="w-full px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
              />
              {errors.email && <p className="text-xs text-[#B91C1C]">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="reg-phone" className="block text-xs font-medium text-[#0F172A]">
                Phone / WhatsApp Number *
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="+255 712 000 000"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
              />
              {errors.phone && <p className="text-xs text-[#B91C1C]">{errors.phone}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-company" className="block text-xs font-medium text-[#0F172A]">
                Business or Channel Name
              </label>
              <input
                id="reg-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Karibu Wholesale"
                className="w-full px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#0F172A]">Account Role</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const active = role === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRole(opt)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#0F172A]">
              Primary Wholesale Marketplaces *
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MARKETPLACE_OPTIONS.map((mp) => {
                const selected = marketplaces.includes(mp);
                return (
                  <button
                    key={mp}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleMarketplace(mp)}
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      selected
                        ? 'bg-[#F1F5F9] border-[#1D4ED8] text-[#1D4ED8]'
                        : 'bg-white border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                    <span>{mp}</span>
                  </button>
                );
              })}
            </div>
            {errors.marketplaces && (
              <p className="text-xs text-[#B91C1C]">{errors.marketplaces}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="reg-payout" className="block text-xs font-medium text-[#0F172A]">
                Commission Payout Method
              </label>
              <select
                id="reg-payout"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="Wise Multi-Currency">Wise Multi-Currency</option>
                <option value="Bank Wire (SWIFT / IBAN)">Bank Wire (SWIFT / IBAN)</option>
                <option value="PayPal Business">PayPal Business</option>
                <option value="USDT (TRC-20)">USDT (TRC-20)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-country" className="block text-xs font-medium text-[#0F172A]">
                Destination Country / Region
              </label>
              <select
                id="reg-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="Tanzania / East Africa">Tanzania / East Africa</option>
                <option value="United States">United States</option>
                <option value="European Union">European Union</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada / Australia">Canada / Australia</option>
                <option value="Other International">Other International</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: undefined }));
                }}
                className="mt-0.5 rounded border-[#CBD5E1] text-[#1D4ED8] focus:ring-[#1D4ED8]"
              />
              <span>
                I confirm my affiliate referrals and wholesale orders comply with Alibaba, Pinduoduo, AliExpress, and Amazon partner terms.
              </span>
            </label>
            {errors.agreed && <p className="text-xs text-[#B91C1C]">{errors.agreed}</p>}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#475569]">
              Activates your personal Partner Ref ID immediately.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Complete Registration</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
