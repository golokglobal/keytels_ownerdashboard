import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, X, Mail, Shield, Building, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DataTable } from '../components/shared/DataTable';
import { StaffSkeleton } from '../components/common/Skeleton';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  fetchHotelStaff,
  createStaffMember,
  createManagerMember,
  updateStaffMember,
  deleteStaffMember,
  selectStaff,
  selectStaffLoading,
  clearStaff,
} from '../store/slices/staffSlice';
import { fetchPermissions } from '../store/slices/PermissionsSlice';
import { fetchOwnerHotels } from '../store/slices/PartnerHotelslice';
import { selectPrimaryHotelId } from '../store/slices/userSlice';

export const Staff = () => {
  const dispatch = useDispatch();
  const staff = useSelector(selectStaff) || [];
  const loading = useSelector(selectStaffLoading);
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const { hotels: ownerHotels } = useSelector((state) => state.partneredhotels);
  const permissions = useSelector((state) => state.permissions.list) || [];
  const activeHotel = ownerHotels.find((h) => (h.partneredHotelId || h.id) === activeHotelId) || null;

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, staffId: null, staffName: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HOTEL_STAFF',
    permissionName: '',
  });

  // Load owner hotels on mount
  useEffect(() => {
    if (ownerHotels.length === 0) dispatch(fetchOwnerHotels());
  }, []);

  useEffect(() => {
    if (activeHotelId) {
      dispatch(clearStaff());
      loadStaff(activeHotelId);
      dispatch(fetchPermissions());
    }
  }, [dispatch, activeHotelId]);

  const loadStaff = async (hid) => {
    try {
      await dispatch(fetchHotelStaff(hid || activeHotelId)).unwrap();
    } catch (error) {
      console.error('Failed to load staff:', error);
      toast.error('Failed to load staff members');
    }
  };

  const handleOpenModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        password: '',
        role: staffMember.role,
        permissionName: staffMember.permission?.name || '',
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'HOTEL_STAFF',
        permissionName: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'HOTEL_STAFF',
      permissionName: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeHotelId) {
      toast.error('Please select a hotel from the header first');
      return;
    }

    if (!formData.name || !formData.email || (!editingStaff && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const isManager = formData.role === 'HOTEL_MANAGER';

      const staffData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        hotelId: activeHotelId,
        ...(!isManager && { permissionName: formData.permissionName }),
      };

      if (!editingStaff) {
        staffData.password = formData.password;
      }

      if (editingStaff) {
        await dispatch(updateStaffMember({ staffId: editingStaff.id, staffData })).unwrap();
        toast.success('Staff member updated successfully');
      } else if (isManager) {
        await dispatch(createManagerMember(staffData)).unwrap();
        toast.success('Hotel manager created successfully');
      } else {
        await dispatch(createStaffMember(staffData)).unwrap();
        toast.success('Staff member created successfully');
      }

      handleCloseModal();
      loadStaff(activeHotelId);
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast.error(error || 'Failed to save staff member');
    }
  };

  const handleDelete = (staffId, staffName) => {
    setConfirmDelete({ open: true, staffId, staffName });
  };

  const confirmDeleteStaff = async () => {
    const { staffId } = confirmDelete;
    setConfirmDelete({ open: false, staffId: null, staffName: '' });
    try {
      await dispatch(deleteStaffMember(staffId)).unwrap();
      toast.success('Staff member deleted successfully');
      loadStaff(activeHotelId);
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
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Permission',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{row.permission?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Created',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
            title="Edit staff"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
            title="Delete staff"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Staff Management</h1>
          <p className="text-slate-600">Manage your hotel staff members and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!activeHotelId}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {!activeHotelId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select a hotel</h3>
          <p className="text-slate-600">Choose a hotel from the header to manage staff.</p>
        </div>
      )}

      {/* Staff table — animated per hotel switch */}
      {activeHotelId && (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeHotelId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeInOut' }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {loading && staff.length === 0 ? (
            <div className="p-6"><StaffSkeleton /></div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium mb-4">No staff members for this hotel yet.</p>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="staff@example.com"
                  required
                />
              </div>

              {/* Password (only for new staff) */}
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password *
                  </label>
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

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="HOTEL_STAFF">Hotel Staff</option>
                  <option value="HOTEL_MANAGER">Hotel Manager</option>
                </select>
              </div>

              {/* Permission — only for HOTEL_STAFF */}
              {formData.role === 'HOTEL_STAFF' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Permission
                  </label>
                  <select
                    value={formData.permissionName}
                    onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Permission</option>
                    {permissions
                      .filter((p) => p.category === 'HOTEL')
                      .map((permission) => (
                        <option key={permission.id} value={permission.name}>
                          {permission.name} - {permission.description}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Hotel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hotel *
                </label>
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {activeHotel?.name || activeHotel?.hotelName || 'Selected Hotel'}
                    </p>
                    {(activeHotel?.location || activeHotel?.address) && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {activeHotel?.location || activeHotel?.address}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Switch hotels from the header.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
