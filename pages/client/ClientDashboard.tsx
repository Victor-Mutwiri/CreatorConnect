
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, Search, Briefcase, 
  TrendingUp, Bell, Clock,
  CreditCard, User as UserIcon, Send,
  AlertTriangle, Gavel, Users, Heart, Star, CheckCircle, XCircle, Eye, ShieldAlert,
  DollarSign, Activity, CheckSquare, ArrowRight, Flag
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { mockAuth } from '../../services/mockAuth';
import { mockContractService } from '../../services/mockContract';
import { Contract, ContractStatus, User, Notification } from '../../types';

type Tab = 'overview' | 'contracts' | 'search' | 'saved';

const CATEGORIES = ["All", "Fashion", "Tech", "Food", "Lifestyle", "Beauty", "Travel", "Business", "Art & Design"];

interface CreatorCardProps {
  creator: User;
  saved: boolean;
  onToggleSave: (id: string) => void;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, saved, onToggleSave }) => {
  const profile = creator.profile;
  if (!profile) return null;

  const coverImage = profile.portfolio?.images?.[0];
  const categories = profile.categories || [];
  const trustScore = profile.verification?.trustScore || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt="Portfolio" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400">
              <UserIcon size={40} />
          </div>
        )}
        <div className="absolute top-2 right-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(creator.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
                saved ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-600 hover:text-red-500'
              }`}
            >
              <Heart size={16} fill={saved ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                {creator.name}
                {profile.verification?.isIdentityVerified && <CheckCircle size={14} className="text-brand-500 ml-1" />}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{profile.username}</p>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                <Star size={10} className="text-yellow-500 mr-1" fill="currentColor" />
                {(trustScore / 20).toFixed(1)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {categories.length > 0 ? categories.slice(0, 2).map(cat => (
              <span key={cat} className="text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                {cat}
              </span>
            )) : (
              <span className="text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                New Creator
              </span>
            )}
          </div>

          <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Starting at</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.pricing?.currency || 'KES'} {profile.pricing?.startingAt?.toLocaleString() || profile.pricing?.minRate?.toLocaleString() || 'Negotiable'}
                  </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Link to={`/client/create-contract/${creator.id}`}>
                  <Button size="sm" className="w-full h-8 text-xs">Hire</Button>
                </Link>
                <Link to={`/profile/${creator.id}`}>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs">Profile</Button>
                </Link>
            </div>
          </div>
      </div>
    </div>
  );
};

// New Compact Widget
const StatWidget: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  iconColorClass: string;
}> = ({ label, value, icon: Icon, colorClass, iconColorClass }) => (
  <div className={`bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors ${colorClass}`}>
    <div className={`p-2 rounded-lg ${iconColorClass} flex-shrink-0`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5 truncate">{label}</p>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none truncate">{value}</h3>
    </div>
  </div>
);

// StatCard Definition
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  trendUp?: boolean;
  color?: string;
}> = ({ title, value, icon: Icon, trend, trendUp, color = 'brand' }) => {
  const colorClasses = {
    brand: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
  };
  
  // @ts-ignore
  const iconBg = colorClasses[color] || colorClasses.brand;

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-row items-center gap-3 transition-transform hover:scale-[1.02]">
      <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5 truncate">{title}</p>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none truncate">{value}</h3>
        {trend && (
          <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setLoading(true);
          const [myContracts, myNotes, allCreators] = await Promise.all([
            mockContractService.getContracts(user.id),
            mockContractService.getNotifications(user.id),
            mockAuth.searchCreators(searchQuery, selectedCategory)
          ]);
          setContracts(myContracts);
          setNotifications(myNotes);
          setCreators(allCreators);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, searchQuery, selectedCategory]);

  const toggleSaveCreator = async (creatorId: string) => {
    if (!user) return;
    
    // Optimistic Update locally
    const currentSaved = user.clientProfile?.savedCreatorIds || [];
    const isAlreadySaved = currentSaved.includes(creatorId);
    let newSavedIds = [];
    if (isAlreadySaved) {
       newSavedIds = currentSaved.filter(id => id !== creatorId);
    } else {
       newSavedIds = [...currentSaved, creatorId];
    }
    
    // Update local context first for responsiveness
    await updateProfile({
       clientProfile: { ...user.clientProfile!, savedCreatorIds: newSavedIds }
    });

    // Persist to DB
    await mockAuth.toggleSavedCreator(user.id, creatorId);
  };

  const isCreatorSaved = (creatorId: string) => {
    return user?.clientProfile?.savedCreatorIds?.includes(creatorId) || false;
  };

  // Contracts Filtering Logic
  const activeContracts = contracts.filter(c => [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(c.status));
  const pendingContracts = contracts.filter(c => [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(c.status));
  const completedContracts = contracts.filter(c => c.status === ContractStatus.COMPLETED);

  // Stats Calculations
  const calculateTotalSpent = (clientContracts: Contract[]) => {
    return clientContracts.reduce((total, contract) => {
      if (contract.terms.paymentType === 'MILESTONE' && contract.terms.milestones) {
        const paidMilestones = contract.terms.milestones.filter(m => m.status === 'PAID');
        return total + paidMilestones.reduce((sum, m) => sum + m.amount, 0);
      } else if (contract.terms.paymentType === 'FIXED' && contract.status === ContractStatus.COMPLETED) {
        return total + contract.terms.amount;
      }
      return total;
    }, 0);
  };

  const totalSpent = calculateTotalSpent(contracts);
  
  const uniqueTalent = new Set([
    ...activeContracts.map(c => c.creatorId),
    ...completedContracts.map(c => c.creatorId)
  ]);
  const hiredTalentCount = uniqueTalent.size;

  // Dispute Metrics
  const activeDisputesCount = contracts.filter(c => 
    c.terms.milestones?.some(m => m.status === 'DISPUTED') || 
    (c.endRequest?.status === 'pending' && c.endRequest.type === 'termination')
  ).length;

  const closedDisputesCount = (user?.clientProfile?.stats?.disputesWon || 0) + (user?.clientProfile?.stats?.disputesLost || 0);

  const getStatusColor = (status: ContractStatus) => {
    switch(status) {
      case ContractStatus.ACTIVE: 
      case ContractStatus.ACCEPTED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case ContractStatus.SENT: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case ContractStatus.NEGOTIATING: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case ContractStatus.COMPLETED: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case ContractStatus.CANCELLED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case ContractStatus.DECLINED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Additional Variables for Dashboard
  const isVerified = user?.clientProfile?.isVerified || false;
  const verificationStatus = user?.clientProfile?.verificationStatus || (isVerified ? 'verified' : 'unverified');
  const closedCount = completedContracts.length + contracts.filter(c => c.status === ContractStatus.CANCELLED).length;

  const calculateCompletion = () => {
    if (!user?.clientProfile) return 0;
    let score = 0;
    if (user.clientProfile.businessName) score += 20;
    if (user.clientProfile.location) score += 20;
    if (user.clientProfile.description) score += 20;
    if (user.clientProfile.industry) score += 20;
    if (user.clientProfile.isVerified) score += 20;
    return score;
  };
  const completionScore = calculateCompletion();

  // Filter creators based on showSavedOnly
  const displayedCreators = showSavedOnly 
    ? creators.filter(c => isCreatorSaved(c.id))
    : creators;

  if (loading) {
    return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // --- Render Sections ---

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Stats Grid - Compact Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatWidget 
            label="Active Jobs"
            value={activeContracts.length}
            icon={Briefcase}
            colorClass=""
            iconColorClass="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          />
          <StatWidget 
            label="Hired Talent"
            value={hiredTalentCount}
            icon={Users}
            colorClass=""
            iconColorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />
          <StatWidget 
            label="Pending"
            value={pendingContracts.length}
            icon={Send}
            colorClass=""
            iconColorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <StatWidget 
            label="Total Spent"
            value={`KES ${totalSpent >= 1000 ? (totalSpent/1000).toFixed(1) + 'k' : totalSpent}`}
            icon={TrendingUp}
            colorClass=""
            iconColorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          />
          <StatWidget 
            label="Active Disputes"
            value={activeDisputesCount}
            icon={AlertTriangle}
            colorClass={activeDisputesCount > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}
            iconColorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          />
          <StatWidget 
            label="Closed Disputes"
            value={closedDisputesCount}
            icon={Gavel}
            colorClass=""
            iconColorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Action Items / Pending */}
            {pendingContracts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50 dark:bg-orange-900/10">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                    <Clock size={18} className="mr-2 text-orange-600" /> Pending Actions
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingContracts.map(contract => (
                    <div key={contract.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                             {contract.creatorName ? (
                               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contract.creatorName)}&background=random`} alt={contract.creatorName} />
                             ) : <div className="w-full h-full bg-brand-500" />}
                           </div>
                           <div>
                             <h4 className="font-bold text-sm text-slate-900 dark:text-white">{contract.title}</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400">Proposal to {contract.creatorName || 'Creator'}</p>
                           </div>
                        </div>
                        <Link to={`/creator/contracts/${contract.id}`}>
                           <Button size="sm" variant="outline" className="h-8 text-xs">View Status</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity / Active */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Campaigns</h3>
                <button onClick={() => setActiveTab('contracts')} className="text-xs font-medium text-brand-600 hover:text-brand-500">View All</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeContracts.length > 0 ? activeContracts.map(contract => (
                  <div key={contract.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{contract.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Hired: {contract.creatorName}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-slate-900 dark:text-white">{contract.terms.currency} {contract.terms.amount.toLocaleString()}</div>
                         <div className="text-[10px] text-green-600 dark:text-green-400 font-medium uppercase mt-0.5">
                           On Track
                         </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No active campaigns. Post a job to get started!
                  </div>
                )}
              </div>
            </div>
        </div>

        <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Notifications</h3>
                <Bell size={16} className="text-slate-400" />
              </div>
              <div className="space-y-3">
                {notifications.length > 0 ? notifications.slice(0, 4).map(note => (
                  <div key={note.id} className="flex gap-2 items-start">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${note.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-500'}`} />
                    <div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">{note.message}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No new notifications.</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <p className="text-slate-400 text-xs mb-1">Payment Method</p>
                     <p className="font-mono text-sm flex items-center">
                       <CreditCard size={16} className="mr-2" /> •••• 4242
                     </p>
                   </div>
                   <div className="bg-white/10 px-2 py-0.5 rounded text-[10px]">Primary</div>
                </div>
                <div className="pt-3 border-t border-white/10">
                   <div className="flex justify-between text-xs mb-2">
                     <span className="text-slate-400">Next Billing</span>
                     <span>Aug 1, 2024</span>
                   </div>
                   <button className="w-full mt-1 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-brand-50 transition-colors">
                     Manage Billing
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Search Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, skill (e.g. React, Photography) or bio..." 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white transition-all shadow-sm focus:shadow-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 items-center">
          {/* Favorites Filter */}
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border flex items-center gap-2 ${
              showSavedOnly
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-red-300'
            }`}
          >
            <Heart size={16} fill={showSavedOnly ? "currentColor" : "none"} /> Saved
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowSavedOnly(false); // Reset saved filter when changing category
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-600 shadow-brand-500/20 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {displayedCreators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedCreators.map(creator => (
            <CreatorCard 
              key={creator.id} 
              creator={creator} 
              saved={isCreatorSaved(creator.id)}
              onToggleSave={toggleSaveCreator}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
          <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
            {showSavedOnly ? <Heart size={32} className="text-red-300" /> : <Search size={32} className="text-slate-300" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {showSavedOnly ? 'No saved creators' : 'No creators found'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {showSavedOnly 
              ? "You haven't saved any creators yet. Browse the list and click the heart icon to save them for later." 
              : "Try adjusting your search terms or category filter to find the talent you need."}
          </p>
          {showSavedOnly && (
             <Button variant="outline" className="mt-4" onClick={() => setShowSavedOnly(false)}>Browse All</Button>
          )}
        </div>
      )}
    </div>
  );

  const renderContracts = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {contracts.length > 0 ? contracts.map(contract => (
               <div key={contract.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{contract.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Creator: {contract.creatorName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(contract.status)}`}>
                         {contract.status.replace('_', ' ')}
                       </span>
                       <Link to={`/creator/contracts/${contract.id}`}>
                         <Button size="sm" variant="outline">Manage</Button>
                       </Link>
                    </div>
                  </div>
               </div>
            )) : (
               <div className="p-12 text-center text-slate-500">No contracts found.</div>
            )}
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        
        {/* Account Status Banners (Suspension / Flagged / Watchlist / Ban) */}
        
        {user?.status === 'banned' && (
           <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-full text-red-600 dark:text-red-400">
                 <XCircle size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-red-900 dark:text-red-300">Account Banned</h3>
                 <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                    Your account has been permanently banned due to severe policy violations. You can no longer accept new contracts or withdraw funds.
                 </p>
              </div>
           </div>
        )}

        {user?.status === 'suspended' && (
           <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full text-orange-600 dark:text-orange-400">
                 <XCircle size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-orange-900 dark:text-orange-300">Account Suspended</h3>
                 <p className="text-sm text-orange-800 dark:text-orange-400 mt-1">
                    Your account has been suspended due to policy violations or unresolved disputes. You are not visible to clients. Please check your notifications for details.
                 </p>
              </div>
           </div>
        )}

        {user?.isFlagged && user?.status !== 'suspended' && user?.status !== 'banned' && (
           <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-800/30 rounded-full text-rose-600 dark:text-rose-400">
                 <Flag size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-rose-900 dark:text-rose-300">Account Flagged for Review</h3>
                 <p className="text-sm text-rose-800 dark:text-rose-400 mt-1">
                    Your account has been flagged{user.flagReason ? `: ${user.flagReason}` : '.'} Our team is reviewing your activity.
                 </p>
              </div>
           </div>
        )}

        {user?.isWatchlisted && user?.status !== 'suspended' && user?.status !== 'banned' && (
           <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-full text-yellow-600 dark:text-yellow-400">
                 <Eye size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-yellow-900 dark:text-yellow-300">Account Watchlisted</h3>
                 <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                    Your account activity is being monitored by our trust & safety team due to recent reports. Please ensure all future contracts are handled professionally to avoid suspension.
                 </p>
              </div>
           </div>
        )}

        {/* Verification Warning Banner */}
        {!isVerified && user?.status !== 'suspended' && user?.status !== 'banned' && (
          <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
             <div className="flex items-start gap-4">
               <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full text-orange-600 dark:text-orange-400 mt-1">
                 <ShieldAlert size={24} />
               </div>
               <div>
                 <h3 className="font-bold text-orange-900 dark:text-orange-300">
                   {verificationStatus === 'pending' ? 'Verification In Review' : 'Account Not Verified'}
                 </h3>
                 <p className="text-sm text-orange-800 dark:text-orange-400 mt-1">
                   {verificationStatus === 'pending' 
                     ? "Your verification details are currently under review. This usually takes up to 72 hours."
                     : "Verify your business details to build trust with creators and unlock premium features."}
                 </p>
               </div>
             </div>
             <Link to="/client/settings">
               <Button className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap">
                 {verificationStatus === 'pending' ? 'View Status' : 'Verify Now'}
               </Button>
             </Link>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Welcome back, {user?.name.split(' ')[0]}! Here's what's happening.</p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => setActiveTab('search')}
               className={`px-5 py-2.5 rounded-full font-medium transition-colors flex items-center shadow-lg ${
                 activeTab === 'search' 
                   ? 'bg-brand-600 text-white shadow-brand-500/20' 
                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
               }`}
             >
               <Search size={18} className="mr-2" />
               Find Talent
             </button>
             <Link to="/creator/contracts">
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20 flex items-center">
                  <Briefcase size={18} className="mr-2" />
                  View Contracts
                </button>
             </Link>
          </div>
        </div>

        {/* Stats Grid - Updated to be more compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard 
            title="Total Spent" 
            value={`KES ${totalSpent >= 1000 ? (totalSpent/1000).toFixed(1) + 'k' : totalSpent}`} 
            icon={DollarSign} 
            color="brand"
          />
          <StatCard 
            title="Active Jobs" 
            value={activeContracts.length} 
            icon={Activity} 
            color="blue"
          />
           <StatCard 
            title="Pending" 
            value={pendingContracts.length} 
            icon={Clock} 
            color="orange"
          />
          <StatCard 
            title="Closed" 
            value={closedCount} 
            icon={CheckSquare} 
            color="green"
          />
           <StatCard 
              title="Active Disputes" 
              value={activeDisputesCount} 
              icon={AlertTriangle} 
              color={activeDisputesCount > 0 ? "red" : "slate"}
            />
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-row items-center gap-3 transition-transform hover:scale-[1.02]">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex-shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5">Completion</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {completionScore}%
                </h3>
              </div>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-1 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'overview' 
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'contracts' 
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                My Contracts
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'search' && renderSearch()}
            {activeTab === 'contracts' && renderContracts()}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Profile Completion */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Profile Completion</h3>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{completionScore}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-6">
                <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${completionScore}%` }}></div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  {user?.clientProfile?.description ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Add Description
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  {user?.clientProfile?.location ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Add Location
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  {isVerified ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Verify Business
                </li>
              </ul>
              {completionScore < 100 && (
                <Link to="/client/settings">
                  <button className="w-full mt-6 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 transition-colors">
                    Complete Profile
                  </button>
                </Link>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <Bell size={18} className="text-slate-400" />
              </div>
              <div className="space-y-4">
                {notifications.length > 0 ? notifications.slice(0, 3).map(note => (
                  <div key={note.id} className="flex gap-3 items-start">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${note.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-500'}`} />
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">{note.message}</p>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No new notifications.</p>
                )}
              </div>
            </div>

            {/* Plan Status */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
               <h3 className="font-bold text-lg mb-1">Free Plan</h3>
               <p className="text-slate-300 text-sm mb-6">Upgrade to Pro to lower fees and get verified instantly.</p>
               <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-brand-50 transition-colors">
                 Upgrade to Pro
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
