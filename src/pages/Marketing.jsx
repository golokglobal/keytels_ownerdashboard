import { useSearchParams } from 'react-router-dom';
import {
  Tag, TrendingUp, Megaphone, Zap, Radio,
  ArrowUpRight, ArrowDownRight, Plus, Edit2, Pause, Play,
  Trash2, Eye, BarChart3, Target, DollarSign, Users,
  Star, Calendar, Clock, CheckCircle2, AlertCircle,
  ChevronRight, ToggleLeft, ToggleRight, Info,
} from 'lucide-react';

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
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] || map.draft}`}>
      {color === 'active' || color === 'live' ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> : null}
      {label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, change, up, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    teal:   'bg-teal-50   text-teal-600',
    amber:  'bg-amber-50  text-amber-600',
    rose:   'bg-rose-50   text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {change && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change} vs last month
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

/* ─────────────────────────── OVERVIEW TAB ─────────────────────────── */
const MINI_BARS = [42, 68, 55, 80, 73, 91, 84];
const WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ACTIVE_CAMPAIGNS_SUMMARY = [
  { name: 'Summer Drive',          type: 'TravelAds',   status: 'active',  roas: '5.1x', spend: '₹18,400' },
  { name: 'Weekend Flash Sale',    type: 'Promotion',   status: 'active',  roas: '4.2x', spend: '₹6,200'  },
  { name: 'Business Traveler Pro', type: 'Campaign',    status: 'active',  roas: '3.8x', spend: '₹12,800' },
  { name: 'Visibility Boost Q2',   type: 'Accelerator', status: 'boosted', roas: '—',    spend: '₹9,500'  },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye}       label="Total Impressions" value="1.24M"  change="+14%"  up color="indigo" />
        <StatCard icon={Users}     label="Clicks"            value="38,410" change="+9%"   up color="teal"   />
        <StatCard icon={Target}    label="Conversion Rate"   value="3.8%"   change="+0.4%" up color="amber"  />
        <StatCard icon={BarChart3} label="Avg. ROAS"         value="4.2x"   change="+0.6x" up color="purple" />
      </div>

      {/* Chart + active campaigns */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Impressions chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-900">Impressions — Last 7 days</p>
              <p className="text-xs text-slate-400 mt-0.5">Across all active campaigns</p>
            </div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full">+14% WoW</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {MINI_BARS.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-indigo-500 transition-all"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[9px] text-slate-400">{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active campaigns */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-3">Active Campaigns</p>
          <div className="space-y-2.5">
            {ACTIVE_CAMPAIGNS_SUMMARY.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-tight">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.roas !== '—' && <span className="text-xs font-semibold text-emerald-600">{c.roas}</span>}
                  <Badge label={c.status.charAt(0).toUpperCase() + c.status.slice(1)} color={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-900 mb-4">Conversion Funnel</p>
        <div className="grid grid-cols-4 gap-0 text-center text-sm relative">
          {[
            { label: 'Impressions', value: '1.24M', pct: null },
            { label: 'Clicks',      value: '38,410', pct: '3.1%' },
            { label: 'Inquiries',   value: '4,820',  pct: '12.6%' },
            { label: 'Bookings',    value: '1,460',  pct: '30.3%' },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center relative">
              {i > 0 && (
                <ChevronRight className="absolute -left-2 top-3 w-4 h-4 text-slate-300" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-2">
                <p className="text-sm font-extrabold text-indigo-700 leading-tight">{s.value}</p>
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              {s.pct && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">CVR {s.pct}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PROMOTIONS TAB ─────────────────────────── */
const PROMOTIONS = [
  {
    id: 1, name: 'Early Bird Discount', type: 'Rate plan', discount: '15% off',
    minStay: '2 nights', validFrom: 'May 1', validTo: 'Jun 30', rooms: 'All rooms',
    bookings: 142, revenue: '₹2,84,000', status: 'active',
  },
  {
    id: 2, name: 'Weekend Flash Sale', type: 'Limited time', discount: '20% off',
    minStay: '1 night', validFrom: 'Jun 7', validTo: 'Jun 9', rooms: 'Deluxe & Suite',
    bookings: 34, revenue: '₹68,000', status: 'active',
  },
  {
    id: 3, name: 'Long Stay Special', type: 'Length of stay', discount: '25% off',
    minStay: '7 nights', validFrom: 'Apr 1', validTo: 'Jul 31', rooms: 'All rooms',
    bookings: 61, revenue: '₹3,05,000', status: 'active',
  },
  {
    id: 4, name: 'Last Minute Deal', type: 'Last minute', discount: '30% off',
    minStay: '1 night', validFrom: 'Rolling', validTo: '48h window', rooms: 'Standard',
    bookings: 89, revenue: '₹1,24,600', status: 'active',
  },
  {
    id: 5, name: 'Monsoon Retreat', type: 'Seasonal', discount: '18% off',
    minStay: '3 nights', validFrom: 'Jul 15', validTo: 'Sep 15', rooms: 'All rooms',
    bookings: 0, revenue: '—', status: 'draft',
  },
  {
    id: 6, name: 'New Year Bonanza', type: 'Event', discount: '10% off',
    minStay: '2 nights', validFrom: 'Dec 28', validTo: 'Jan 2', rooms: 'All rooms',
    bookings: 210, revenue: '₹5,25,000', status: 'ended',
  },
];

function PromotionsTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Manage rate promotions and limited-time offers across your properties.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Active',    count: 4, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Draft',     count: 1, color: 'bg-blue-50 text-blue-700 border-blue-200'          },
          { label: 'Ended',     count: 1, color: 'bg-slate-50 text-slate-500 border-slate-200'        },
          { label: 'Total bookings from promos', count: '536', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        ].map((p) => (
          <div key={p.label} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${p.color}`}>
            {p.label} <span className="font-extrabold">{p.count}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Promotion', 'Type', 'Discount', 'Min. Stay', 'Valid Period', 'Rooms', 'Bookings', 'Revenue', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PROMOTIONS.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.type}</td>
                <td className="px-4 py-3 font-semibold text-indigo-700">{p.discount}</td>
                <td className="px-4 py-3 text-slate-500">{p.minStay}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.validFrom} – {p.validTo}</td>
                <td className="px-4 py-3 text-slate-500">{p.rooms}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.bookings}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.revenue}</td>
                <td className="px-4 py-3"><Badge label={p.status.charAt(0).toUpperCase() + p.status.slice(1)} color={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    {p.status === 'active'
                      ? <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pause className="w-3.5 h-3.5" /></button>
                      : p.status === 'draft'
                      ? <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /></button>
                      : null
                    }
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── CAMPAIGNS TAB ─────────────────────────── */
const CAMPAIGNS = [
  {
    id: 1, name: 'Summer Drive', channel: 'Meta + Google', status: 'active',
    budget: '₹40,000', spend: '₹18,400', pct: 46,
    impressions: '4,12,000', clicks: '12,340', ctr: '3.0%', roas: '5.1x',
    startDate: 'Jun 1', endDate: 'Jun 30', tags: ['Brand', 'Leisure'],
  },
  {
    id: 2, name: 'Business Traveler Pro', channel: 'LinkedIn', status: 'active',
    budget: '₹25,000', spend: '₹12,800', pct: 51,
    impressions: '2,80,000', clicks: '8,200', ctr: '2.9%', roas: '3.8x',
    startDate: 'May 15', endDate: 'Jun 30', tags: ['Corporate', 'B2B'],
  },
  {
    id: 3, name: 'Family Package Push', channel: 'Facebook', status: 'paused',
    budget: '₹15,000', spend: '₹8,900', pct: 59,
    impressions: '1,60,000', clicks: '4,100', ctr: '2.6%', roas: '3.1x',
    startDate: 'May 1', endDate: 'May 31', tags: ['Family', 'Weekend'],
  },
  {
    id: 4, name: 'Monsoon Escape', channel: 'Google Ads', status: 'draft',
    budget: '₹30,000', spend: '₹0', pct: 0,
    impressions: '—', clicks: '—', ctr: '—', roas: '—',
    startDate: 'Jul 15', endDate: 'Aug 31', tags: ['Seasonal'],
  },
];

function CampaignsTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Paid campaign performance across Meta, Google, LinkedIn and more.</p>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Megaphone}  label="Active Campaigns" value="2"        color="indigo" />
        <StatCard icon={DollarSign} label="Total Spend"      value="₹40,100"  change="+22%" up color="teal"   />
        <StatCard icon={Eye}        label="Total Reach"      value="8.52L"    change="+18%" up color="purple" />
        <StatCard icon={BarChart3}  label="Avg. ROAS"        value="4.5x"     change="+0.8x" up color="amber" />
      </div>

      <div className="space-y-4">
        {CAMPAIGNS.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <Badge label={c.status.charAt(0).toUpperCase() + c.status.slice(1)} color={c.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{c.channel}</span>
                  <span>·</span>
                  <span><Calendar className="inline w-3 h-3 mr-0.5" />{c.startDate} – {c.endDate}</span>
                  {c.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                {c.status === 'active'
                  ? <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pause className="w-3.5 h-3.5" /></button>
                  : c.status === 'paused' || c.status === 'draft'
                  ? <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /></button>
                  : null
                }
              </div>
            </div>

            {/* Budget bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Budget utilisation</span>
                <span className="font-semibold text-slate-700">{c.spend} <span className="font-normal">of {c.budget}</span></span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <p className="text-right text-[11px] text-slate-400 mt-0.5">{c.pct}% used</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Impressions', value: c.impressions },
                { label: 'Clicks',      value: c.clicks      },
                { label: 'CTR',         value: c.ctr         },
                { label: 'ROAS',        value: c.roas        },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{m.label}</p>
                  <p className="text-sm font-bold text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── ACCELERATOR TAB ─────────────────────────── */
const ACCEL_HISTORY = [
  { week: 'May 26 – Jun 1',  boost: '18%', impressions: '42,800', ctr: '3.4%', bookings: 28, cost: '₹3,200' },
  { week: 'Jun 2 – Jun 8',   boost: '22%', impressions: '51,400', ctr: '3.8%', bookings: 36, cost: '₹3,900' },
  { week: 'Jun 9 – Jun 15',  boost: '20%', impressions: '48,100', ctr: '3.6%', bookings: 31, cost: '₹3,600' },
  { week: 'Jun 16 – Jun 22', boost: '25%', impressions: '58,700', ctr: '4.1%', bookings: 44, cost: '₹4,500' },
];

function AcceleratorTab() {
  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
        <Zap className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-900">What is Accelerator?</p>
          <p className="text-xs text-purple-700 mt-0.5 leading-relaxed">
            Accelerator boosts your property's search ranking by bidding for premium placement. You only pay when a guest books.
            Set a commission rate and Desiney automatically competes for top slots during high-demand periods.
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Accelerator Status</p>
            <Badge label="Boosted" color="boosted" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ToggleRight className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-xs text-slate-500">Currently active</p>
              <p className="text-sm font-bold text-slate-900">Commission: <span className="text-purple-700">12%</span></p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>This month spend</span><span className="font-semibold">₹15,200</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Incremental bookings</span><span className="font-semibold">139</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Avg. rank position</span><span className="font-semibold text-purple-700">#2.4</span>
            </div>
          </div>
          <button className="mt-auto w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Adjust Commission Rate
          </button>
        </div>

        <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-4">Competitor Position Tracker</p>
          <div className="space-y-2.5">
            {[
              { name: 'Your Property',   rank: 2,  score: 88, highlight: true },
              { name: 'Sunrise Residency', rank: 1, score: 93, highlight: false },
              { name: 'Park View Inn',   rank: 3,  score: 82, highlight: false },
              { name: 'Grand Palace',    rank: 4,  score: 76, highlight: false },
              { name: 'City Nest Hotel', rank: 5,  score: 71, highlight: false },
            ].map((c) => (
              <div key={c.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${c.highlight ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-100'}`}>
                <span className={`text-sm font-bold w-5 ${c.highlight ? 'text-purple-700' : 'text-slate-400'}`}>#{c.rank}</span>
                <p className={`text-sm font-medium flex-1 ${c.highlight ? 'text-purple-900' : 'text-slate-700'}`}>{c.name}</p>
                <div className="flex items-center gap-2 w-28">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.highlight ? 'bg-purple-500' : 'bg-slate-400'}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">{c.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly history */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900">Weekly Performance History</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Week', 'Visibility Boost', 'Impressions', 'CTR', 'Bookings', 'Cost'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ACCEL_HISTORY.map((row) => (
              <tr key={row.week} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-slate-600">{row.week}</td>
                <td className="px-5 py-3 font-semibold text-purple-700">+{row.boost}</td>
                <td className="px-5 py-3 text-slate-700">{row.impressions}</td>
                <td className="px-5 py-3 text-slate-700">{row.ctr}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{row.bookings}</td>
                <td className="px-5 py-3 text-slate-700">{row.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── TRAVEL ADS TAB ─────────────────────────── */
const AD_PLACEMENTS = [
  {
    id: 1, name: 'Desiney Search — Top Slot', placement: 'Search results #1',
    status: 'live', impressions: '1,84,200', clicks: '9,210', ctr: '5.0%',
    spend: '₹8,400', budget: '₹12,000', pct: 70, cpc: '₹0.91',
  },
  {
    id: 2, name: 'Destination Page — Banner', placement: 'Mumbai destination page',
    status: 'live', impressions: '92,100', clicks: '3,110', ctr: '3.4%',
    spend: '₹4,200', budget: '₹8,000', pct: 53, cpc: '₹1.35',
  },
  {
    id: 3, name: 'Similar Property Sidebar', placement: 'Competitor pages',
    status: 'paused', impressions: '61,000', clicks: '1,440', ctr: '2.4%',
    spend: '₹3,100', budget: '₹6,000', pct: 52, cpc: '₹2.15',
  },
  {
    id: 4, name: 'Email Newsletter Spot', placement: 'Weekly digest',
    status: 'live', impressions: '38,500', clicks: '2,310', ctr: '6.0%',
    spend: '₹1,900', budget: '₹3,000', pct: 63, cpc: '₹0.82',
  },
];

function TravelAdsTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Sponsored placements across Desiney search, destination pages, and email.</p>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> Create Ad
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Radio}      label="Live Ads"          value="3"        color="indigo" />
        <StatCard icon={Eye}        label="Total Impressions" value="3.76L"    change="+11%" up color="teal"   />
        <StatCard icon={Users}      label="Total Clicks"      value="16,070"   change="+8%"  up color="amber"  />
        <StatCard icon={DollarSign} label="Total Spend"       value="₹17,600"  change="+15%" up color="purple" />
      </div>

      <div className="space-y-4">
        {AD_PLACEMENTS.map((ad) => (
          <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="font-semibold text-slate-900">{ad.name}</p>
                  <Badge label={ad.status === 'live' ? 'Live' : 'Paused'} color={ad.status === 'live' ? 'live' : 'paused'} />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Target className="w-3 h-3" /> {ad.placement}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                {ad.status === 'live'
                  ? <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pause className="w-3.5 h-3.5" /></button>
                  : <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /></button>
                }
              </div>
            </div>

            {/* Budget bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Budget used</span>
                <span className="font-semibold text-slate-700">{ad.spend} <span className="font-normal">of {ad.budget}</span></span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${ad.pct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Impressions', value: ad.impressions },
                { label: 'Clicks',      value: ad.clicks      },
                { label: 'CTR',         value: ad.ctr         },
                { label: 'Avg. CPC',    value: ad.cpc         },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{m.label}</p>
                  <p className="text-sm font-bold text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (key) => setSearchParams({ tab: key });

  const renderTab = () => {
    switch (activeTab) {
      case 'promotions':  return <PromotionsTab />;
      case 'campaigns':   return <CampaignsTab />;
      case 'accelerator': return <AcceleratorTab />;
      case 'travelads':   return <TravelAdsTab />;
      default:            return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage promotions, paid campaigns, accelerator bids, and sponsored ads.</p>
      </div>

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
