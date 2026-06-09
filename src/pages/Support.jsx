import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, AlertCircle, X, Ticket, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, MessageSquare, Tag,
  Calendar, UserCheck, ChevronRight as Arrow,
} from 'lucide-react';
import { DataTable } from '../components/shared/DataTable';
import { SupportSkeleton } from '../components/common/Skeleton';
import { loadTickets, addTicket } from '../store/slices/supportSlice';
import { selectPrimaryHotelId } from '../store/slices/userSlice';
import { createTicket } from '../api/support';

const CATEGORIES = [
  { value: 'PAYOUT',      label: 'Payout Issue',          desc: 'Missing or incorrect payouts' },
  { value: 'BILLING',     label: 'Billing / Subscription', desc: 'Invoices, plan changes, charges' },
  { value: 'PLATFORM',    label: 'Platform / Technical',  desc: 'Bugs, downtime, access issues' },
  { value: 'ROOM',        label: 'Room Issue',            desc: 'Guest complaint about a room' },
  { value: 'HOTEL_ISSUE', label: 'Hotel Complaint',       desc: 'General hotel-related feedback' },
  { value: 'OTHER',       label: 'Other',                 desc: 'Anything not listed above' },
];

const norm = (s) => (s || '').toLowerCase().replace(/[\s_-]+/g, '-');

