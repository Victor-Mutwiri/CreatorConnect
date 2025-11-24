
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, Search, Users, Briefcase, 
  MessageSquare, FileText, TrendingUp, Bell, MapPin, 
  Instagram, Star, Heart, CheckCircle, Clock, Filter,
  CreditCard, ChevronRight, User as UserIcon, Send
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
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

  // Handle case where user just signed up and has no images/data
  const coverImage = profile.portfolio?.images?.[0];
  const categories = profile.categories || [];
  const trustScore = profile.verification?.trustScore || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt="Portfolio" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400">
              <UserIcon size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(creator.id);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                saved ? 'bg-brand-500 text-white' : 'bg-white/80 text-slate-600 hover:text-red-500'
              }`}
            >
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                {creator.name}
                {profile.verification?.isIdentityVerified && <CheckCircle size={16} className="text-brand-500 ml-1" />}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-700 dark:text-slate-300">
                <Star size={12} className="text-yellow-500 mr-1" fill="currentColor" />
                {(trustScore / 20).toFixed(1)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {categories.length > 0 ? categories.slice(0, 3).map(cat => (
              <span key={cat} className="text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                {cat}
              </span>
            )) : (
              <span className="text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">
                New Creator
              </span>
            )}
          </div>

          <div className="mt-auto flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-xs">Starting at</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {profile.pricing?.currency || 'KES'} {profile.pricing?.startingAt?.toLocaleString() || profile.pricing?.minRate?.toLocaleString() || 'Negotiable'}
              </span>
            </div>
            <Link to={`/profile/${creator.id}`}>
              <Button size="sm" variant="outline">View Profile</Button>
            </Link>
          </div>
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

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        const [myContracts, myNotes, allCreators] = await Promise.all([
          mockContractService.getContracts(user.id),
          mockContractService.getNotifications(user.id),
          mockAuth.searchCreators(searchQuery, selectedCategory)
        ]);
        setContracts(myContracts);
        setNotifications(myNotes);
        setCreators(allCreators);
        setLoading(false);
      }
    };
    fetchData();
  }, [user, searchQuery, selectedCategory]);

  const toggleSaveCreator = async (creatorId: string) => {
    if (!user) return;
    const updatedUser = await mockAuth.toggleSavedCreator(user.id, creatorId);
    if (updatedUser) {
       await updateProfile({}); 
    }
  };

  const isCreatorSaved = (creatorId: string) => {
    return user?.clientProfile?.savedCreatorIds?.includes(creatorId) || false;
  };

  const activeContracts = contracts.filter(c => c.status === ContractStatus.ACTIVE);
  const pendingContracts = contracts.filter(c => [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(c.status));
  const completedContracts = contracts.filter(c => c.status === ContractStatus.COMPLETED);

  const getStatusColor = (status: ContractStatus) => {
    switch(status) {
      case ContractStatus.ACTIVE: return 'bg-green-100 text-green-700';
      case ContractStatus.SENT: return 'bg-blue-100 text-blue-700';
      case ContractStatus.NEGOTIATING: return 'bg-orange-100 text-orange-700';
      case ContractStatus.COMPLETED: return 'bg-slate-100 text-slate-700';
      case ContractStatus.CANCELLED: return 'bg-red-100 text-red-700';
      case ContractStatus.DECLINED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading && contracts.length === 0 && creators.length === 0) {
    return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // --- Render Sections ---

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                <Briefcase size={20} />
              </div>
              <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeContracts.length}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Users size={20} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Hired Talent</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {new Set(completedContracts.map(c => c.creatorId)).size + new Set(activeContracts.map(c => c.creatorId)).size}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Send size={20} />
              </div>
              <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">In Review</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Offers</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingContracts.length}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spent</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">KES 0</h3>
          </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Action Items / Pending */}
            {pendingContracts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-orange-50 dark:bg-orange-900/10">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                    <Clock size={20} className="mr-2 text-orange-600" /> Pending Actions
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingContracts.map(contract => (
                    <div key={contract.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                             {contract.creatorName ? (
                               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contract.creatorName)}&background=random`} alt={contract.creatorName} />
                             ) : <div className="w-full h-full bg-brand-500" />}
                           </div>
                           <div>
                             <h4 className="font-bold text-slate-900 dark:text-white">{contract.title}</h4>
                             <p className="text-sm text-slate-500 dark:text-slate-400">Proposal to {contract.creatorName || 'Creator'}</p>
                           </div>
                        </div>
                        <Link to={`/creator/contracts/${contract.id}`}>
                           <Button size="sm" variant="outline">View Status</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity / Active */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Campaigns</h3>
                <button onClick={() => setActiveTab('contracts')} className="text-sm font-medium text-brand-600 hover:text-brand-500">View All</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeContracts.length > 0 ? activeContracts.map(contract => (
                  <div key={contract.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{contract.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Hired: {contract.creatorName}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-slate-900 dark:text-white">{contract.terms.currency} {contract.terms.amount.toLocaleString()}</div>
                         <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase mt-1">On Track</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No active campaigns. Post a job to get started!
                  </div>
                )}
              </div>
            </div>
        </div>

        <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <Bell size={18} className="text-slate-400" />
              </div>
              <div className="space-y-4">
                {notifications.length > 0 ? notifications.slice(0, 4).map(note => (
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

            {/* Payment Info */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                     <p className="font-mono text-lg flex items-center">
                       <CreditCard size={18} className="mr-2" /> •••• 4242
                     </p>
                   </div>
                   <div className="bg-white/10 px-2 py-1 rounded text-xs">Primary</div>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-slate-400">Next Billing</span>
                     <span>Aug 1, 2024</span>
                   </div>
                   <button className="w-full mt-2 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-brand-50 transition-colors">
                     Manage Billing
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderContracts = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
         {contracts.length > 0 ? (
           <div className="divide-y divide-slate-100 dark:divide-slate-800">
             {contracts.map(contract => (
               <div key={contract.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                   <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                        {contract.creatorName ? contract.creatorName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{contract.title}</h4>
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-3">
                           <span>{contract.creatorName}</span>
                           <span>•</span>
                           <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right mr-4">
                        <div className="font-bold text-slate-900 dark:text-white">{contract.terms.currency} {contract.terms.amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{contract.terms.deliverables.length} deliverables</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(contract.status)}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                      <Link to={`/creator/contracts/${contract.id}`}>
                        <button className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      </Link>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="p-12 text-center">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <FileText size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-900 dark:text-white">No contracts found</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-1">Create a contract to get started.</p>
           </div>
         )}
       </div>
    </div>
  );

  const renderSearch = () => (
     <div className="space-y-8 animate-in fade-in">
        {/* Search Bar & Filters */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
           <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by name, category, or keywords..." 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                       selectedCategory === cat
                         ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                         : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center"><Filter size={16} className="mr-1" /> Filters:</span>
              <button className="hover:text-brand-600">Price Range</button>
              <button className="hover:text-brand-600">Location</button>
              <button className="hover:text-brand-600">Engagement Rate</button>
              <div className="ml-auto">
                 {creators.length} Creators found
              </div>
           </div>
        </div>

        {/* Results Grid */}
        {creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {creators.map(creator => (
               <CreatorCard 
                 key={creator.id} 
                 creator={creator} 
                 saved={!!isCreatorSaved(creator.id)} 
                 onToggleSave={toggleSaveCreator} 
               />
             ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <Search size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-900 dark:text-white">No creators found</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Try adjusting your search terms or ask a friend to sign up as a Creator!
             </p>
          </div>
        )}
     </div>
  );

  const renderSaved = () => {
    const savedCreators = creators.filter(c => isCreatorSaved(c.id));
    
    return (
      <div className="space-y-6 animate-in fade-in">
        {savedCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCreators.map(creator => (
              <CreatorCard 
                 key={creator.id} 
                 creator={creator} 
                 saved={!!isCreatorSaved(creator.id)} 
                 onToggleSave={toggleSaveCreator} 
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <Heart size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-900 dark:text-white">No saved creators</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">Bookmark talent to find them easily later.</p>
             <button onClick={() => setActiveTab('search')} className="text-brand-600 font-bold hover:underline">
               Find Talent
             </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'overview' && `Welcome, ${user?.clientProfile?.businessName || user?.name}`}
              {activeTab === 'contracts' && 'My Contracts'}
              {activeTab === 'search' && 'Find Talent'}
              {activeTab === 'saved' && 'Saved Creators'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {activeTab === 'overview' && 'Manage your campaigns and find the perfect talent.'}
              {activeTab === 'contracts' && 'Track and manage your ongoing collaborations.'}
              {activeTab === 'search' && 'Discover Kenya\'s top influencers and creators.'}
              {activeTab === 'saved' && 'Your shortlisted talent.'}
            </p>
          </div>
          <div className="flex gap-4">
             {activeTab !== 'search' && (
                <Button variant="outline" className="flex items-center" onClick={() => setActiveTab('search')}>
                   <Search size={18} className="mr-2" /> Find Creators
                </Button>
             )}
             <Button className="flex items-center shadow-lg shadow-brand-500/20">
                <PlusCircle size={18} className="mr-2" /> Post a Job
             </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
           <button
             onClick={() => setActiveTab('overview')}
             className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
               activeTab === 'overview'
                 ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Overview
           </button>
           <button
             onClick={() => setActiveTab('contracts')}
             className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
               activeTab === 'contracts'
                 ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Contracts
           </button>
           <button
             onClick={() => setActiveTab('search')}
             className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
               activeTab === 'search'
                 ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Find Talent
           </button>
           <button
             onClick={() => setActiveTab('saved')}
             className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
               activeTab === 'saved'
                 ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Saved
           </button>
        </div>

        {/* Main Content */}
        <div>
           {activeTab === 'overview' && renderOverview()}
           {activeTab === 'contracts' && renderContracts()}
           {activeTab === 'search' && renderSearch()}
           {activeTab === 'saved' && renderSaved()}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
