import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Tag, Megaphone, Zap, Radio,
  ArrowUpRight, ArrowDownRight, Plus,
  BarChart3, Target, DollarSign, Users,
  Star, AlertCircle,
  ChevronRight, ToggleLeft, ToggleRight, RefreshCw, Info,
} from 'lucide-react';
import {
  fetchOwnerBilling, fetchOwnerDashboardAnalytics,
  selectBilling, selectOwnerDashboard, selectOwnerDashboardLoading,
} from '../store/slices/paymentsSlice';
import { fetchBookingSummary, selectBookingSummary } from '../store/slices/bookingSlice';
import api from '../config/axiosConfig';
import { isBillingSubscriptionActive } from '../utils/subscriptionUtils';

/* ─────────────────────────── helpers ─────────────────────────── */
const fmtMoney = (v) =>
  v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
const fmtPct = (v) => (v == null ? '—' : (v * 100).toFixed(1) + '%');

/* ─────────────────────────── SHARED ─────────────────────────── */
const Badge = ({ label, color }) => {
  const map = {
    active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    paused:   'bg-amber-100  text-amber-700  border-amber-200',
    ended:    'bg-slate-100  text-slate-500  border-slate-200',
    draft:    'bg-blue-100   text-blue-700   border-blue-200',
    pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    boosted:  'bg-purple-100 text-purple-700 border-purple-200',
    live:     'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100  text-slate-500  border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] || map.draft}`}>
      {(color === 'active' || color === 'live') && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
      )}
      {label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, change, up, color = 'indigo', loading }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    teal:   'bg-teal-50   text-teal-600',
    amber:  'bg-amber-50  text-amber-600',
    rose:   'bg-rose-50   text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald:'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">
          {loading ? <span className="text-slate-300">…</span> : value}
        </p>
        {change && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

const PlaceholderBanner = ({ title, desc }) => (
  <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
    <div>
      <p className="font-semibold text-slate-700">{title}</p>
      {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
    </div>
  </div>
);

/* ─────────────────────────── OVERVIEW TAB ─────────────────────────── */
function OverviewTab({ ownerDashboard, bookingSummary, loading }) {
  const totalRevenue    = ownerDashboard?.totalRevenue   ?? 0;
  const totalBookings   = bookingSummary?.totalBookings  ?? ownerDashboard?.totalBookings ?? 0;
  const confirmedB      = bookingSummary?.confirmedBookings ?? 0;
  const cancelledB      = bookingSummary?.cancelledBookings ?? 0;
  const pendingB        = bookingSummary?.pendingBookings   ?? 0;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const cancelRate      = totalBookings > 0 ? cancelledB / totalBookings : 0;

  // Daily revenue for the sparkline
  const dailyRev = Array.isArray(ownerDashboard?.dailyRevenue) ? ownerDashboard.dailyRevenue : [];
  const maxRev   = dailyRev.length > 0 ? Math.max(...dailyRev.map(d => d.revenue ?? 0), 1) : 1;
  const last7    = dailyRev.slice(-7);

  // Revenue by hotel
  const revenueByHotel = Array.isArray(ownerDashboard?.revenueByHotel) ? ownerDashboard.revenueByHotel : [];

  return (
    <div className="space-y-6">
      {/* KPI cards — real data */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue"      value={fmtMoney(totalRevenue)}    color="emerald" loading={loading} />
        <StatCard icon={Users}      label="Total Bookings"     value={fmtNum(totalBookings)}     color="teal"    loading={loading} />
        <StatCard icon={Star}       label="Avg. Booking Value" value={fmtMoney(avgBookingValue)} color="amber"   loading={loading} />
        <StatCard icon={Target}     label="Cancellation Rate"  value={fmtPct(cancelRate)}        color="rose"    loading={loading} />
      </div>

      {/* Revenue trend + hotel breakdown */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">

        {/* Daily revenue sparkline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-900">Revenue — Last 7 days</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading…' : `${fmtMoney(totalRevenue)} total period`}
              </p>
            </div>
          </div>
          {last7.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-28 text-slate-400 text-sm">
              No revenue data yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-28">
              {(last7.length > 0 ? last7 : Array(7).fill({ revenue: 0, date: '' })).map((d, i) => {
                const h = maxRev > 0 ? Math.max(4, (d.revenue / maxRev) * 100) : 4;
                const label = d.date
                  ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
                  : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${fmtMoney(d.revenue)}`}>
                    <div
                      className="w-full rounded-t-md bg-emerald-500 transition-all"
                      style={{ height: `${h}%`, opacity: loading ? 0.3 : 1 }}
                    />
                    <span className="text-[9px] text-slate-400">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by hotel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-3">Revenue by Property</p>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : revenueByHotel.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No hotel data available</p>
          ) : (
            <div className="space-y-2.5">
              {revenueByHotel.slice(0, 5).map((h, i) => {
                const maxH = Math.max(...revenueByHotel.map(x => x.revenue ?? 0), 1);
                const pct  = maxH > 0 ? ((h.revenue ?? 0) / maxH) * 100 : 0;
                return (
                  <div key={h.hotelId || i} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-800 truncate pr-2">{h.hotelName || `Hotel ${i+1}`}</p>
                      <span className="text-xs font-bold text-emerald-700 shrink-0">{fmtMoney(h.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking funnel — real data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-900 mb-4">Booking Funnel</p>
        <div className="grid grid-cols-4 gap-0 text-center text-sm relative">
          {[
            { label: 'Total Bookings', value: fmtNum(totalBookings) },
            { label: 'Confirmed',      value: fmtNum(confirmedB)    },
            { label: 'Pending',        value: fmtNum(pendingB)      },
            { label: 'Cancelled',      value: fmtNum(cancelledB)    },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center relative">
              {i > 0 && <ChevronRight className="absolute -left-2 top-3 w-4 h-4 text-slate-300" />}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${
                i === 0 ? 'bg-emerald-50 border border-emerald-100' :
                i === 3 ? 'bg-red-50 border border-red-100' :
                          'bg-indigo-50 border border-indigo-100'
              }`}>
                <p className={`text-sm font-extrabold leading-tight ${
                  i === 0 ? 'text-emerald-700' : i === 3 ? 'text-red-600' : 'text-indigo-700'
                }`}>
                  {loading ? '…' : s.value}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PROMOTIONS TAB ─────────────────────────── */
function PromotionsTab({ coupons, couponsLoading, onDeactivate }) {
  const active   = coupons.filter(c => c.active);
  const inactive = coupons.filter(c => !c.active);

  const fmtDiscount = (c) => {
    if (!c.discountValue) return '—';
    return c.discountType === 'PERCENT'
      ? `${c.discountValue}% off`
      : `$${c.discountValue} off`;
  };
  const fmtExpiry = (dt) => {
    if (!dt) return 'No expiry';
    try { return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dt; }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Active discount codes and promotions on your properties.</p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Active',   count: active.length,   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Inactive', count: inactive.length, color: 'bg-slate-50 text-slate-500 border-slate-200'       },
          { label: 'Total Uses', count: coupons.reduce((s, c) => s + (c.usageCount ?? 0), 0), color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        ].map(p => (
          <div key={p.label} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${p.color}`}>
            {p.label} <span className="font-extrabold">{p.count}</span>
          </div>
        ))}
      </div>

      {couponsLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No coupons yet</p>
          <p className="text-sm text-slate-400 mt-1">Coupons are created from the Billing Admin panel.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Code', 'Discount', 'Type', 'Used / Limit', 'Expires', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map(c => (
                <tr key={c.couponId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-xs font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">{c.code}</code>
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{fmtDiscount(c)}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{(c.discountType || '—').toLowerCase()}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-800 font-medium">{c.usageCount ?? 0}</span>
                    <span className="text-slate-400"> / {c.usageLimit ?? '∞'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtExpiry(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <Badge label={c.active ? 'Active' : 'Inactive'} color={c.active ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── CAMPAIGNS TAB ─────────────────────────── */
function CampaignsTab() {
  return (
    <div className="space-y-5">
      <PlaceholderBanner
        title="No ad platform connected"
        desc="Campaigns are managed through external platforms (Meta, Google Ads, LinkedIn). Connect your ad account to sync performance data here."
      />
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="font-semibold text-slate-700 text-lg">Paid Campaigns</p>
        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
          Once you connect an ad platform, campaign performance — impressions, clicks, spend, and ROAS — will appear here automatically.
        </p>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> Connect Ad Platform
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── ACCELERATOR TAB ─────────────────────────── */
function AcceleratorTab({ billing }) {
  const commissionRate = billing?.plan?.commissionRate;
  const commissionPct  = commissionRate != null ? `${Math.round(commissionRate * 100)}%` : null;
  const subStatus      = billing?.subscriptionStatus?.toUpperCase();
  const isActive       = isBillingSubscriptionActive(billing);

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
        <Zap className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-900">What is Accelerator?</p>
          <p className="text-xs text-purple-700 mt-0.5 leading-relaxed">
            Accelerator boosts your property's search ranking via priority placement. A platform commission applies to
            every booking made through Desiney. Your current rate is shown below.
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Platform Status</p>
            <Badge label={isActive ? 'Active' : (subStatus || 'Unknown')} color={isActive ? 'active' : 'paused'} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isActive
              ? <ToggleRight className="w-8 h-8 text-purple-600" />
              : <ToggleLeft  className="w-8 h-8 text-slate-400" />
            }
            <div>
              <p className="text-xs text-slate-500">Subscription: {subStatus || '—'}</p>
              <p className="text-sm font-bold text-slate-900">
                Commission:{' '}
                <span className={commissionPct ? 'text-purple-700' : 'text-slate-400'}>
                  {commissionPct ?? 'Not set'}
                </span>
              </p>
            </div>
          </div>
          {billing?.subscriptionCurrentPeriodEnd && (
            <div className="border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Period ends</span>
                <span className="font-semibold">
                  {new Date(billing.subscriptionCurrentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-3">How commission works</p>
          <div className="space-y-3 text-sm text-slate-600">
            {[
              ['Guest books your hotel', 'Booking confirmed in Desiney'],
              [`Platform takes ${commissionPct ?? '…'}`, 'Deducted from your payout'],
              ['Rest transferred to you', 'Via your connected bank account'],
            ].map(([step, note], i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                <div>
                  <p className="font-medium text-slate-800">{step}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── TRAVEL ADS TAB ─────────────────────────── */
function TravelAdsTab() {
  return (
    <div className="space-y-5">
      <PlaceholderBanner
        title="Sponsored placements coming soon"
        desc="TravelAds — Desiney's internal sponsored search and destination page placements — will be available in a future release."
      />
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Radio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="font-semibold text-slate-700 text-lg">TravelAds</p>
        <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
          Sponsored placements across Desiney search results, destination pages, and email campaigns will be manageable from here.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
const TABS = [
  { key: 'overview',    label: 'Overview',    icon: BarChart3  },
  { key: 'promotions',  label: 'Promotions',  icon: Tag        },
  { key: 'campaigns',   label: 'Campaigns',   icon: Megaphone  },
  { key: 'accelerator', label: 'Accelerator', icon: Zap        },
  { key: 'travelads',   label: 'TravelAds',   icon: Radio      },
];

export const Marketing = () => {
  const dispatch   = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab  = searchParams.get('tab') || 'overview';
  const setTab     = (key) => setSearchParams({ tab: key });

  // Auth
  const ownerId = localStorage.getItem('userId');
  const hotelId = localStorage.getItem('hotelId');

  // Redux state — real data from slices
  const ownerDashboard = useSelector(selectOwnerDashboard);
  const billing        = useSelector(selectBilling);
  const dashLoading    = useSelector(selectOwnerDashboardLoading);
  const bookingSummary = useSelector(selectBookingSummary);

  // Local state for coupons (not in Redux)
  const [coupons,        setCoupons]        = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [error,          setError]          = useState(null);

  const loadData = useCallback(async () => {
    if (!ownerId) return;
    setError(null);

    // Dispatch Redux thunks
    await Promise.allSettled([
      dispatch(fetchOwnerDashboardAnalytics({ ownerId })),
      dispatch(fetchOwnerBilling(ownerId)),
      hotelId ? dispatch(fetchBookingSummary(hotelId)) : Promise.resolve(),
    ]);

    // Coupons — not in Redux, fetch locally
    setCouponsLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, [ownerId, hotelId, dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  const renderTab = () => {
    switch (activeTab) {
      case 'promotions':
        return <PromotionsTab coupons={coupons} couponsLoading={couponsLoading} />;
      case 'campaigns':
        return <CampaignsTab />;
      case 'accelerator':
        return <AcceleratorTab billing={billing} />;
      case 'travelads':
        return <TravelAdsTab />;
      default:
        return (
          <OverviewTab
            ownerDashboard={ownerDashboard}
            bookingSummary={bookingSummary}
            loading={dashLoading}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance metrics, promotions, and platform tools.</p>
        </div>
        <button onClick={loadData} disabled={dashLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${dashLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px hide-scrollbar">
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
};
