
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, CheckCircle, Clock, DollarSign, Bell, ArrowRight,
  TrendingUp, Activity, Briefcase, XCircle, CheckSquare, AlertTriangle, Gavel, ShieldAlert, Eye
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { Contract, ContractStatus, Notification } from '../../types';

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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [userContracts, userNotes] = await Promise.all([
          mockContractService.getContracts(user.id),
          mockContractService.getNotifications(user.id)
        ]);
        setContracts(userContracts);
        setNotifications(userNotes);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Updated filtering logic to be more precise
  const activeContracts = contracts.filter(c => [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(c.status));
  const pendingContracts = contracts.filter(c => [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(c.status));
  const rejectedContracts = contracts.filter(c => c.status === ContractStatus.DECLINED);
  const completedContracts = contracts.filter(c => c.status === ContractStatus.COMPLETED);
  const cancelledContracts = contracts.filter(c => c.status === ContractStatus.CANCELLED);
  
  // Calculate total closed (Completed + Cancelled)
  const closedCount = completedContracts.length + cancelledContracts.length;

  // Dispute Metrics
  const activeDisputesCount = contracts.filter(c => 
    c.terms.milestones?.some(m => m.status === 'DISPUTED') || 
    (c.endRequest?.status === 'pending' && c.endRequest.type === 'termination')
  ).length;

  // Calculated stats (mocked earnings for now as we don't have completed payment history)
  const calculateTotalEarnings = (userContracts: Contract[]) => {
    return userContracts.reduce((total, contract) => {
      // Case 1: Milestone Contract
      if (contract.terms.paymentType === 'MILESTONE' && contract.terms.milestones) {
        const paidMilestones = contract.terms.milestones.filter(m => m.status === 'PAID');
        const contractEarnings = paidMilestones.reduce((sum, m) => sum + m.amount, 0);
        return total + contractEarnings;
      }
      // Case 2: Fixed Contract
      // Only count if contract is COMPLETED (funds released)
      else if (contract.terms.paymentType === 'FIXED' && contract.status === ContractStatus.COMPLETED) {
        return total + contract.terms.amount;
      }
      return total;
    }, 0);
  };

  const totalEarnings = calculateTotalEarnings(contracts);
  
  // Profile completion calc
  const calculateCompletion = () => {
    if (!user?.profile) return 0;
    let score = 0;
    if (user.profile.bio) score += 20;
    if (user.profile.portfolio.images.length > 0) score += 30;
    if (user.profile.socials.instagram || user.profile.socials.tiktok) score += 20;
    if (user.profile.pricing?.packages?.length) score += 15;
    if (user.profile.verification?.status === 'verified') score += 15;
    return score;
  };

  const completionScore = calculateCompletion();
  const isVerified = user?.profile?.verification?.status === 'verified';
  const verificationStatus = user?.profile?.verification?.status || 'unverified';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        
        {/* Account Status Banners (Suspension / Watchlist) */}
        {user?.status === 'suspended' && (
           <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-full text-red-600 dark:text-red-400">
                 <XCircle size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-red-900 dark:text-red-300">Account Suspended</h3>
                 <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                    Your account has been suspended due to policy violations or unresolved disputes. You are not visible to clients. Please check your notifications for details.
                 </p>
              </div>
           </div>
        )}

        {user?.isWatchlisted && user?.status !== 'suspended' && (
           <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full text-orange-600 dark:text-orange-400">
                 <Eye size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-orange-900 dark:text-orange-300">Account Watchlisted</h3>
                 <p className="text-sm text-orange-800 dark:text-orange-400 mt-1">
                    Your account activity is being monitored by our trust & safety team due to recent reports. Please ensure all future contracts are handled professionally to avoid suspension.
                 </p>
              </div>
           </div>
        )}

        {/* Verification Warning Banner */}
        {!isVerified && user?.status !== 'suspended' && (
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
                     : "Your profile is currently invisible to clients. Verify your identity to start getting job offers."}
                 </p>
               </div>
             </div>
             <Link to="/creator/settings">
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
          <Link to="/creator/contracts">
            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20 flex items-center">
              <Briefcase size={18} className="mr-2" />
              View Contracts
            </button>
          </Link>
        </div>

        {/* Stats Grid - Updated to be more compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard 
            title="Earnings" 
            value={`KES ${totalEarnings >= 1000 ? (totalEarnings/1000).toFixed(1) + 'k' : totalEarnings}`} 
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
            
            {/* Active Contracts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Active Contracts</h3>
                <Link to="/creator/contracts" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeContracts.length > 0 ? activeContracts.map(contract => (
                  <div key={contract.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/client/profile/${contract.clientId}`} className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {contract.clientAvatar ? (
                            <img src={contract.clientAvatar} alt={contract.clientName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center font-bold text-slate-500">{contract.clientName[0]}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{contract.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{contract.clientName}</p>
                        </div>
                      </Link>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">KES {contract.terms.amount.toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span>Due in {contract.terms.durationDays} days</span>
                      </div>
                      <Link to={`/creator/contracts/${contract.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center">
                        Manage <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p>No active contracts yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            {pendingContracts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pending Offers</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingContracts.map(contract => (
                    <div key={contract.id} className="p-6 bg-orange-50/30 dark:bg-orange-900/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Link to={`/client/profile/${contract.clientId}`} className="flex items-center space-x-3 group">
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold overflow-hidden">
                             {contract.clientAvatar ? (
                                <img src={contract.clientAvatar} alt={contract.clientName} className="w-full h-full object-cover" />
                             ) : (
                                contract.clientName[0]
                             )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{contract.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">From {contract.clientName}</p>
                          </div>
                        </Link>
                        <div className="flex items-center space-x-3">
                           <div className="text-right mr-2 hidden sm:block">
                             <div className="font-bold text-slate-900 dark:text-white">KES {contract.terms.amount.toLocaleString()}</div>
                             <div className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase">{contract.status.replace('_', ' ')}</div>
                           </div>
                           <Link to={`/creator/contracts/${contract.id}`}>
                             <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                               View Offer
                             </button>
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  {user?.profile?.bio ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Add Bio
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  {user?.profile?.portfolio?.images?.length ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Upload Portfolio
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  {isVerified ? <CheckCircle size={16} className="text-green-500 mr-2" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mr-2" />}
                  Verify Identity
                </li>
              </ul>
              {completionScore < 100 && (
                <Link to="/creator/onboarding">
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

export default Dashboard;
