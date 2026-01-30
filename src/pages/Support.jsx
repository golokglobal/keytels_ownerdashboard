import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, AlertCircle } from 'lucide-react';
import { DataTable } from '../components/shared/DataTable';
import { Loader } from '../components/common/Loader';
import { setTickets, setLoading } from '../store/slices/supportSlice';
import { fetchTickets } from '../api/support';

export const Support = () => {
  const dispatch = useDispatch();
  const { tickets, loading } = useSelector((state) => state.support);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetchTickets();
      dispatch(setTickets(response.tickets));
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const columns = [
    { header: 'Ticket ID', accessor: 'id' },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Priority',
      render: (row) => {
        const colors = {
          high: 'bg-red-100 text-red-700',
          medium: 'bg-yellow-100 text-yellow-700',
          low: 'bg-green-100 text-green-700',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[row.priority]}`}>
            {row.priority}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => {
        const colors = {
          open: 'bg-blue-100 text-blue-700',
          'in-progress': 'bg-purple-100 text-purple-700',
          resolved: 'bg-green-100 text-green-700',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[row.status]}`}>
            {row.status}
          </span>
        );
      },
    },
    { header: 'Assigned To', accessor: 'assignedTo' },
    {
      header: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'open').length },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length },
    { label: 'High Priority', value: tickets.filter(t => t.priority === 'high').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Tickets</h1>
          <p className="text-slate-600">Manage and resolve support tickets</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tickets Table */}
      <DataTable columns={columns} data={tickets} />
    </div>
  );
};
