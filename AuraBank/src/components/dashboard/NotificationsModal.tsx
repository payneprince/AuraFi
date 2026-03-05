'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, Trash2, X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markNotificationRead, deleteNotification, clearAllNotifications } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'warning' | 'success' | 'error'>('all');

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.read;
      return n.type === filter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'info'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'warning'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'success'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === 'error'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Error
            </button>
          </div>
        </div>

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="divide-y divide-slate-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${getTypeColor(notification.type)} ${!notification.read ? 'border-l-4 border-magenta-500' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notification.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="text-slate-500 hover:text-slate-700"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-slate-500 hover:text-slate-700"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}