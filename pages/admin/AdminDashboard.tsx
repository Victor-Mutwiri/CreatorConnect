
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Database, LogOut, Activity, Settings, Sun, Moon, Lock, 
  CheckCircle, Search, Filter, MoreVertical, XCircle, AlertTriangle, 
  RefreshCcw, UserX, UserCheck, Key, Plus, ShieldCheck, Loader, Gavel, Clock, Eye, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { mockAdminService } from '../../services/mockAdmin';
import { User, UserRole, UserStatus, AdminDispute } from '../../types';

// Mock Admins for Team View
const MOCK_ADMINS = [
  { id: 'adm-1', name: 'Super Admin', email: 'super@ubuni.co.ke', role: 'Super Admin', status: 'active', lastActive: 'Now' },
  { id: 'adm-2', name: 'Support Lead', email: 'support@ubuni.co.ke', role: 'Moderator', status: 'active', lastActive: '2h ago' },
];

const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'disputes' | 'team' | 'settings'>('dashboard');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'CREATOR' | 'CLIENT' | 'PENDING_VERIFICATION' | 'FLAGGED' | 'WATCHLIST' | 'SUSPENDED' | 'BANNED'>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Verification Review State
  const [verificationReviewUser, setVerificationReviewUser] = useState<User | null>(null);

  // Dispute State
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [showDisputeModal, setShowDisputeModal] = useState<AdminDispute | null>(null);
  const [disputeAction, setDisputeAction] = useState<'WARNING' | 'WATCHLIST' | 'SUSPEND' | 'BAN' | 'CLEAR'>('CLEAR');
  const [disputeTarget, setDisputeTarget] = useState<string>(''); // User ID
  const [disputeNote, setDisputeNote] = useState('');
  const [isProcessingDispute, setIsProcessingDispute] = useState(false);

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
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'disputes') fetchDisputes();
  }, [activeTab]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, userFilter]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const data = await mockAdminService.getAllUsers();
    setUsers(data);
    setIsLoadingUsers(false);
  };

  const fetchDisputes = async () => {
    const data = await mockAdminService.getActiveDisputes();
    setDisputes(data);
  };

  const filterUsers = () => {
    let result = users;

    // Filter by Tab
    if (userFilter === 'CREATOR') result = result.filter(u => u.role === UserRole.CREATOR);
    if (userFilter === 'CLIENT') result = result.filter(u => u.role === UserRole.CLIENT);
    if (userFilter === 'FLAGGED') result = result.filter(u => u.isFlagged);
    if (userFilter === 'WATCHLIST') result = result.filter(u => u.isWatchlisted);
    if (userFilter === 'SUSPENDED') result = result.filter(u => u.status === 'suspended');
    if (userFilter === 'BANNED') result = result.filter(u => u.status === 'banned');
    if (userFilter === 'PENDING_VERIFICATION') {
        result = result.filter(u => 
          (u.role === UserRole.CREATOR && u.profile?.verification?.status === 'pending') ||
          (u.role === UserRole.CLIENT && u.clientProfile?.verificationStatus === 'pending')
        );
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.id.toLowerCase().includes(q) ||
        (u.role === UserRole.CREATOR && u.profile?.mpesaNumber?.includes(q)) ||
        (u.role === UserRole.CLIENT && u.clientProfile?.businessName?.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(result);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // --- User Actions ---

  const handleUserStatusChange = async (userId: string, status: UserStatus) => {
    setActionMenuOpen(null);
    await mockAdminService.updateUserStatus(userId, status);
    fetchUsers(); // Refresh
  };

  const handleVerifyUser = async (userId: string) => {
    setActionMenuOpen(null);
    setVerificationReviewUser(null);
    await mockAdminService.verifyUser(userId);
    fetchUsers();
  };

  const handleRejectVerification = async (userId: string) => {
    setActionMenuOpen(null);
    setVerificationReviewUser(null);
    await mockAdminService.rejectVerification(userId);
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

  const handleToggleWatchlist = async (userId: string, currentStatus: boolean) => {
    setActionMenuOpen(null);
    await mockAdminService.toggleWatchlistUser(userId, !currentStatus, !currentStatus ? "Manual admin action" : undefined);
    fetchUsers();
  };

  const handleForceLogout = async (userId: string) => {
    setActionMenuOpen(null);
    await mockAdminService.forceLogout(userId);
    alert(`Force logout signal sent for user ${userId}`);
  };

  // --- Dispute Resolution ---
  const handleResolveDispute = async () => {
    if (!showDisputeModal || !disputeTarget || !disputeNote) return;
    setIsProcessingDispute(true);
    await mockAdminService.resolveDispute(
      showDisputeModal.id,
      showDisputeModal.contractId,
      disputeTarget,
      disputeAction,
      disputeNote
    );
    setShowDisputeModal(null);
    setDisputeNote('');
    setIsProcessingDispute(false);
    fetchDisputes(); // Refresh list
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

  const pendingVerificationCount = users.filter(u => 
    (u.role === UserRole.CREATOR && u.profile?.verification?.status === 'pending') ||
    (u.role === UserRole.CLIENT && u.clientProfile?.verificationStatus === 'pending')
  ).length;
  
  const activeDisputesCount = disputes.length;

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
            onClick={() => setActiveTab('disputes')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'disputes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3 flex-1">
               <Gavel size={18} className={activeTab === 'disputes' ? 'text-blue-400' : ''} /> Disputes
            </div>
            {activeDisputesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeDisputesCount}
                </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3 flex-1">
               <Users size={18} className={activeTab === 'users' ? 'text-blue-400' : ''} /> User Management
            </div>
            {pendingVerificationCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingVerificationCount}
                </span>
            )}
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

          {/* DISPUTES MODULE */}
          {activeTab === 'disputes' && (
             <div className="space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Disputes</h2>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                   {disputes.length > 0 ? (
                      <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                            <tr>
                               <th className="px-6 py-4">Contract</th>
                               <th className="px-6 py-4">Parties</th>
                               <th className="px-6 py-4">Reason</th>
                               <th className="px-6 py-4">Open For</th>
                               <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {disputes.map(d => (
                               <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                  <td className="px-6 py-4">
                                     <p className="font-bold text-slate-900 dark:text-white">{d.contractTitle}</p>
                                     <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">{d.type}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Creator: <span className="font-semibold text-slate-700 dark:text-slate-300">{d.creatorName}</span></p>
                                        <p className="text-xs text-slate-500">Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{d.clientName}</span></p>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={d.reason}>
                                     {d.reason}
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="flex items-center text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full w-fit">
                                        <Clock size={14} className="mr-1.5" /> {d.startedAtAgo}
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <Button size="sm" onClick={() => {
                                        setShowDisputeModal(d);
                                        setDisputeTarget(d.creatorId); // Default select creator
                                     }}>
                                        Review & Resolve
                                     </Button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   ) : (
                      <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                         <CheckCircle size={48} className="text-green-500 mb-4 opacity-50" />
                         <p className="text-lg font-medium">All clear!</p>
                         <p>No active disputes needing attention.</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* USER MANAGEMENT MODULE */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                  <div className="flex gap-2">
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
               </div>

               {/* Filters */}
               <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
                  {['ALL', 'PENDING_VERIFICATION', 'CREATOR', 'CLIENT', 'FLAGGED', 'WATCHLIST', 'SUSPENDED', 'BANNED'].map(filter => (
                     <button
                        key={filter}
                        onClick={() => setUserFilter(filter as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                           userFilter === filter 
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                     >
                        {filter === 'PENDING_VERIFICATION' ? 'Pending Approval' : filter.charAt(0) + filter.slice(1).toLowerCase().replace('_', ' ')}
                     </button>
                  ))}
               </div>

               {/* Table */}
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible">
                  {isLoadingUsers ? (
                     <div className="p-8 text-center text-slate-500">Loading users...</div>
                  ) : (
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                           <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Identity</th>
                              <th className="px-6 py-4">Joined</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {filteredUsers.length > 0 ? filteredUsers.map(u => {
                              const isVerificationPending = (u.role === UserRole.CREATOR && u.profile?.verification?.status === 'pending') || (u.role === UserRole.CLIENT && u.clientProfile?.verificationStatus === 'pending');
                              const isVerified = (u.role === UserRole.CREATOR && u.profile?.verification?.status === 'verified') || (u.role === UserRole.CLIENT && u.clientProfile?.isVerified);
                              
                              return (
                                <tr key={u.id} className={`transition-colors ${isVerificationPending ? 'bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white flex items-center">
                                                {u.name}
                                                {isVerificationPending && <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Verification Pending"></span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </div>
                                        {u.isFlagged && <AlertTriangle size={16} className="text-orange-500" />}
                                        {u.isWatchlisted && (
                                          <span title="On Watchlist" className="inline-block">
                                            <Eye size={16} className="text-purple-500 ml-2" />
                                          </span>
                                        )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                        u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        u.status === 'banned' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        u.status === 'suspended' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                        'bg-slate-100 text-slate-700'
                                        }`}>
                                        {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isVerificationPending ? (
                                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded">
                                                <Loader size={12} className="mr-1 animate-spin" /> Pending Review
                                            </span>
                                        ) : isVerified ? (
                                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
                                                <CheckCircle size={12} className="mr-1" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Unverified</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button 
                                        onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                        >
                                        <MoreVertical size={16} className="text-slate-500" />
                                        </button>
                                        
                                        {/* Action Dropdown */}
                                        {actionMenuOpen === u.id && (
                                        <div className="absolute right-8 top-8 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                            
                                            {/* Verification Actions */}
                                            {isVerificationPending && (
                                                <>
                                                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">Verification</div>
                                                    <button 
                                                        onClick={() => {
                                                          setVerificationReviewUser(u);
                                                          setActionMenuOpen(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center font-medium"
                                                    >
                                                        <FileText size={14} className="mr-2" /> Review Details
                                                    </button>
                                                    <div className="border-b border-slate-100 dark:border-slate-700 my-1"></div>
                                                </>
                                            )}

                                            <button 
                                                onClick={() => handleToggleWatchlist(u.id, !!u.isWatchlisted)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"
                                            >
                                                <Eye size={14} className="mr-2" /> {u.isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                            </button>

                                            <button 
                                                onClick={() => handleFlagUser(u.id, !!u.isFlagged)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center mt-1"
                                            >
                                                <AlertTriangle size={14} className="mr-2" /> {u.isFlagged ? 'Unflag User' : 'Flag for Review'}
                                            </button>
                                            
                                            {u.status === 'active' && (
                                                <button 
                                                    onClick={() => handleUserStatusChange(u.id, 'suspended')}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400 flex items-center"
                                                >
                                                    <UserX size={14} className="mr-2" /> Suspend
                                                </button>
                                            )}

                                            {u.status === 'suspended' && (
                                                <button 
                                                    onClick={() => handleUserStatusChange(u.id, 'active')}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-green-600 dark:text-green-400 flex items-center"
                                                >
                                                    <UserCheck size={14} className="mr-2" /> Remove Suspension
                                                </button>
                                            )}

                                            {u.status === 'banned' && (
                                                <button 
                                                    onClick={() => handleUserStatusChange(u.id, 'active')}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-green-600 dark:text-green-400 flex items-center"
                                                >
                                                    <UserCheck size={14} className="mr-2" /> Activate
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleResetVerification(u.id)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"
                                            >
                                                <RefreshCcw size={14} className="mr-2" /> Reset Verification
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleForceLogout(u.id)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"
                                            >
                                                <LogOut size={14} className="mr-2" /> Force Logout
                                            </button>

                                            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                            
                                            {u.status !== 'banned' && (
                                                <button 
                                                    onClick={() => handleUserStatusChange(u.id, 'banned')}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center"
                                                >
                                                    <XCircle size={14} className="mr-2" /> Ban Permanently
                                                </button>
                                            )}
                                        </div>
                                        )}
                                    </td>
                                </tr>
                              );
                           }) : (
                              <tr>
                                 <td colSpan={6} className="p-8 text-center text-slate-500">No users found matching filters.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>
          )}

          {/* TEAM & ACCESS MODULE (MOCK) */}
          {activeTab === 'team' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Access</h2>
                     <p className="text-slate-500 dark:text-slate-400">Manage system administrators and role-based access control.</p>
                  </div>
                  <Button onClick={() => setShowAddAdminModal(true)}>
                     <Plus size={18} className="mr-2" /> Add Team Member
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   {admins.map(admin => (
                      <div key={admin.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start">
                         <div className="flex gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                               {admin.name.charAt(0)}
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-900 dark:text-white">{admin.name}</h3>
                               <p className="text-sm text-slate-500 mb-2">{admin.email}</p>
                               <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded uppercase">
                                  {admin.role}
                               </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="flex items-center text-green-600 text-xs font-bold mb-1">
                               <CheckCircle size={12} className="mr-1" /> Active
                            </span>
                            <p className="text-xs text-slate-400">Last active: {admin.lastActive}</p>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Add Admin Modal (Mock) */}
                {showAddAdminModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Invite New Admin</h3>
                         <div className="space-y-4">
                            <Input label="Full Name" placeholder="John Doe" />
                            <Input label="Email Address" placeholder="john@ubuni.co.ke" />
                            <div>
                               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                               <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                                  <option>Moderator</option>
                                  <option>Support Agent</option>
                                  <option>Finance Manager</option>
                                  <option>Super Admin</option>
                               </select>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                               <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Access Permissions</p>
                               <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> User Management</label>
                                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Content Moderation</label>
                                  <label className="flex items-center gap-2"><input type="checkbox" /> Financial Records</label>
                                  <label className="flex items-center gap-2"><input type="checkbox" /> System Settings</label>
                               </div>
                            </div>
                         </div>
                         <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setShowAddAdminModal(false)}>Cancel</Button>
                            <Button onClick={() => setShowAddAdminModal(false)}>Send Invitation</Button>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* SETTINGS MODULE */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Admin Settings</h2>

              {/* Appearance */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Sun size={20} className="mr-2" /> Appearance
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-900 dark:text-white">
                        {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                        </div>
                        <div>
                        <p className="font-bold text-slate-900 dark:text-white">System Theme</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Current: <span className="uppercase font-semibold">{theme}</span>
                        </p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Lock size={20} className="mr-2" /> Security
                </h3>
                
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <Input 
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input 
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input 
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.type === 'success' && <CheckCircle size={16} className="mr-2" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Updating...' : 'Change Password'}
                        </Button>
                    </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DISPUTE RESOLUTION MODAL */}
      {showDisputeModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                     <Gavel size={20} className="mr-2 text-blue-600" /> Resolve Dispute
                  </h3>
                  <button onClick={() => setShowDisputeModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                     <XCircle size={24} />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Contract: {showDisputeModal.contractTitle}</p>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Dispute Reason: "{showDisputeModal.reason}"</p>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Party At Fault / Target User</label>
                     <div className="grid grid-cols-2 gap-3">
                        <button
                           onClick={() => setDisputeTarget(showDisputeModal.creatorId)}
                           className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              disputeTarget === showDisputeModal.creatorId 
                                 ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 ring-1 ring-brand-500' 
                                 : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                           }`}
                        >
                           Creator ({showDisputeModal.creatorName})
                        </button>
                        <button
                           onClick={() => setDisputeTarget(showDisputeModal.clientId)}
                           className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              disputeTarget === showDisputeModal.clientId 
                                 ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 ring-1 ring-brand-500' 
                                 : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                           }`}
                        >
                           Client ({showDisputeModal.clientName})
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repercussion</label>
                     <select
                        value={disputeAction}
                        onChange={(e) => setDisputeAction(e.target.value as any)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white"
                     >
                        <option value="CLEAR">Clear (No Action / Warning only)</option>
                        <option value="WARNING">Issue Formal Warning</option>
                        <option value="WATCHLIST">Add to Watchlist</option>
                        <option value="SUSPEND">Suspend Account</option>
                        <option value="BAN">Ban Account</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resolution Note</label>
                     <textarea 
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white"
                        rows={3}
                        placeholder="Explain the verdict..."
                        value={disputeNote}
                        onChange={(e) => setDisputeNote(e.target.value)}
                     />
                  </div>
               </div>

               <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowDisputeModal(null)}>Cancel</Button>
                  <Button onClick={handleResolveDispute} disabled={!disputeNote || isProcessingDispute}>
                     {isProcessingDispute ? 'Processing...' : 'Confirm Verdict'}
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* VERIFICATION REVIEW MODAL */}
      {verificationReviewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                        <ShieldCheck size={20} className="mr-2 text-blue-600" /> Verification Review
                    </h3>
                    <button onClick={() => setVerificationReviewUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            {verificationReviewUser.avatarUrl ? (
                                <img src={verificationReviewUser.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl">{verificationReviewUser.name[0]}</div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{verificationReviewUser.name}</h4>
                            <p className="text-sm text-slate-500">{verificationReviewUser.email}</p>
                            <span className="inline-block px-2 py-0.5 mt-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                                {verificationReviewUser.role}
                            </span>
                        </div>
                    </div>

                    {verificationReviewUser.role === UserRole.CREATOR && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-bold text-slate-500 uppercase">Legal Name (M-Pesa)</label>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">{verificationReviewUser.profile?.legalName || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                    <p className="font-mono font-medium text-slate-900 dark:text-white">{verificationReviewUser.profile?.mpesaNumber || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                                    <p className="font-medium text-slate-900 dark:text-white">{verificationReviewUser.profile?.dob || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {verificationReviewUser.role === UserRole.CLIENT && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-bold text-slate-500 uppercase">Business Name</label>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">{verificationReviewUser.clientProfile?.businessName || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Reg. Number</label>
                                    <p className="font-mono font-medium text-slate-900 dark:text-white">{verificationReviewUser.clientProfile?.registrationNumber || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tax PIN</label>
                                    <p className="font-mono font-medium text-slate-900 dark:text-white">{verificationReviewUser.clientProfile?.taxPin || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                    <Button variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                        handleRejectVerification(verificationReviewUser.id);
                        setVerificationReviewUser(null);
                    }}>
                        Reject
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                        handleVerifyUser(verificationReviewUser.id);
                        setVerificationReviewUser(null);
                    }}>
                        Approve Verification
                    </Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
