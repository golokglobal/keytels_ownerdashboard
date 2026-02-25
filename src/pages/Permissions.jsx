import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  resetStatus,
  clearError,
} from "../store/slices/PermissionsSlice";

// Define the component as an arrow function
export const Permissions = () => {
  const dispatch = useDispatch();

  // Destructure state from Redux store
  const { list, loading, error, createStatus, updateStatus, deleteStatus } = useSelector(
    (state) => state.permissions
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  // --- State Hooks ---
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [editing, setEditing] = useState(null); // ID of the permission being edited
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // Permission object to delete

  // --- Effects ---

  // 1. Initial data fetch (Handles initial 404 from GET)
  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  // 2. Handle successful mutation status (create, update, delete)
  useEffect(() => {
    if (
      createStatus === "succeeded" ||
      updateStatus === "succeeded" ||
      deleteStatus === "succeeded"
    ) {
      // Refetch the list to ensure UI is up-to-date
      dispatch(fetchPermissions());
      // Reset statuses to 'idle'
      dispatch(resetStatus());

      // Reset local state
      setForm({ name: "", description: "", category: "" });
      setEditing(null);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      dispatch(clearError()); // Clear any previous success or local errors
    }
  }, [createStatus, updateStatus, deleteStatus, dispatch]);

  // --- Handlers ---

  /**
   * Handles form submission for creating or updating a permission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !isAuthenticated) {
      toast.error("You must be logged in to create or edit permissions!");
      return;
    }

    if (!form.name || !form.description || !form.category) {
      toast.error("Please fill in all fields.");
      return;
    }

    console.log("Submitting form with data:", form);

    try {
      if (editing) {
        // Update operation
        await dispatch(updatePermission({ id: editing, ...form })).unwrap();
        console.log("Update dispatched successfully.");
      } else {
        // Create operation (This dispatch no longer hits the 404)
        await dispatch(createPermission(form)).unwrap();
        console.log("Create dispatched successfully.");
      }
    } catch (apiError) {
        // The error is now correctly captured in the Redux 'error' state 
        // by the rejected thunk status.
        console.error("Form submission failed due to API error (captured by Redux):", apiError);
    }
  };

  /**
   * Handles the deletion of a permission after confirmation.
   */
  const handleDelete = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !isAuthenticated) {
      toast.error("You must be logged in to delete permissions!");
      return;
    }

    if (deleteTarget) {
      dispatch(deletePermission(deleteTarget.id));
    }
  };

  /**
   * Clears the form and cancels the editing state.
   */
  const handleCancelEdit = () => {
    setEditing(null);
    setForm({ name: "", description: "", category: "" });
    dispatch(clearError()); // Clear error when canceling edit
  };

  // Get unique categories for the filter dropdown
  const categories = ["ALL", ...new Set(list.map(p => p.category))];

  // Filter and Search Logic
  const filteredPermissions = list.filter(perm => {
    const matchesCategory = filterCategory === "ALL" || perm.category === filterCategory;
    const matchesSearch =
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Permissions Management
          </h1>
          <p className="text-gray-600">Manage system permissions and access control</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Permissions</div>
            <div className="text-2xl font-bold text-gray-900">{list.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Categories</div>
            <div className="text-2xl font-bold text-gray-900">{categories.length - 1}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Filtered Results</div>
            <div className="text-2xl font-bold text-gray-900">{filteredPermissions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Active Category</div>
            <div className="text-lg font-bold text-gray-900 truncate">{filterCategory}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editing ? "Edit Permission" : "Create Permission"}
                </h2>
                {editing && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Displays error from Redux state */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  **Error:** {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MANAGE_USERS"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this permission allows..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., USER_ADMIN"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                  {categories.length > 1 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Existing: {categories.filter(c => c !== "ALL").join(", ")}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={createStatus === "loading" || updateStatus === "loading"}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createStatus === "loading" || updateStatus === "loading" ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {editing ? "Updating..." : "Creating..."}
                    </span>
                  ) : (
                    <>{editing ? "Update Permission" : "Create Permission"}</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Permissions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg">
              {/* Search and Filter Bar */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="sm:w-48">
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading permissions...</p>
                </div>
              )}

              {/* Permissions Table */}
              {!loading && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPermissions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No permissions found
                          </td>
                        </tr>
                      ) : (
                        filteredPermissions.map((perm) => (
                          <tr key={perm.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{perm.id}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {perm.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                              {perm.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {perm.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                              <button
                                onClick={() => {
                                  setForm({
                                    name: perm.name,
                                    description: perm.description,
                                    category: perm.category,
                                  });
                                  setEditing(perm.id);
                                  // Scroll to form on edit click
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget(perm);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Permission
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete the permission <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  disabled={deleteStatus === "loading"}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteStatus === "loading"}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteStatus === "loading" ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}