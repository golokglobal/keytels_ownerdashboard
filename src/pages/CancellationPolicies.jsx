import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertTriangle, XCircle, Star, Shield, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectPrimaryHotelId } from '../store/slices/userSlice';
import { fetchHotelById } from '../store/slices/PartnerHotelslice';
import { updatePartneredHotel } from '../api/partneredHotelsApi';
import {
  createCancellationPolicy,
  getHotelCancellationPolicies,
  deleteCancellationPolicy,
} from '../api/cancellationPolicyApi';
import { HotelSelector } from '../components/shared/HotelSelector';

// ─── Platform-defined templates ───────────────────────────────────────────────
const PLATFORM_TEMPLATES = [
  {
    key: 'FLEXIBLE',
    label: 'Flexible',
    tagline: 'Full refund up to 24 hours before check-in',
    color: '#16A34A',
    bgLight: '#F0FDF4',
    icon: CheckCircle2,
    rules: [
      { text: '100% refund if cancelled 24+ hours before check-in', positive: true },
      { text: 'No refund within 24 hours of check-in', positive: false },
      { text: 'No processing fee', positive: true },
    ],
    payload: {
      policyName: 'Flexible',
      policyType: 'FLEXIBLE',
      fullRefundEnabled: true,
      fullRefundHoursBefore: 24,
      fullRefundDaysBefore: null,
      partialRefundEnabled: false,
      partialRefundPercentage: null,
      partialRefundDaysBefore: null,
      partialRefundHoursBefore: null,
      noRefundAfterHours: 24,
      noRefundAfterDays: null,
      refundProcessingFee: 0,
      policyDescription: 'Full refund if cancelled at least 24 hours before check-in.',
      isActive: true,
      displayOrder: 1,
    },
  },
  {
    key: 'MODERATE',
    label: 'Moderate',
    tagline: 'Full refund 5 days out, 50% refund 2 days out',
    color: '#D97706',
    bgLight: '#FFFBEB',
    icon: AlertTriangle,
    rules: [
      { text: '100% refund if cancelled 5+ days before check-in', positive: true },
      { text: '50% refund if cancelled 2–5 days before check-in', positive: null },
      { text: 'No refund within 2 days of check-in', positive: false },
    ],
    payload: {
      policyName: 'Moderate',
      policyType: 'MODERATE',
      fullRefundEnabled: true,
      fullRefundHoursBefore: null,
      fullRefundDaysBefore: 5,
      partialRefundEnabled: true,
      partialRefundPercentage: 50,
      partialRefundDaysBefore: 2,
      partialRefundHoursBefore: null,
      noRefundAfterHours: null,
      noRefundAfterDays: 2,
      refundProcessingFee: 0,
      policyDescription: 'Full refund 5+ days before. 50% refund 2–5 days before. No refund within 2 days.',
      isActive: true,
      displayOrder: 2,
    },
  },
  {
    key: 'STRICT',
    label: 'Strict',
    tagline: 'Full refund 14 days out only',
    color: '#EA580C',
    bgLight: '#FFF7ED',
    icon: Shield,
    rules: [
      { text: '100% refund if cancelled 14+ days before check-in', positive: true },
      { text: '50% refund if cancelled 7–14 days before check-in', positive: null },
      { text: 'No refund within 7 days of check-in', positive: false },
    ],
    payload: {
      policyName: 'Strict',
      policyType: 'STRICT',
      fullRefundEnabled: true,
      fullRefundHoursBefore: null,
      fullRefundDaysBefore: 14,
      partialRefundEnabled: true,
      partialRefundPercentage: 50,
      partialRefundDaysBefore: 7,
      partialRefundHoursBefore: null,
      noRefundAfterHours: null,
      noRefundAfterDays: 7,
      refundProcessingFee: 0,
      policyDescription: 'Full refund 14+ days before. 50% refund 7–14 days before. No refund within 7 days.',
      isActive: true,
      displayOrder: 3,
    },
  },
  {
    key: 'NON_REFUNDABLE',
    label: 'Non-Refundable',
    tagline: 'No refunds under any circumstances',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    icon: XCircle,
    rules: [
      { text: 'No refunds for any cancellation', positive: false },
      { text: 'Guests pay in full regardless of when they cancel', positive: false },
      { text: 'Often shown at a lower price to attract bookings', positive: true },
    ],
    payload: {
      policyName: 'Non-Refundable',
      policyType: 'NON_REFUNDABLE',
      fullRefundEnabled: false,
      fullRefundHoursBefore: null,
      fullRefundDaysBefore: null,
      partialRefundEnabled: false,
      partialRefundPercentage: null,
      partialRefundDaysBefore: null,
      partialRefundHoursBefore: null,
      noRefundAfterHours: null,
      noRefundAfterDays: null,
      refundProcessingFee: 0,
      policyDescription: 'Non-refundable. No cancellations or refunds under any circumstances.',
      isActive: true,
      displayOrder: 4,
    },
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const CancellationPolicies = () => {
  const dispatch = useDispatch();
  const hotelId = useSelector(selectPrimaryHotelId);
  const activeHotel = useSelector((s) =>
    (s.partneredhotels?.hotels || []).find(
      (h) => (h.partneredHotelId || h.id) === hotelId
    )
  );
  const defaultPolicyId = activeHotel?.cancellationPolicyId || null;

  const [activePolicies, setActivePolicies] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [applying, setApplying] = useState(null);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const data = await getHotelCancellationPolicies(hotelId, false);
      setActivePolicies(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { load(); }, [load]);

  const activePolicy     = defaultPolicyId ? activePolicies.find((p) => p.policyId === defaultPolicyId) : null;
  const activeTemplateKey = activePolicy?.policyType || null;

  const handleApply = async (tmpl) => {
    if (!hotelId || applying) return;
    setApplying(tmpl.key);
    try {
      // Clear existing policies for this hotel
      for (const p of activePolicies) {
        try { await deleteCancellationPolicy(p.policyId); } catch { /* ignore */ }
      }
      // Create from template
      const created = await createCancellationPolicy(hotelId, tmpl.payload);
      // Set as hotel default
      await updatePartneredHotel(hotelId, { cancellationPolicyId: created.policyId });
      await dispatch(fetchHotelById(hotelId)).unwrap();
      await load();
      toast.success(`"${tmpl.label}" policy is now active for your hotel`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to apply policy');
    } finally {
      setApplying(null);
    }
  };

  if (!hotelId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cancellation Policies</h1>
          <p className="text-slate-500 text-sm mt-0.5">Choose a platform-approved policy for your hotel</p>
          <div className="mt-2"><HotelSelector /></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No hotel selected</h3>
          <p className="text-sm text-slate-500">Select a property to manage its cancellation policy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cancellation Policies</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Pick one platform-approved template. Guests see this policy at checkout and refunds are calculated automatically.
          </p>
          <div className="mt-2"><HotelSelector /></div>
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Active policy banner */}
      {activeTemplateKey && !loading && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Your hotel is using the <strong>{activePolicy?.policyName || activeTemplateKey}</strong> policy.
            Select a different template below to switch.
          </p>
        </div>
      )}

      {!activeTemplateKey && !loading && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>No cancellation policy set.</strong> Select one below so guests can book your hotel.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          These templates are defined by Desiney to keep policies consistent across all properties.
          Refund amounts are automatically calculated when a guest cancels.
        </p>
      </div>

      {/* Template Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {PLATFORM_TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          const isActive   = activeTemplateKey === tmpl.key;
          const isApplying = applying === tmpl.key;

          return (
            <div
              key={tmpl.key}
              style={{
                background: isActive ? tmpl.bgLight : '#fff',
                border: `2px solid ${isActive ? tmpl.color : '#E2E8F0'}`,
                borderRadius: 16,
                padding: 24,
                boxShadow: isActive ? `0 0 0 4px ${tmpl.color}15` : '0 1px 4px rgba(15,23,42,0.06)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${tmpl.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 21, height: 21, color: tmpl.color }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: 0 }}>{tmpl.label}</h3>
                    {isActive && (
                      <span style={{ background: tmpl.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0, marginTop: 2 }}>{tmpl.tagline}</p>
                </div>
              </div>

              {/* Rules */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tmpl.rules.map((rule, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569' }}>
                    {rule.positive === true  && <CheckCircle2 style={{ width: 15, height: 15, color: '#16A34A', flexShrink: 0, marginTop: 1 }} />}
                    {rule.positive === false && <XCircle      style={{ width: 15, height: 15, color: '#DC2626', flexShrink: 0, marginTop: 1 }} />}
                    {rule.positive === null  && <AlertTriangle style={{ width: 15, height: 15, color: '#D97706', flexShrink: 0, marginTop: 1 }} />}
                    {rule.text}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => !isActive && !applying && handleApply(tmpl)}
                disabled={isActive || !!applying}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  cursor: isActive || applying ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: isActive ? `${tmpl.color}18` : applying && !isApplying ? '#E2E8F0' : tmpl.color,
                  color: isActive ? tmpl.color : applying && !isApplying ? '#94A3B8' : '#fff',
                  transition: 'opacity 0.15s',
                }}
              >
                {isApplying ? (
                  <><Loader2 style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }} />Applying…</>
                ) : isActive ? (
                  <><Star style={{ width: 15, height: 15 }} />Currently Active</>
                ) : (
                  'Use This Policy'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default CancellationPolicies;
