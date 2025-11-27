
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Database, LogOut, Activity, Settings, Sun, Moon, Lock, 
  CheckCircle, Search, MoreVertical, XCircle, AlertTriangle, 
  RefreshCcw, UserX, UserCheck, Key, Plus, ShieldCheck, Instagram, Youtube, Twitter, Facebook, ExternalLink,
  Gavel, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { mockAdminService } from '../../services/mockAdmin';
import { User, UserRole, UserStatus } from '../../types';

// Mock Admins for Team View
const MOCK_ADMINS = [
  { id: 'adm-1', name: 'Super Admin', email: 'super@ubuni.co.ke', role: 'Super Admin', status: 'active', lastActive: 'Now' },
  { id: 'adm-2', name: 'Support Lead', email: 'support@ubuni.co.ke', role: 'Moderator', status: 'active', lastActive: '2h ago' },
];

const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'verification' | 'disputes' | 'team' | 'settings'>('dashboard');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'CREATOR' | 'CLIENT' | 'FLAGGED' | 'BANNED'>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Verification State
  const [verificationTab, setVerificationTab] = useState<'pending' | 'clients' | 'socials'>('pending');
  const [pendingCreators, setPendingCreators] = useState<User[]>([]);
  const [verificationSearch, setVerificationSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null); // userId to reject
  const [rejectReason, setRejectReason] = useState('');

  // Dispute State
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [adminVerdict, setAdminVerdict] = useState<'FAVOR_CLIENT' | 'FAVOR_CREATOR' | 'FORCE_REVISION' | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Team State
  const [admins, setAdmins] = useState(MOCK_ADMINS);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'verification') {
      fetchUsers();
    }
    if (activeTab === 'verification' && verificationTab === 'pending') {
        fetchPending();
    }
    if (activeTab === 'disputes') {
        fetchDisputes();
    }
  }, [activeTab, verificationTab]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, userFilter]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const data = await mockAdminService.getAllUsers();
    setUsers(data);
    setIsLoadingUsers(false);
  };

  const fetchPending = async () => {
      const data = await mockAdminService.getPendingVerifications();
      setPendingCreators(data);
  };

  const fetchDisputes = async () => {
      const data = await mockAdminService.getAllDisputes();
      setDisputes(data);
  };

  const filterUsers = () => {
    let result = users;

    if (userFilter === 'CREATOR') result = result.filter(u => u.role === UserRole.CREATOR);
    if (userFilter === 'CLIENT') result = result.filter(u => u.role === UserRole.CLIENT);
    if (userFilter === 'FLAGGED') result = result.filter(u => u.isFlagged);
    if (userFilter === 'BANNED') result = result.filter(u => u.status === 'banned');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.id.toLowerCase().includes(q)
      );
    }

    setFilteredUsers(result);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // --- Dispute Actions ---
  const handleResolveDispute = async () => {
      if (!selectedDispute || !adminVerdict || !adminNote) return;
      setIsSaving(true);
      await mockAdminService.resolveDispute(selectedDispute.id, adminVerdict, adminNote);
      setIsSaving(false);
      setSelectedDispute(null);
      setAdminVerdict(null);
      setAdminNote('');
      fetchDisputes();
  };

  const getTimeElapsed = (date: string) => {
      const diff = new Date().getTime() - new Date(date).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return hours;
  };

  const getUrgencyLevel = (hours: number) => {
      if (hours > 48) return 'critical';
      if (hours > 24) return 'high';
      return 'normal';
  };

  // --- User Actions ---
  const handleUserStatusChange = async (userId: string, status: UserStatus) => {
    setActionMenuOpen(null);
    await mockAdminService.updateUserStatus(userId, status);
    fetchUsers();
  };

  const handleResetVerification = async (userId: string) => {
    setActionMenuOpen(null);
    await mockAdminService.resetVerification(userId);
    fetchUsers();
  };

  const handleFlagUser = async (userId: string, currentFlag: boolean) => {
    setActionMenuOpen(null);
    await mockAdminService.toggleFlagUser(userId, !currentFlag, !currentFlag ? "Flagged by admin" : undefined);
    fetchUsers();
  };

  const handleForceLogout = async (userId: string) => {
    setActionMenuOpen(null);
    await mockAdminService.forceLogout(userId);
    alert(`Force logout signal sent for user ${userId}`);
  };

  // --- Verification Actions ---
  const handleApproveIdentity = async (userId: string) => {
      await mockAdminService.verifyIdentity(userId, true);
      fetchPending();
      fetchUsers();
  };

  const handleRejectIdentity = async () => {
      if (!rejectModalOpen || !rejectReason) return;
      await mockAdminService.verifyIdentity(rejectModalOpen, false, rejectReason);
      setRejectModalOpen(null);
      setRejectReason('');
      fetchPending();
      fetchUsers();
  };

  const handleToggleClientVerify = async (userId: string, currentStatus: boolean) => {
      await mockAdminService.verifyIdentity(userId, !currentStatus);
      fetchUsers();
  };

  const handleToggleSocialVerify = async (userId: string, platform: string, currentStatus: boolean) => {
      await mockAdminService.verifySocialPlatform(userId, platform, !currentStatus);
      fetchUsers();
  };

  // --- Password Change ---
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      setIsSaving(false);
      return;
    }

    setTimeout(() => {
      setIsSaving(false);
      setMessage({ type: 'success', text: "Password updated successfully." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Shield className="text-red-500" size={24} />
          <div>
            <h1 className="font-bold text-lg tracking-wider">GOD MODE</h1>
            <p className="text-xs text-slate-500">v1.0.0-alpha</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity size={18} className={activeTab === 'dashboard' ? 'text-blue-400' : ''} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={18} className={activeTab === 'users' ? 'text-blue-400' : ''} /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('verification')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'verification' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <ShieldCheck size={18} className={activeTab === 'verification' ? 'text-blue-400' : ''} /> Verification
          </button>
          <button 
            onClick={() => setActiveTab('disputes')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'disputes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Gavel size={18} className={activeTab === 'disputes' ? 'text-blue-400' : ''} /> Disputes
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'team' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Key size={18} className={activeTab === 'team' ? 'text-blue-400' : ''} /> Team & Access
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={18} className={activeTab === 'settings' ? 'text-blue-400' : ''} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-500 uppercase">Logged in as</p>
            <p className="text-sm font-bold truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-900/30 text-red-400 py-2 rounded border border-red-900/50 hover:bg-red-900/50 transition-colors"
          >
            <LogOut size={16} /> Terminate
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Shield size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Restricted Administration Panel
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                System Status: Operational. <br/>
                Use the sidebar to manage users, roles, and system configurations.
                </p>
            </div>
          )}

          {/* DISPUTE RESOLUTION MODULE */}
          {activeTab === 'disputes' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dispute Resolution</h2>
                      <p className="text-slate-500 dark:text-slate-400">Prioritize and resolve conflicts to maintain platform trust.</p>
                   </div>
                   <div className="flex gap-2">
                      <span className="flex items-center text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                         <AlertCircle size={14} className="mr-1" /> {disputes.filter(d => getUrgencyLevel(getTimeElapsed(d.date)) === 'critical').length} Critical
                      </span>
                      <span className="flex items-center text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                         <Clock size={14} className="mr-1" /> {disputes.length} Pending
                      </span>
                   </div>
                </div>

                {/* Priority Queue Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {disputes.length > 0 ? disputes.map(dispute => {
                      const hours = getTimeElapsed(dispute.date);
                      const urgency = getUrgencyLevel(hours);
                      
                      return (
                         <div key={dispute.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 p-5 flex flex-col hover:shadow-md transition-shadow ${
                            urgency === 'critical' ? 'border-l-red-500' : 
                            urgency === 'high' ? 'border-l-orange-500' : 'border-l-blue-500'
                         }`}>
                            <div className="flex justify-between items-start mb-3">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                  dispute.type === 'TERMINATION' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                               }`}>
                                  {dispute.type}
                               </span>
                               <span className={`text-xs font-medium flex items-center ${urgency === 'critical' ? 'text-red-500' : 'text-slate-400'}`}>
                                  <Clock size={12} className="mr-1" /> {hours}h ago
                               </span>
                            </div>
                            
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{dispute.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">Contract: {dispute.contractTitle}</p>
                            
                            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded mb-4">
                               <span><strong>Client:</strong> {dispute.parties.client}</span>
                               <span className="text-slate-300">|</span>
                               <span><strong>Creator:</strong> {dispute.parties.creator}</span>
                            </div>

                            <div className="mt-auto">
                               <Button size="sm" className="w-full" onClick={() => setSelectedDispute(dispute)}>Review & Resolve</Button>
                            </div>
                         </div>
                      );
                   }) : (
                      <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                         <CheckCircle size={48} className="mx-auto mb-4 opacity-20 text-green-500" />
                         <p>No pending disputes. Good job!</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
               {/* Search & Filters */}
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
               </div>
               <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                  {['ALL', 'CREATOR', 'CLIENT', 'FLAGGED', 'BANNED'].map(filter => (
                     <button
                        key={filter}
                        onClick={() => setUserFilter(filter as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                           userFilter === filter 
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                     >
                        {filter.charAt(0) + filter.slice(1).toLowerCase()}
                     </button>
                  ))}
               </div>
               {/* User Table */}
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible">
                  {isLoadingUsers ? (
                     <div className="p-8 text-center text-slate-500">Loading users...</div>
                  ) : (
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                           <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Trust Score</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {filteredUsers.length > 0 ? filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                                          {u.avatarUrl && <img src={u.avatarUrl} className="w-full h-full object-cover" />}
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                          <p className="text-xs text-slate-500">{u.email}</p>
                                       </div>
                                       {u.isFlagged && <AlertTriangle size={16} className="text-orange-500" />}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300">{u.role}</span></td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{u.status}</span>
                                 </td>
                                 <td className="px-6 py-4">{u.role === UserRole.CREATOR ? `${u.profile?.verification?.trustScore || 0}%` : '-'}</td>
                                 <td className="px-6 py-4 text-right relative">
                                    <button onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><MoreVertical size={16} className="text-slate-500" /></button>
                                    {actionMenuOpen === u.id && (
                                       <div className="absolute right-8 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                          <button onClick={() => handleFlagUser(u.id, !!u.isFlagged)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"><AlertTriangle size={14} className="mr-2" /> {u.isFlagged ? 'Unflag User' : 'Flag for Review'}</button>
                                          <button onClick={() => handleUserStatusChange(u.id, u.status === 'active' ? 'suspended' : 'active')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400 flex items-center"><UserX size={14} className="mr-2" /> {u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                                          <button onClick={() => handleResetVerification(u.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"><RefreshCcw size={14} className="mr-2" /> Reset Verification</button>
                                          <button onClick={() => handleForceLogout(u.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"><LogOut size={14} className="mr-2" /> Force Logout</button>
                                          {u.status !== 'banned' && <button onClick={() => handleUserStatusChange(u.id, 'banned')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center border-t border-slate-100 dark:border-slate-700"><XCircle size={14} className="mr-2" /> Ban Permanently</button>}
                                       </div>
                                    )}
                                 </td>
                              </tr>
                           )) : (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users found.</td></tr>
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>
          )}

          {/* VERIFICATION & SETTINGS (Simplified for brevity) */}
          {activeTab === 'verification' && (
             <div className="space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Control</h2>
                <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-fit">
                   {(['pending', 'clients', 'socials'] as const).map(tab => (
                      <button key={tab} onClick={() => setVerificationTab(tab)} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${verificationTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                         {tab === 'pending' ? 'Pending Requests' : tab === 'clients' ? 'Client Approval' : 'Social Media'}
                      </button>
                   ))}
                </div>
                {verificationTab === 'pending' && (
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                      {pendingCreators.map(c => (
                         <div key={c.id} className="p-6 flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-slate-900 dark:text-white">{c.name}</h4>
                               <div className="text-sm text-slate-500">Legal: {c.profile?.legalName} | M-Pesa: {c.profile?.mpesaNumber}</div>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => setRejectModalOpen(c.id)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm">Reject</button>
                               <button onClick={() => handleApproveIdentity(c.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Approve</button>
                            </div>
                         </div>
                      ))}
                      {pendingCreators.length === 0 && <div className="p-12 text-center text-slate-500">No pending verifications.</div>}
                   </div>
                )}
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Security</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                     <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                     <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                     {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{message.text}</p>}
                     <Button type="submit" disabled={isSaving}>{isSaving ? 'Updating...' : 'Change Password'}</Button>
                  </form>
               </div>
             </div>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Mediation Console Modal */}
      {selectedDispute && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                        <Gavel className="mr-2" size={20} /> Mediation Console
                     </h3>
                     <p className="text-xs text-slate-500">Case ID: {selectedDispute.id}</p>
                  </div>
                  <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><XCircle size={24} /></button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-6">
                  {/* Evidence / Context */}
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dispute Reason</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{selectedDispute.reason}"</p>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Value at Risk</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">KES {selectedDispute.amount.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Verdict Selection */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Issue Verdict</label>
                     <div className="grid grid-cols-3 gap-3">
                        <button
                           onClick={() => setAdminVerdict('FAVOR_CLIENT')}
                           className={`p-3 rounded-lg border text-sm font-bold transition-all ${adminVerdict === 'FAVOR_CLIENT' ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                        >
                           Favor Client
                        </button>
                        <button
                           onClick={() => setAdminVerdict('FAVOR_CREATOR')}
                           className={`p-3 rounded-lg border text-sm font-bold transition-all ${adminVerdict === 'FAVOR_CREATOR' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                        >
                           Favor Creator
                        </button>
                        <button
                           onClick={() => setAdminVerdict('FORCE_REVISION')}
                           className={`p-3 rounded-lg border text-sm font-bold transition-all ${adminVerdict === 'FORCE_REVISION' ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                        >
                           Force Revision
                        </button>
                     </div>
                  </div>

                  {/* Admin Note */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Admin Ruling / Note (Required)</label>
                     <textarea 
                        className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        rows={4}
                        placeholder="Explain the verdict logic to both parties..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                     />
                  </div>
               </div>

               <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setSelectedDispute(null)}>Cancel</Button>
                  <Button onClick={handleResolveDispute} disabled={!adminVerdict || !adminNote || isSaving}>
                     {isSaving ? 'Processing...' : 'Submit Ruling'}
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-700">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject Verification</h3>
               <textarea className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" rows={3} placeholder="Reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
               <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => { setRejectModalOpen(null); setRejectReason(''); }}>Cancel</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRejectIdentity} disabled={!rejectReason}>Reject</Button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default AdminDashboard;
