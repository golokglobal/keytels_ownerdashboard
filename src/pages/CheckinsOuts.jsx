import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn, LogOut, RefreshCw, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { HotelSelector } from '../components/shared/HotelSelector';
import { DataTable } from '../components/shared/DataTable';
import { selectPrimaryHotelId } from '../store/slices/userSlice';
import {
  fetchTodayCheckIns,
  fetchTodayCheckOuts,
  selectTodayCheckIns,
  selectTodayCheckOuts,
  selectBookingsLoading,
} from '../store/slices/bookingSlice';
import { checkInBooking } from '../api/bookings';

const getGuestName = (booking) => {
  if (booking?.guest) {
    const { firstName, lastName, email, phoneNumber } = booking.guest;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (email) return email;
    if (phoneNumber) return phoneNumber;
  }
  return booking?.guestName || 'Guest';
};

const bookingIdShort = (id) => (id ? `${id.substring(0, 8)}…` : '—');

// ─── Confirm Check-In Button ──────────────────────────────────────────────────
function ConfirmCheckInBtn({ booking, onDone }) {
  const bookingId = booking?.bookingId;
  const alreadyCheckedIn =
    booking?.bookingStatus?.toUpperCase() === 'CHECKED_IN' ||
    booking?.bookingStatus?.toUpperCase() === 'COMPLETED';

  const [status, setStatus] = useState(alreadyCheckedIn ? 'done' : 'idle');
  const [errMsg, setErrMsg] = useState('');

  const handleConfirm = useCallback(async () => {
    if (!bookingId || status === 'loading' || status === 'done') return;
    setStatus('loading');
    setErrMsg('');
    try {
      // Check-in the booking. The backend automatically releases the Stripe
      // transfer to the owner's connected account as part of this call.
      await checkInBooking(bookingId);
      setStatus('done');
      onDone?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Check-in failed';
      setErrMsg(msg);
      setStatus('error');
    }
  }, [bookingId, status, onDone]);

  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Checked In
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleConfirm}
        disabled={status === 'loading'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${status === 'loading'
            ? 'bg-amber-50 text-amber-400 border border-amber-200 cursor-not-allowed'
            : status === 'error'
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-amber-500 text-white border border-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md active:scale-95'
          }`}
      >
        {status === 'loading' ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Confirming…</>
        ) : status === 'error' ? (
          <><AlertCircle className="w-3.5 h-3.5" />Retry</>
        ) : (
          <><LogIn className="w-3.5 h-3.5" />Confirm Check-In</>
        )}
      </button>
      {status === 'error' && errMsg && (
        <p className="text-xs text-red-500 max-w-[160px] leading-tight">{errMsg}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const CheckinsOuts = () => {
  const dispatch = useDispatch();
  const activeHotelId  = useSelector(selectPrimaryHotelId);
  const todayCheckIns  = useSelector(selectTodayCheckIns)  || [];
  const todayCheckOuts = useSelector(selectTodayCheckOuts) || [];
  const loading = useSelector(selectBookingsLoading);
  const [activeTab, setActiveTab] = useState('checkins');

  const load = useCallback(() => {
    if (!activeHotelId) return;
    dispatch(fetchTodayCheckIns(activeHotelId));
    dispatch(fetchTodayCheckOuts(activeHotelId));
  }, [activeHotelId, dispatch]);

  useEffect(() => {
    if (activeHotelId) load();
  }, [activeHotelId, load]);

  // ─── Check-in columns (with Confirm button) ─────────────────────────────
  const checkInColumns = useMemo(() => [
    {
      header: 'Booking ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">{bookingIdShort(row.bookingId)}</span>
      ),
    },
    {
      header: 'Guest',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{getGuestName(row)}</p>
          {row.guest?.email && <p className="text-xs text-slate-400">{row.guest.email}</p>}
        </div>
      ),
    },
    {
      header: 'Room',
      render: (row) => (
        <span className="text-sm text-slate-700">{row.roomId || row.roomNumber || '—'}</span>
      ),
    },
    {
      header: 'Check-in',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.checkInDate ? new Date(row.checkInDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Check-out',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.checkOutDate ? new Date(row.checkOutDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="text-sm font-semibold text-amber-700">
          {row.totalAmount
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: row.currency || 'USD',
              }).format(row.totalAmount)
            : '—'}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => <ConfirmCheckInBtn booking={row} onDone={load} />,
    },
  ], [load]);

  // ─── Check-out columns (read-only) ──────────────────────────────────────
  const checkOutColumns = useMemo(() => [
    {
      header: 'Booking ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">{bookingIdShort(row.bookingId)}</span>
      ),
    },
    {
      header: 'Guest',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{getGuestName(row)}</p>
          {row.guest?.email && <p className="text-xs text-slate-400">{row.guest.email}</p>}
        </div>
      ),
    },
    {
      header: 'Room',
      render: (row) => (
        <span className="text-sm text-slate-700">{row.roomId || row.roomNumber || '—'}</span>
      ),
    },
    {
      header: 'Check-in',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.checkInDate ? new Date(row.checkInDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Check-out',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.checkOutDate ? new Date(row.checkOutDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          ${row.bookingStatus?.toUpperCase() === 'CHECKED_OUT' || row.bookingStatus?.toUpperCase() === 'COMPLETED'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-purple-50 text-purple-700'
          }`}>
          {row.bookingStatus || 'CHECKED_OUT'}
        </span>
      ),
    },
  ], []);

  const columns = activeTab === 'checkins' ? checkInColumns : checkOutColumns;
  const data    = activeTab === 'checkins' ? todayCheckIns  : todayCheckOuts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Arrivals & Departures</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Confirm check-ins to mark guest as arrived and release payment to your account
          </p>
          <div className="mt-2">
            <HotelSelector />
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading || !activeHotelId}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info banner — only on check-ins tab when hotel selected */}
      {activeHotelId && activeTab === 'checkins' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Click <strong>Confirm Check-In</strong> when the guest arrives. This marks the booking
            as checked-in <em>and</em> releases their payment from Desiney to your Stripe account
            — funds arrive in 30 min – 2 hours.
          </p>
        </div>
      )}

      {!activeHotelId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No hotel selected</h3>
          <p className="text-sm text-slate-500">Select a property above to view today's check-ins and check-outs.</p>
        </div>
      )}

      {activeHotelId && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('checkins')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'checkins'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Check-ins
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{todayCheckIns.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('checkouts')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'checkouts'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Check-outs
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{todayCheckOuts.length}</span>
            </button>
          </div>

          {/* Table */}
          {data.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              {activeTab === 'checkins' ? (
                <LogIn className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              ) : (
                <LogOut className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No {activeTab === 'checkins' ? 'check-ins' : 'check-outs'} today
              </h3>
              <p className="text-slate-600">When guests are scheduled, they will show up here.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={data} />
          )}
        </>
      )}
    </div>
  );
};
