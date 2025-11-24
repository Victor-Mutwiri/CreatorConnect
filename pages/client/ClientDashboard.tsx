
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, Search, Users, Briefcase, 
  MessageSquare, FileText, TrendingUp 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome, {user?.clientProfile?.businessName || user?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your campaigns and find the perfect talent.
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="flex items-center">
                <Search size={18} className="mr-2" /> Find Creators
             </Button>
             <Button className="flex items-center shadow-lg shadow-brand-500/20">
                <PlusCircle size={18} className="mr-2" /> Post a Job
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                 <Briefcase size={20} />
               </div>
               <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Jobs</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3</h3>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                 <Users size={20} />
               </div>
             </div>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Hired Creators</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white">12</h3>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                 <MessageSquare size={20} />
               </div>
               <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">New</span>
             </div>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Unread Messages</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white">5</h3>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                 <TrendingUp size={20} />
               </div>
             </div>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spent</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white">KES 450k</h3>
           </div>
        </div>

        {/* Content Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {/* Recent Jobs */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Campaigns</h3>
                 <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-500">View All</a>
               </div>
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Summer Product Launch</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Posted 2 days ago • 5 Proposals</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="space-y-8">
             {/* Suggested Creators */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
               <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top Creators for You</h3>
               <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                     <div>
                       <p className="font-bold text-slate-900 dark:text-white text-sm">Sarah K.</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Lifestyle • 12k Followers</p>
                     </div>
                     <button className="ml-auto text-brand-600 hover:text-brand-500 text-xs font-bold">View</button>
                   </div>
                 ))}
               </div>
               <Button variant="outline" className="w-full mt-6 text-sm">Explore Talent</Button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDashboard;