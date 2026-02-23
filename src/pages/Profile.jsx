import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
  clearError,
  fetchOwnerWallet,
  selectWallet,
  selectWalletLoading,
  selectWalletError,
} from "../store/slices/userSlice";
import { X, Save, Key, Camera, User, Mail, Phone, Lock, Check, AlertCircle, UploadCloud, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

// Simple toast utility (replace with your preferred toast library)
const toast = {
  success: (message) => console.log('✅ Success:', message),
  error: (message) => console.error('❌ Error:', message),
  warning: (message) => console.warn('⚠️ Warning:', message),
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, isAuthenticated } = useSelector((state) => state.user);
  const walletData = useSelector(selectWallet);
  const walletLoading = useSelector(selectWalletLoading);
  const walletError = useSelector(selectWalletError);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchWalletData = () => {
    dispatch(fetchOwnerWallet());
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      dispatch(fetchOwnerWallet());
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
      });
      setPhotoUrl(user.profileImageUrl || "");
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
    setProfileSuccess(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError(null);
    if (error) dispatch(clearError());
    setProfileSuccess(null);
  };

  const handlePhotoUrlChange = (e) => {
    setPhotoUrl(e.target.value);
    if (error) dispatch(clearError());
    setProfileSuccess(null);
  };

  const handleUpdatePhoto = async () => {
    if (!photoUrl || !photoUrl.trim()) {
      toast.warning("Please enter a valid photo URL");
      return;
    }

    // Validate URL format
    if (photoUrl.startsWith('data:')) {
      toast.error("Base64 images are not supported. Please use an actual image URL (http:// or https://)");
      return;
    }

    if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
      toast.warning("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await dispatch(uploadProfilePhoto(photoUrl));

      if (uploadProfilePhoto.fulfilled.match(result)) {
        toast.success("Profile photo updated successfully!");
        setProfileSuccess("Profile photo updated successfully!");
      } else {
        const errorMsg = result.payload || "Failed to update photo";
        toast.error(errorMsg);
        console.error("Photo update failed:", errorMsg);
      }
    } catch (err) {
      console.error("❌ Photo update error:", err);
      toast.error("Failed to update photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!profileForm.firstName || !profileForm.firstName.trim()) {
      toast.warning("First name is required");
      return;
    }

    if (!profileForm.lastName || !profileForm.lastName.trim()) {
      toast.warning("Last name is required");
      return;
    }

    setUploadingPhoto(true);
    setProfileSuccess(null);
    dispatch(clearError());

    try {
      console.log('Updating profile with data:', profileForm);

      // Update profile details (firstName, lastName, phoneNumber)
      const profileResult = await dispatch(updateProfile(profileForm));

      if (updateProfile.fulfilled.match(profileResult)) {
        setProfileSuccess("Profile updated successfully!");
        toast.success("Profile updated successfully!");
      } else {
        const errorMsg = profileResult.payload || "Failed to update profile";
        console.error("Profile update failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("❌ Profile update error:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      toast.warning("Please enter your current password.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      toast.warning("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      toast.warning("New password and confirmation do not match.");
      return;
    }

    const result = await dispatch(changePassword(passwordForm));

    if (changePassword.fulfilled.match(result)) {
      setProfileSuccess("Password changed successfully! Please sign in again.");
      toast.success("Password changed successfully! Redirecting...");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    } else {
      const errorMessage = result.payload || "An unknown error occurred.";
      setPasswordError(errorMessage);
      toast.error(`Failed to change password: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate("/signin");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading && !user) {
    return <div className="loading-placeholder">Loading user data...</div>;
  }

  if (!user) {
    return <div className="loading-placeholder">Please sign in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .input-focus:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .profile-photo-wrapper {
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .profile-photo-wrapper:hover {
          transform: scale(1.02);
        }
        .photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }
        .profile-photo-wrapper:hover .photo-overlay {
          opacity: 1;
        }
        .tab-active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .tab-inactive {
          background: white;
          color: #64748b;
        }
        .tab-inactive:hover {
          background: #f8fafc;
          color: #3b82f6;
        }
        .success-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 50;
        }
        .spinner-inline {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        .loading-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-size: 1.2rem;
          color: #64748b;
        }
        .photo-upload-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #3b82f6;
          border-radius: 50%;
          padding: 6px;
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }
      `}</style>

      {profileSuccess && (
        <div className="success-toast animate-slide-in">
          <div className="glass-effect rounded-lg shadow-xl p-4 flex items-center gap-3 text-green-700">
            <div className="bg-green-100 rounded-full p-2">
              <Check size={20} />
            </div>
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm text-green-600">{profileSuccess}</p>
            </div>
            <button onClick={() => setProfileSuccess(null)} className="ml-4">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-slide-in">
            <div className="glass-effect rounded-xl p-4 flex items-start gap-3 text-red-700 border-red-200">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="flex-1">{error}</p>
              <button onClick={() => dispatch(clearError())}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 animate-slide-in">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'profile' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <User size={20} />
            Profile & Photo
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'password' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Key size={20} />
            Security
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'wallet' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Wallet size={20} />
            Wallet
          </button>
        </div>

        {/* Content Card */}
        <div className="glass-effect rounded-2xl shadow-xl p-8 animate-slide-in">
          {activeTab === 'profile' ? (
            <div>
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200">
                <div className="w-32 h-32 rounded-full mb-4 shadow-lg overflow-hidden">
                  <img
                    src={photoUrl || user?.profileImageUrl || "https://placehold.co/150x150/aabbcc/ffffff?text=Avatar"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/150x150/aabbcc/ffffff?text=Avatar";
                    }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {profileForm.firstName} {profileForm.lastName}
                </h3>
                <p className="text-slate-600 text-sm">{user.email}</p>

                {/* Photo URL Input */}
                <div className="w-full max-w-md mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Profile Photo URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Camera size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={handlePhotoUrlChange}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                        placeholder="https://example.com/avatar.jpg"
                        disabled={loading || uploadingPhoto}
                      />
                    </div>
                    <button
                      onClick={handleUpdatePhoto}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
                      disabled={loading || uploadingPhoto}
                    >
                      {uploadingPhoto && <div className="spinner-inline"></div>}
                      <UploadCloud size={18} />
                      {uploadingPhoto ? "Updating..." : "Update"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter an image URL (e.g., https://i.imgur.com/yourimage.jpg). Base64 images are not supported.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="First Name"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="Last Name"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                      placeholder="Email"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileForm.phoneNumber}
                      onChange={handleProfileChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="Phone Number"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  disabled={loading || uploadingPhoto}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                  disabled={loading || uploadingPhoto}
                >
                  {(loading || uploadingPhoto) && <div className="spinner-inline"></div>}
                  <Save size={18} />
                  {(loading || uploadingPhoto) ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : activeTab === 'password' ? (
            <div>
              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-8">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Password Requirements</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your password must be at least 6 characters long and include a mix of letters and numbers for security.
                    </p>
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="mb-6">
                  <div className="glass-effect rounded-xl p-4 flex items-start gap-3 text-red-700 border-red-200">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="flex-1">{passwordError}</p>
                    <button onClick={() => setPasswordError(null)}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="Enter current password"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="Enter new password (min 6 characters)"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl input-focus transition-all"
                      placeholder="Confirm new password"
                      disabled={loading || uploadingPhoto}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                  className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  disabled={loading || uploadingPhoto}
                >
                  Clear
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
                  disabled={loading || uploadingPhoto}
                >
                  {(loading || uploadingPhoto) && <div className="spinner-inline"></div>}
                  <Key size={18} />
                  {(loading || uploadingPhoto) ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          ) : activeTab === 'wallet' ? (
            <div>
              {/* Wallet Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">My Wallet</h3>
                  <p className="text-sm text-slate-500 mt-1">View your balance and transaction history</p>
                </div>
                <button
                  onClick={fetchWalletData}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  disabled={walletLoading}
                >
                  <RefreshCw size={16} className={walletLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {walletError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{walletError}</p>
                </div>
              )}

              {walletLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="spinner-inline" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'rgba(148,163,184,0.3)', borderTopColor: '#3b82f6' }}></div>
                  <p className="mt-4 text-sm">Loading wallet data...</p>
                </div>
              ) : walletData ? (
                <div>
                  {/* Balance Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white mb-6 shadow-xl shadow-blue-500/30">
                    <p className="text-sm text-blue-100 mb-1">Available Balance</p>
                    <p className="text-4xl font-bold">
                      {walletData.currency || '₹'}{typeof walletData.balance === 'number' ? walletData.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                    <p className="text-xs text-blue-200 mt-3">Last updated: {new Date().toLocaleDateString()}</p>
                  </div>

                  {/* Transactions */}
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-4">Recent Transactions</h4>
                    {walletData.transactions && walletData.transactions.length > 0 ? (
                      <div className="space-y-3">
                        {walletData.transactions.map((txn, idx) => (
                          <div key={txn.id || idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className={`p-2 rounded-full ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {txn.type === 'credit'
                                ? <ArrowDownLeft size={18} className="text-green-600" />
                                : <ArrowUpRight size={18} className="text-red-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{txn.description || txn.type}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{txn.date ? new Date(txn.date).toLocaleDateString() : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold text-sm ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                {txn.type === 'credit' ? '+' : '-'}{walletData.currency || '₹'}{typeof txn.amount === 'number' ? txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : txn.amount}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${txn.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {txn.status || 'completed'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No transactions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <Wallet size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-slate-600">Wallet data unavailable</p>
                  <p className="text-sm mt-1">Click refresh to try again</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 glass-effect rounded-xl p-6 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Account Security</h4>
              <p className="text-sm text-slate-600">
                Keep your account secure by using a strong password and updating your information regularly. 
                If you change your password, you'll need to sign in again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;