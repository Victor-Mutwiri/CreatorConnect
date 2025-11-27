
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Database, LogOut, Activity, Settings, Sun, Moon, Lock, 
  CheckCircle, Search, Filter, MoreVertical, XCircle, AlertTriangle, 
  RefreshCcw, UserX, UserCheck, Key, Plus, ShieldCheck, Instagram, Youtube, Twitter, Facebook, ExternalLink
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'verification' | 'team' | 'settings'>('dashboard');

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

  const filterUsers = () => {
    let result = users;

    // Filter by Tab
    if (userFilter === 'CREATOR') result = result.filter(u => u.role === UserRole.CREATOR);
    if (userFilter === 'CLIENT') result = result.filter(u => u.role === UserRole.CLIENT);
    if (userFilter === 'FLAGGED') result = result.filter(u => u.isFlagged);
    if (userFilter === 'BANNED') result = result.filter(u => u.status === 'banned');

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.id.toLowerCase().includes(q) ||
        (u.role === UserRole.CREATOR && u.profile?.mpesaNumber?.includes(q))
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
      fetchPending(); // Refresh Pending Tab
      fetchUsers(); // Refresh Global List
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

  // Filter logic for verification tabs
  const clientsForVerification = users.filter(u => u.role === UserRole.CLIENT && 
    (verificationSearch ? u.name.toLowerCase().includes(verificationSearch.toLowerCase()) || u.clientProfile?.businessName?.toLowerCase().includes(verificationSearch.toLowerCase()) : true)
  );

  const creatorsForSocials = users.filter(u => u.role === UserRole.CREATOR && 
    (verificationSearch ? u.name.toLowerCase().includes(verificationSearch.toLowerCase()) || u.profile?.username?.toLowerCase().includes(verificationSearch.toLowerCase()) : true)
  );

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
            onClick={() => setActiveTab('team')}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'team' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Key size={18} className={activeTab === 'team' ? 'text-blue-400' : ''} /> Team & Access
          </button>
          <button className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors text-left">
            <Database size={18} /> System Logs
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
                
                <div className="mt-8 flex justify-center gap-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    Secure Connection
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                    Encrypted
                </span>
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
                        {filter.charAt(0) + filter.slice(1).toLowerCase() + (filter === 'ALL' ? ' Users' : 's')}
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
                              <th className="px-6 py-4">Trust Score</th>
                              <th className="px-6 py-4">Joined</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {filteredUsers.length > 0 ? filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : null}
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                          <p className="text-xs text-slate-500">{u.email}</p>
                                       </div>
                                       {u.isFlagged && <AlertTriangle size={16} className="text-orange-500" />}
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
                                       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    }`}>
                                       {u.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {u.role === UserRole.CREATOR && u.profile?.verification?.trustScore ? (
                                       <span className="font-mono">{u.profile.verification.trustScore}%</span>
                                    ) : (
                                       <span className="text-slate-400">-</span>
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
                                       <div className="absolute right-8 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                          <button 
                                             onClick={() => handleFlagUser(u.id, !!u.isFlagged)}
                                             className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center"
                                          >
                                             <AlertTriangle size={14} className="mr-2" /> {u.isFlagged ? 'Unflag User' : 'Flag for Review'}
                                          </button>
                                          
                                          {u.status === 'active' ? (
                                             <button 
                                                onClick={() => handleUserStatusChange(u.id, 'suspended')}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400 flex items-center"
                                             >
                                                <UserX size={14} className="mr-2" /> Suspend
                                             </button>
                                          ) : (
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
                           )) : (
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

          {/* VERIFICATION MODULE */}
          {activeTab === 'verification' && (
             <div className="space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Control</h2>
                
                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-fit">
                   {(['pending', 'clients', 'socials'] as const).map(tab => (
                      <button
                         key={tab}
                         onClick={() => setVerificationTab(tab)}
                         className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                            verificationTab === tab
                               ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                               : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                         }`}
                      >
                         {tab === 'pending' ? 'Pending Requests' : tab === 'clients' ? 'Client Approval' : 'Social Media'}
                      </button>
                   ))}
                </div>

                {/* --- Pending Requests (Creators) --- */}
                {verificationTab === 'pending' && (
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                         <h3 className="font-bold text-slate-900 dark:text-white">Identity Verification Queue</h3>
                         <p className="text-sm text-slate-500">Review creator details against M-Pesa records.</p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                         {pendingCreators.length > 0 ? pendingCreators.map(creator => (
                            <div key={creator.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                     {creator.avatarUrl && <img src={creator.avatarUrl} className="w-full h-full object-cover" />}
                                  </div>
                                  <div>
                                     <h4 className="font-bold text-slate-900 dark:text-white">{creator.name}</h4>
                                     <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
                                        <span>Legal Name: <strong className="text-slate-900 dark:text-white">{creator.profile?.legalName}</strong></span>
                                        <span>M-Pesa: <strong className="text-slate-900 dark:text-white">{creator.profile?.mpesaNumber}</strong></span>
                                        <span>DOB: <span className="font-mono">{creator.profile?.dob}</span></span>
                                        <span>Email: {creator.email}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <button 
                                     onClick={() => setRejectModalOpen(creator.id)}
                                     className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium flex items-center"
                                  >
                                     <XCircle size={16} className="mr-2" /> Reject
                                  </button>
                                  <button 
                                     onClick={() => handleApproveIdentity(creator.id)}
                                     className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center shadow-lg shadow-green-500/30"
                                  >
                                     <CheckCircle size={16} className="mr-2" /> Approve
                                  </button>
                               </div>
                            </div>
                         )) : (
                            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                               <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                               <p>No pending verification requests.</p>
                            </div>
                         )}
                      </div>
                   </div>
                )}

                {/* --- Client Approval --- */}
                {verificationTab === 'clients' && (
                   <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                               type="text" 
                               placeholder="Search clients..." 
                               className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white w-64"
                               value={verificationSearch}
                               onChange={(e) => setVerificationSearch(e.target.value)}
                            />
                         </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                               <tr>
                                  <th className="px-6 py-4">Client / Business</th>
                                  <th className="px-6 py-4">Type</th>
                                  <th className="px-6 py-4">Location</th>
                                  <th className="px-6 py-4">Verification Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                               {clientsForVerification.map(client => (
                                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                     <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{client.clientProfile?.businessName || client.name}</div>
                                        <div className="text-xs text-slate-500">{client.email}</div>
                                     </td>
                                     <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">
                                        {client.clientProfile?.clientType || 'Individual'}
                                     </td>
                                     <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                        {client.clientProfile?.location || '-'}
                                     </td>
                                     <td className="px-6 py-4">
                                        <button 
                                           onClick={() => handleToggleClientVerify(client.id, !!client.clientProfile?.isVerified)}
                                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                              client.clientProfile?.isVerified ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                           }`}
                                        >
                                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              client.clientProfile?.isVerified ? 'translate-x-6' : 'translate-x-1'
                                           }`} />
                                        </button>
                                        <span className="ml-3 text-xs font-medium text-slate-500">
                                           {client.clientProfile?.isVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}

                {/* --- Social Media Control --- */}
                {verificationTab === 'socials' && (
                   <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                               type="text" 
                               placeholder="Search creators..." 
                               className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white w-64"
                               value={verificationSearch}
                               onChange={(e) => setVerificationSearch(e.target.value)}
                            />
                         </div>
                      </div>
                      <div className="grid gap-4">
                         {creatorsForSocials.map(creator => {
                            const socials = creator.profile?.socials || {};
                            const verified = creator.profile?.verification?.verifiedPlatforms || [];
                            
                            // Only show creators who have linked at least one social
                            if (!Object.values(socials).some(v => v)) return null;

                            return (
                               <div key={creator.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <div className="flex justify-between items-center mb-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                           {creator.avatarUrl && <img src={creator.avatarUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                           <h4 className="font-bold text-slate-900 dark:text-white">{creator.name}</h4>
                                           <p className="text-xs text-slate-500">@{creator.profile?.username}</p>
                                        </div>
                                     </div>
                                     <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                                        Bio Code: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{creator.profile?.verification?.bioCode || 'N/A'}</span>
                                     </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {/* Social Toggles */}
                                     {socials.instagram && (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                              <Instagram size={16} className="mr-2 text-pink-500" /> 
                                              <span className="truncate max-w-[100px]">{socials.instagram}</span>
                                              <a href={`https://instagram.com/${socials.instagram}`} target="_blank" rel="noreferrer" className="ml-1 text-slate-400 hover:text-blue-500"><ExternalLink size={12}/></a>
                                           </div>
                                           <button onClick={() => handleToggleSocialVerify(creator.id, 'instagram', verified.includes('instagram'))}>
                                              {verified.includes('instagram') ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                           </button>
                                        </div>
                                     )}
                                     {socials.tiktok && (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                              <span className="mr-2 font-bold text-xs">TK</span>
                                              <span className="truncate max-w-[100px]">{socials.tiktok}</span>
                                           </div>
                                           <button onClick={() => handleToggleSocialVerify(creator.id, 'tiktok', verified.includes('tiktok'))}>
                                              {verified.includes('tiktok') ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                           </button>
                                        </div>
                                     )}
                                     {socials.youtube && (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                              <Youtube size={16} className="mr-2 text-red-500" /> 
                                              <span className="truncate max-w-[100px]">Channel</span>
                                              <a href={socials.youtube} target="_blank" rel="noreferrer" className="ml-1 text-slate-400 hover:text-blue-500"><ExternalLink size={12}/></a>
                                           </div>
                                           <button onClick={() => handleToggleSocialVerify(creator.id, 'youtube', verified.includes('youtube'))}>
                                              {verified.includes('youtube') ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                           </button>
                                        </div>
                                     )}
                                     {socials.twitter && (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                              <Twitter size={16} className="mr-2 text-blue-400" /> 
                                              <span className="truncate max-w-[100px]">{socials.twitter}</span>
                                           </div>
                                           <button onClick={() => handleToggleSocialVerify(creator.id, 'twitter', verified.includes('twitter'))}>
                                              {verified.includes('twitter') ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                           </button>
                                        </div>
                                     )}
                                     {socials.facebook && (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                              <Facebook size={16} className="mr-2 text-blue-600" /> 
                                              <span className="truncate max-w-[100px]">Page</span>
                                              <a href={socials.facebook} target="_blank" rel="noreferrer" className="ml-1 text-slate-400 hover:text-blue-500"><ExternalLink size={12}/></a>
                                           </div>
                                           <button onClick={() => handleToggleSocialVerify(creator.id, 'facebook', verified.includes('facebook'))}>
                                              {verified.includes('facebook') ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                           </button>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                )}

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

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-700">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject Verification</h3>
               <textarea 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  rows={3}
                  placeholder="Reason for rejection (sent to user)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
               />
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
