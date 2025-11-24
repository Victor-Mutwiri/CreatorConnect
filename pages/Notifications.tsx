
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { mockContractService } from '../services/mockContract';
import { Notification } from '../types';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        const notes = await mockContractService.getNotifications(user.id);
        setNotifications(notes);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await mockContractService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    // In a real app, this would be a batch API call
    for (const n of notifications) {
      if (!n.read) await mockContractService.markNotificationRead(n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) return <div className="p-20 text-center dark:text-white">Loading...</div>;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" />;
      case 'error': return <XCircle className="text-red-500" />;
      case 'warning': return <AlertTriangle className="text-orange-500" />;
      default: return <Clock className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Bell className="mr-3" /> Notifications
          </h1>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllRead}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {notifications.length > 0 ? (
            notifications.map(note => (
              <div 
                key={note.id} 
                className={`p-6 transition-colors ${!note.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                onClick={() => !note.read && markAsRead(note.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-1`}>
                    {getIcon(note.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className={`font-bold ${!note.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                         {note.title}
                       </h3>
                       <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                         {new Date(note.date).toLocaleString()}
                       </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">{note.message}</p>
                    {note.link && (
                      <Link 
                        to={note.link}
                        className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        View Details <span className="ml-1">→</span>
                      </Link>
                    )}
                  </div>
                  {!note.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Bell size={48} className="mx-auto mb-4 opacity-20" />
              <p>You're all caught up! No notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