const PRIORITY_STYLES = {
  high:   { pill: 'bg-red-50 text-red-700 ring-1 ring-red-200',    dot: 'bg-red-500' },
  medium: { pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-400' },
  low:    { pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
};

const STATUS_STYLES = {
  open:          { pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',   dot: 'bg-blue-500' },
  'in-progress': { pill: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-500' },
  'in progress': { pill: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-500' },
  resolved:      { pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  closed:        { pill: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', dot: 'bg-slate-400' },
};

const Badge = ({ text, styleKey, map }) => {
  const s = map[norm(text)] || { pill: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {text}
    </span>
  );
};

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all bg-white';

export const Support = () => {
  const dispatch  = useDispatch();
  const hotelId   = useSelector(selectPrimaryHotelId);
  const ownerId   = useSelector((state) => state.user?.userId);
  const { tickets, loading, error } = useSelector((state) => state.support);

  const [showForm, setShowForm]       = useState(false);
  const [subject, setSubject]         = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('PAYOUT');
  const [priority, setPriority]       = useState('Medium');
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [success, setSuccess]         = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    dispatch(loadTickets(hotelId ? { hotelId } : {}));
  }, [hotelId]);

  const closeForm = () => {
    setShowForm(false);
    setSuccess(false);
    setSubject('');
    setDescription('');
    setCategory('PAYOUT');
    setPriority('Medium');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setFormError('Subject and description are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const body = { subject: subject.trim(), description: description.trim(), category, priority };
      if (hotelId && ['ROOM', 'HOTEL_ISSUE'].includes(category)) body.hotelId = hotelId;
      if (ownerId) body.raisedByUserId = ownerId;
      const result = await createTicket(body);
      dispatch(addTicket(result.ticket));
      setSuccess(true);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Open',          value: tickets.filter(t => norm(t.status) === 'open').length,                   icon: Ticket,       from: 'from-blue-500',   to: 'to-blue-600',   bg: 'bg-blue-50',    text: 'text-blue-700'    },
    { label: 'In Progress',   value: tickets.filter(t => ['in-progress','in progress'].includes(norm(t.status))).length, icon: Clock, from: 'from-violet-500', to: 'to-violet-600', bg: 'bg-violet-50',  text: 'text-violet-700'  },
    { label: 'Resolved',      value: tickets.filter(t => norm(t.status) === 'resolved').length,               icon: CheckCircle2, from: 'from-emerald-500',to: 'to-emerald-600',bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'High Priority', value: tickets.filter(t => norm(t.priority) === 'high').length,                 icon: AlertTriangle,from: 'from-red-500',    to: 'to-red-600',    bg: 'bg-red-50',     text: 'text-red-700'     },
  ];

  const columns = [
    {
      header: 'Ticket',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{row.subject}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.ticketNumber || row.id?.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
          <Tag className="w-3 h-3" />
          {row.category || '—'}
        </span>
      ),
    },
    { header: 'Priority', render: (row) => <Badge text={row.priority} styleKey={norm(row.priority)} map={PRIORITY_STYLES} /> },
    { header: 'Status',   render: (row) => <Badge text={row.status}   styleKey={norm(row.status)}   map={STATUS_STYLES}    /> },
    {
      header: 'Handler',
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.assignedAgent || (row.assignedToRole === 'OWNER' ? 'Your team' : 'Support team')}
        </span>
      ),
    },
    {
      header: 'Raised',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      header: '',
      render: () => <ChevronRight className="w-4 h-4 text-slate-300" />,
    },
  ];

  if (loading) return <SupportSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Raise and track issues with the Desiney team</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-200 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, from, to, bg, text }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${text}`} />
              </div>
            </div>
            <p className={`text-3xl font-black ${text}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">All Tickets</h2>
            <span className="ml-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">{tickets.length}</span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">No tickets yet</p>
            <p className="text-slate-400 text-sm mt-1">Click <strong>New Ticket</strong> to raise a support request.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Plus className="w-4 h-4" /> Raise a Ticket
            </button>
          </div>
        ) : (
          <DataTable columns={columns} data={tickets} onRowClick={setSelectedTicket} />
        )}
      </motion.div>

      {/* ── Ticket Detail Panel ────────────────────────────── */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-y-auto"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="w-4 h-4 text-white/70" />
                    <span className="text-xs font-mono font-bold text-white/70">
                      {selectedTicket.ticketNumber || selectedTicket.id?.slice(0, 8)?.toUpperCase()}
                    </span>
                    <Badge text={selectedTicket.status} styleKey={norm(selectedTicket.status)} map={STATUS_STYLES} />
                  </div>
                  <h3 className="text-white font-bold text-base leading-snug">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* body */}
              <div className="flex-1 px-5 py-5 space-y-5">

                {/* meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Category',   value: selectedTicket.category || '—' },
                    { label: 'Priority',   value: <Badge text={selectedTicket.priority} styleKey={norm(selectedTicket.priority)} map={PRIORITY_STYLES} /> },
                    { label: 'Raised',     value: selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—' },
                    { label: 'Handled by', value: selectedTicket.assignedAgent || 'Support team' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                      <div className="text-sm font-semibold text-slate-800">{value}</div>
                    </div>
                  ))}
                </div>

                {/* description */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Description</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.summary || selectedTicket.description || 'No description provided.'}
                  </div>
                </div>

                {/* admin replies */}
                {selectedTicket.replies?.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Replies ({selectedTicket.replies.length})
                    </p>
                    <div className="space-y-3">
                      {selectedTicket.replies.map((r, i) => (
                        <div key={i} className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-violet-700">{r.author || 'Support Team'}</span>
                            <span className="text-[11px] text-slate-400">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">No replies yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Our support team will reply within 24 hours.</p>
                  </div>
                )}

                {/* resolution */}
                {selectedTicket.resolution && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Resolution</p>
                    <p className="text-sm text-emerald-800 leading-relaxed">{selectedTicket.resolution}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Ticket Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white">New Support Ticket</h2>
                </div>
                <button onClick={closeForm} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {success ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900">Ticket Submitted!</h3>
                  <p className="text-slate-500 text-sm mt-2">Your ticket has been received. Our team will respond within 24 hours.</p>
                  <button onClick={closeForm}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                    Done
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">{CATEGORIES.find(c => c.value === category)?.desc}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Priority</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                        {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Subject <span className="text-red-400">*</span></label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Payout not received for last week"
                      className={inputCls} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description <span className="text-red-400">*</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe your issue in as much detail as possible. Include any relevant booking IDs, dates, or amounts."
                      rows={4} className={`${inputCls} resize-none`} />
                  </div>

                  {formError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {formError}
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-1 pb-2">
                    <button type="submit" disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-violet-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting…
                        </span>
                      ) : 'Submit Ticket'}
                    </button>
                    <button type="button" onClick={closeForm}
                      className="px-5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
