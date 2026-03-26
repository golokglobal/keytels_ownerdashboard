import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn, LogOut, RefreshCw, Calendar } from 'lucide-react';
import { DataTable } from '../components/shared/DataTable';
import { selectPrimaryHotelId } from '../store/slices/userSlice';
import {
  fetchTodayCheckIns,
  fetchTodayCheckOuts,
  selectTodayCheckIns,
  selectTodayCheckOuts,
  selectBookingsLoading,
} from '../store/slices/bookingSlice';

const getGuestName = (booking) => {
  if (booking?.guest) {
    const { firstName, lastName, email, phoneNumber } = booking.guest;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (email) return email;
    if (phoneNumber) return phoneNumber;
  }
  return booking?.guestName || 'Guest';
};

const bookingIdShort = (id) => (id ? `${id.substring(0, 8)}...` : '—');

export const CheckinsOuts = () => {
  const dispatch = useDispatch();
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const todayCheckIns = useSelector(selectTodayCheckIns) || [];
  const todayCheckOuts = useSelector(selectTodayCheckOuts) || [];
  const loading = useSelector(selectBookingsLoading);
  const [activeTab, setActiveTab] = useState('checkins');

  const load = () => {
    if (!activeHotelId) return;
    dispatch(fetchTodayCheckIns(activeHotelId));
    dispatch(fetchTodayCheckOuts(activeHotelId));
  };

  useEffect(() => {
    if (activeHotelId) load();
  }, [activeHotelId]);

  const columns = useMemo(() => [
    {
      header: 'Booking ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {bookingIdShort(row.bookingId)}
        </span>
      ),
    },
    {
      header: 'Guest',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{getGuestName(row)}</p>
          {row.guest?.email && <p className="text-xs text-slate-500">{row.guest.email}</p>}
        </div>
      ),
    },
    {
      header: 'Room',
      render: (row) => row.roomId || row.roomNumber || '—',
    },
    {
      header: 'Check-in',
      render: (row) => (row.checkInDate ? new Date(row.checkInDate).toLocaleDateString() : '—'),
    },
    {
      header: 'Check-out',
      render: (row) => (row.checkOutDate ? new Date(row.checkOutDate).toLocaleDateString() : '—'),
    },
  ], []);

  const data = activeTab === 'checkins' ? todayCheckIns : todayCheckOuts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Today Check-ins & Check-outs</h1>
          <p className="text-slate-600">Monitor arrivals and departures for the selected hotel</p>
        </div>
        <button
          onClick={load}
          disabled={loading || !activeHotelId}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!activeHotelId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select a hotel</h3>
          <p className="text-slate-600">Choose a hotel from the header to view check-ins and check-outs.</p>
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
                  ? 'bg-blue-600 text-white shadow-md'
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

