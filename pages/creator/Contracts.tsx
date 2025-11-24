
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { Contract, ContractStatus } from '../../types';

const Contracts: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED'>('ALL');

  useEffect(() => {
    const fetchContracts = async () => {
      if (user) {
        const data = await mockContractService.getContracts(user.id);
        setContracts(data);
      }
      setLoading(false);
    };
    fetchContracts();
  }, [user]);

  const filteredContracts = contracts.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return c.status === ContractStatus.ACTIVE;
    if (filter === 'PENDING') return [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(c.status);
    if (filter === 'COMPLETED') return c.status === ContractStatus.COMPLETED;
    return true;
  });

  const getStatusColor = (status: ContractStatus) => {
    switch(status) {
      case ContractStatus.ACTIVE: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case ContractStatus.SENT: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case ContractStatus.NEGOTIATING: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case ContractStatus.COMPLETED: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      case ContractStatus.CANCELLED:
      case ContractStatus.DECLINED: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Contracts</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search clients..." 
                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm dark:text-white"
              />
            </div>
            <button className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredContracts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContracts.map(contract => (
                <div key={contract.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    
                    <div className="flex gap-4">
                       <Link to={`/client/profile/${contract.clientId}`}>
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
                              {contract.clientAvatar ? (
                                <img src={contract.clientAvatar} alt={contract.clientName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{contract.clientName[0]}</div>
                              )}
                          </div>
                       </Link>
                       <div>
                         <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                            {contract.title}
                         </h3>
                         <Link to={`/client/profile/${contract.clientId}`} className="text-slate-500 dark:text-slate-400 text-sm mb-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                            {contract.clientName}
                         </Link>
                         <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {new Date(contract.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <DollarSign size={14} className="mr-1" />
                              {contract.terms.currency} {contract.terms.amount.toLocaleString()}
                            </span>
                         </div>
                       </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(contract.status)}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                      <Link to={`/creator/contracts/${contract.id}`} className="w-full sm:w-auto">
                        <button className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all bg-white dark:bg-slate-800">
                           View Details <ChevronRight size={16} className="ml-1" />
                        </button>
                      </Link>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter size={24} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No contracts found</h3>
              <p className="mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contracts;
