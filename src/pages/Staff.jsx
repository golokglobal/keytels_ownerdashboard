import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, X, Mail, Shield, Building, ChevronDown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DataTable } from '../components/shared/DataTable';
import { StaffSkeleton } from '../components/common/Skeleton';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  fetchHotelStaff,
  createStaffMember,
  createManagerMember,
  updateStaffMember,
  updateManagerMember,
  deleteStaffMember,
  deleteManagerMember,
  selectStaff,
  selectStaffLoading,
  clearStaff,
} from '../store/slices/staffSlice';
import { fetchPermissions } from '../store/slices/PermissionsSlice';
import { fetchOwnerHotels } from '../store/slices/PartnerHotelslice';
import { selectPrimaryHotelId, selectUserRole } from '../store/slices/userSlice';

export const Staff = () => {
  const dispatch = useDispatch();
  const staff = useSelector(selectStaff) || [];
  const loading = useSelector(selectStaffLoading);
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const userRole = useSelector(selectUserRole);
  const isOwner = userRole === 'HOTEL_OWNER';
  const isManager = userRole === 'HOTEL_MANAGER' || userRole === 'HOTEL_STAFF';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { hotels: ownerHotels } = useSelector((state) => state.partneredhotels);
  const permissions = useSelector((state) => state.permissions.list) || [];

  // Which hotel's staff we're currently viewing (can differ from header selection)
  const [viewHotelId, setViewHotelId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, staffId: null, staffName: '', staffRole: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HOTEL_STAFF',
    permissionName: '',
    hotelId: '',
  });

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-hotel-dropdown]')) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Load owner hotels on mount
  useEffect(() => {
    if (ownerHotels.length === 0) dispatch(fetchOwnerHotels());
    dispatch(fetchPermissions());
  }, []);

  // Once hotels are available, set the default view hotel
  useEffect(() => {
    if (!viewHotelId) {
      const firstId = activeHotelId || (ownerHotels[0] ? (ownerHotels[0].partneredHotelId || ownerHotels[0].id) : null);
      if (firstId) setViewHotelId(firstId);
    }
  }, [activeHotelId, ownerHotels]);

  // Load staff whenever the viewed hotel changes
  useEffect(() => {
    if (viewHotelId) {
      dispatch(clearStaff());
      loadStaff(viewHotelId);
    }
  }, [viewHotelId]);

  const loadStaff = async (hid) => {
    try {
      await dispatch(fetchHotelStaff(hid)).unwrap();
    } catch (error) {
      console.error('Failed to load staff:', error);
      toast.error('Failed to load staff members');
    }
  };

  const handleSelectHotel = (hid) => {
    if (hid === viewHotelId) return;
    setViewHotelId(hid);
  };

  const getHotelId = (h) => h.partneredHotelId || h.id;
  const getHotelName = (hid) => {
    const h = ownerHotels.find((h) => getHotelId(h) === hid);
    return h?.name || h?.hotelName || 'Unknown Hotel';
  };

  const defaultFormData = () => ({
    name: '',
    email: '',
    password: '',
    role: 'HOTEL_STAFF',
    permissionName: '',
    hotelId: viewHotelId || activeHotelId || '',
  });

  const handleOpenModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        password: '',
        role: staffMember.role,
        permissionName: staffMember.permission?.name || '',
        hotelId: staffMember.hotelId || viewHotelId || '',
      });
    } else {
      setEditingStaff(null);
      setFormData(defaultFormData());
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData(defaultFormData());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hotelId) {
      toast.error('Please select a hotel');
      return;
    }
    if (!formData.name || !formData.email || (!editingStaff && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const isManagerRole = formData.role === 'HOTEL_MANAGER';

      const staffData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        hotelId: formData.hotelId,
        ...(!isManagerRole && { permissionName: formData.permissionName }),
      };

      if (!editingStaff) {
        staffData.password = formData.password;
      }

      if (editingStaff) {
        const isEditingManager = editingStaff.role === 'HOTEL_MANAGER';
        if (isEditingManager) {
          await dispatch(updateManagerMember({ staffId: editingStaff.id, staffData })).unwrap();
        } else {
          await dispatch(updateStaffMember({ staffId: editingStaff.id, staffData })).unwrap();
        }
        toast.success('Staff member updated successfully');
      } else if (isManagerRole) {
        await dispatch(createManagerMember(staffData)).unwrap();
        toast.success('Hotel manager created successfully');
      } else {
        await dispatch(createStaffMember(staffData)).unwrap();
        toast.success('Staff member created successfully');
      }

      handleCloseModal();
      // If we created for a different hotel, switch view to that hotel
      if (formData.hotelId !== viewHotelId) {
        setViewHotelId(formData.hotelId);
      } else {
        loadStaff(viewHotelId);
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast.error(error || 'Failed to save staff member');
    }
  };

  const handleDelete = (staffId, staffName, staffRole) => {
    setConfirmDelete({ open: true, staffId, staffName, staffRole });
  };

  const confirmDeleteStaff = async () => {
    const { staffId, staffRole } = confirmDelete;
    setConfirmDelete({ open: false, staffId: null, staffName: '', staffRole: '' });
    try {
      if (staffRole === 'HOTEL_MANAGER') {
        await dispatch(deleteManagerMember(staffId)).unwrap();
      } else {
        await dispatch(deleteStaffMember(staffId)).unwrap();
      }
      toast.success('Staff member deleted successfully');
      loadStaff(viewHotelId);
    } catch (error) {
      console.error('Failed to delete staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Email',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          <span>{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.role === 'HOTEL_MANAGER'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.role === 'HOTEL_MANAGER' ? 'Manager' : 'Staff'}
        </span>
      ),
    },
    {
      header: 'Permission',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{row.permission?.name || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Joined',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name, row.role)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // For manager/staff: their single hotel from activeHotelId
  const managerHotelName = isManager ? getHotelName(activeHotelId) : null;

  // Colorful palette cycled per hotel index
  const HOTEL_COLORS = [
    { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
    { bg: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
    { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
    { bg: 'bg-rose-500',   light: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-500'   },
    { bg: 'bg-cyan-500',   light: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500'   },
    { bg: 'bg-fuchsia-500',light: 'bg-fuchsia-50',text: 'text-fuchsia-700',border: 'border-fuchsia-200',dot: 'bg-fuchsia-500'},
    { bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500'   },
  ];
  const getHotelColor = (idx) => HOTEL_COLORS[idx % HOTEL_COLORS.length];
  const activeHotelIdx = ownerHotels.findIndex((h) => getHotelId(h) === viewHotelId);
  const activeColor = getHotelColor(activeHotelIdx >= 0 ? activeHotelIdx : 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Staff Management</h1>
          <p className="text-slate-500 text-sm">
            {isManager
              ? `Managing staff for ${managerHotelName}`
              : 'Select a hotel to view and manage its staff'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Hotel selector dropdown — owners only */}
      {isOwner && ownerHotels.length > 0 && (
        <div className="relative w-72" data-hotel-dropdown>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${activeColor.border} bg-white shadow-sm hover:shadow-md transition-all`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeColor.dot}`} />
            <span className="flex-1 text-left text-sm font-semibold text-slate-800 truncate">
              {getHotelName(viewHotelId)}
            </span>
            {loading && (
              <span className={`w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin shrink-0`} />
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute z-30 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
              >
                {ownerHotels.map((h, idx) => {
                  const hid = getHotelId(h);
                  const isActive = hid === viewHotelId;
                  const color = getHotelColor(idx);
                  return (
                    <button
                      key={hid}
                      onClick={() => { handleSelectHotel(hid); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive ? `${color.light} font-semibold` : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                      <span className={`flex-1 text-left truncate ${isActive ? color.text : 'text-slate-700'}`}>
                        {h.name || h.hotelName || hid}
                      </span>
                      {isActive && <Check className={`w-4 h-4 shrink-0 ${color.text}`} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No hotels available */}
      {isOwner && ownerHotels.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No hotels found</h3>
          <p className="text-slate-500 text-sm">Add a hotel first to manage its staff.</p>
        </div>
      )}

      {/* Staff table */}
      {viewHotelId && (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewHotelId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeInOut' }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Table sub-header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {getHotelName(viewHotelId)}
                </span>
                {!loading && (
                  <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                    {staff.length} member{staff.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {loading && staff.length === 0 ? (
              <div className="p-6"><StaffSkeleton /></div>
            ) : staff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-4">
                  No staff members for {getHotelName(viewHotelId)} yet.
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add First Staff Member
                </button>
              </div>
            ) : (
              <DataTable columns={columns} data={staff} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Staff Member"
        message={`Are you sure you want to delete ${confirmDelete.staffName}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteStaff}
        onCancel={() => setConfirmDelete({ open: false, staffId: null, staffName: '' })}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Hotel selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hotel *</label>
                {isManager ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{getHotelName(activeHotelId)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Your assigned hotel</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={formData.hotelId}
                      onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-sm"
                      required
                    >
                      <option value="">Select a hotel</option>
                      {ownerHotels.map((h) => {
                        const hid = getHotelId(h);
                        return (
                          <option key={hid} value={hid}>
                            {h.name || h.hotelName || hid}
                            {h.location || h.address ? ` — ${h.location || h.address}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, permissionName: '' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="HOTEL_STAFF">Hotel Staff</option>
                  <option value="HOTEL_MANAGER">Hotel Manager</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="staff@example.com"
                  required
                />
              </div>

              {/* Password — new records only */}
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {/* Permission — HOTEL_STAFF only */}
              {formData.role === 'HOTEL_STAFF' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Permission</label>
                  <select
                    value={formData.permissionName}
                    onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Permission</option>
                    {permissions
                      .filter((p) => p.category === 'HOTEL')
                      .map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — {p.description}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  {editingStaff ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
