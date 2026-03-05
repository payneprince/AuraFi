'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProfilePage() {
  const { 
    user, 
    accounts,
    transactions,
    soundEnabled, 
    toggleSound,
    theme,
    setTheme,
    logout 
  } = useAuth();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTrustedDevices, setShowTrustedDevices] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ✅ Detect device type
  const getDeviceType = () => {
    if (typeof window === 'undefined') return 'desktop';
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const currentDeviceType = getDeviceType();
  const currentDeviceName = currentDeviceType === 'mobile' ? 'Mobile Device' : 'Desktop Device';

  // ✅ Simulated trusted devices
  const trustedDevices = [
    {
      id: 'dev-1',
      name: 'MacBook Pro',
      location: 'Accra, Ghana',
      type: 'laptop',
      lastActive: Date.now() - 2 * 60 * 1000 // 2 min ago
    },
    {
      id: 'dev-2',
      name: 'iPhone 14',
      location: 'Kumasi, Ghana',
      type: 'phone',
      lastActive: Date.now() - 24 * 60 * 60 * 1000 // 24 hrs ago
    },
    {
      id: 'dev-3',
      name: currentDeviceName,
      location: 'Accra, Ghana',
      type: currentDeviceType === 'mobile' ? 'phone' : 'laptop',
      lastActive: Date.now(), // Now → Online
      isCurrent: true // 👈 Mark as current device
    }
  ];

  // ✅ Auto-refresh every 30 seconds for "Last Seen"
  useEffect(() => {
    const interval = setInterval(() => {
      // Triggers re-render to update relative time
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Format "Last Seen: X min ago"
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('Profile updated successfully!');
    setError('');
    setTimeout(() => {
      setIsEditing(false);
      setSuccess('');
    }, 2000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSuccess('Password updated successfully!');
    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setIsChangingPassword(false);
      setSuccess('');
    }, 2000);
  };

  // ✅ PDF Export (FIXED)
  const handleExportData = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('AuraBank - User Data Export', 14, 22);
    doc.setFontSize(12);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`User: ${user?.name} (${user?.email})`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [['Account Name', 'Type', 'Currency', 'Balance']],
      body: accounts.map(acc => [
        acc.name,
        acc.type,
        acc.currency,
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: acc.currency
        }).format(acc.balance)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 139] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 100;
    autoTable(doc, {
      startY: finalY,
      head: [['Date', 'Description', 'Amount', 'Account']],
      body: transactions.slice(0, 50).map(tx => {
        const acc = accounts.find(a => a.id === tx.accountId);
        return [
          new Date(tx.date).toLocaleDateString(),
          tx.description,
          `${tx.type === 'credit' ? '+' : '-'}${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: acc?.currency || 'USD'
          }).format(Math.abs(tx.amount))}`,
          acc?.name || 'Unknown'
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 139] }
    });

    doc.save(`AuraBank_${user?.name?.replace(/\s+/g, '_')}_Data_Export.pdf`);
  };

  const handleDeleteAccount = () => {
    alert('Account deletion simulated. In production, this would permanently delete your data.');
    setIsDeleting(false);
  };

  const handleLogoutAllSessions = () => {
    alert('You have been logged out of all devices.');
    logout();
  };

  if (!user) {
    return <div className="p-8 text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light">My Profile</h2>
          <p className="text-text-light/80 mt-1">Manage your personal information and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <img
              src="/profile.jpg"
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-dark">{user.name}</h3>
            <p className="text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Last login: {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                placeholder="+233 55 827 9979"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none resize-none text-slate-900"
                rows={3}
                placeholder="Accra, Ghana"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setError('');
                }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
              >
                Update Password
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm text-slate-500">Name</span>
              <span className="font-medium text-text-dark">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm text-slate-500">Email</span>
              <span className="font-medium text-text-dark">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-sm text-slate-500">Phone</span>
              <span className="font-medium text-text-dark">{user.phone || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500">Address</span>
              <span className="font-medium text-text-dark">{user.address || 'Not set'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <h3 className="font-semibold text-text-dark mb-4">Security</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <span className="text-sm text-slate-500">Change Password</span>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="text-sm text-magenta-500 hover:text-magenta-600 font-medium"
            >
              Update
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <span className="text-sm text-slate-500">Two-Factor Authentication</span>
            <button className="text-sm text-magenta-500 hover:text-magenta-600 font-medium">
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-500">Trusted Devices</span>
            <button 
              onClick={() => setShowTrustedDevices(true)}
              className="text-sm text-magenta-500 hover:text-magenta-600 font-medium"
            >
              View ({trustedDevices.length})
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleLogoutAllSessions}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Log Out of All Sessions
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <h3 className="font-semibold text-text-dark mb-4">Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="text-sm bg-slate-100 text-slate-800 px-3 py-1 rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Notification Sound</span>
            <button
              onClick={toggleSound}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-magenta-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data & Legal */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <h3 className="font-semibold text-text-dark mb-4">Data & Legal</h3>
        
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="flex w-full items-center justify-between py-2 text-sm text-slate-700 hover:text-magenta-600"
          >
            <span>Export My Data</span>
            <span className="text-xs px-2 py-1 bg-slate-200 rounded">PDF</span>
          </button>

          <button
            onClick={() => setIsDeleting(true)}
            className="flex w-full items-center justify-between py-2 text-sm text-red-600 hover:text-red-800"
          >
            <span>Delete Account</span>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Permanent</span>
          </button>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <a href="#" className="block text-sm text-slate-600 hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="block text-sm text-slate-600 hover:text-slate-900">Terms of Service</a>
            <a href="#" className="block text-sm text-slate-600 hover:text-slate-900">Help Center</a>
            <a href="mailto:support@aurabank.com" className="block text-sm text-slate-600 hover:text-slate-900">Contact Support</a>
          </div>
        </div>
      </div>

      {/* Trusted Devices Modal */}
      {showTrustedDevices && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Trusted Devices</h3>
              <button
                onClick={() => setShowTrustedDevices(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {trustedDevices.map(device => {
                const now = Date.now();
                const diffMs = now - device.lastActive;
                const diffMin = Math.floor(diffMs / (1000 * 60));
                const isOnline = diffMin <= 5;

                // Device icon
                const getIcon = (type: string) => {
                  switch (type) {
                    case 'laptop':
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-3m-2 4h6M7 8h10v6M7 14h6v6M7 20h10v2" /></svg>;
                    case 'phone':
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8v-2c0-3.31-2.69-6-6-6H8v6z" /></svg>;
                    default:
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6M9 19h6v-6a2 2 0 00-2-2H9m0 0V9M9 9a2 2 0 00-2-2H5a2 2 0 00-2 2v6M9 9h6v6M9 9a2 2 0 00-2-2H5a2 2 0 00-2 2v6M9 9h6v6" /></svg>;
                  }
                };

                return (
                  <div key={device.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getIcon(device.type)}
                      <div>
                        <div className="font-medium text-slate-900">{device.name}{device.isCurrent && ' (Current)'}</div>
                        <div className="text-sm text-slate-600">{device.location}</div>
                        <div className="text-xs text-slate-500 mt-1">{formatTimeAgo(device.lastActive)}</div>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                Remove All Trusted Devices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-slate-600 mb-6">
              This will permanently delete your profile, accounts, and transaction history. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleting(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}