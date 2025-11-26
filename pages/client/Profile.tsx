
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Globe, CheckCircle, ShieldCheck, Star, 
  Clock, Award, AlertTriangle, UserCheck
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { mockAuth } from '../../services/mockAuth';
import { mockContractService } from '../../services/mockContract';
import { User, ContractStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

const ClientPublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Current logged in user (could be creator)
  
  // Dynamic Stats
  const [contractsSent, setContractsSent] = useState(0);
  const [hiringRate, setHiringRate] = useState("0%");

  useEffect(() => {
    const fetchProfile = async () => {
      if (id) {
        const [clientData, contractsData] = await Promise.all([
           mockAuth.getClientProfile(id),
           mockContractService.getContracts(id)
        ]);
        setClient(clientData);

        if (contractsData) {
          // Calculate stats from actual contracts
          const totalContracts = contractsData.length;
          setContractsSent(totalContracts);

          // Hiring Rate: Percentage of all proposals that ended up Accepted, Active or Completed
          if (totalContracts > 0) {
             const successfulContracts = contractsData.filter(c => 
               [ContractStatus.ACCEPTED, ContractStatus.ACTIVE, ContractStatus.COMPLETED].includes(c.status)
             ).length;
             const rate = Math.round((successfulContracts / totalContracts) * 100);
             setHiringRate(`${rate}%`);
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!client || !client.clientProfile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Client not found</h2>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const profile = client.clientProfile;
  const trustScore = profile.stats?.trustScore || 0;
  
  // Calculate specific trust breakdown values for display
  const reliabilityPoints = Math.round(((profile.stats?.reliabilityScore || 0) / 100) * 15);
  const ratingPoints = Math.round(((profile.averageRating || 0) / 5) * 15);
  const disputeCount = profile.stats?.disputesLost || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      {/* Banner */}
      <div className="h-48 md:h-64 bg-slate-900 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 to-slate-900 opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          
          {/* Header Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white p-1 shadow-md border border-slate-100 dark:border-slate-700 -mt-16 md:-mt-20 overflow-hidden">
              {client.avatarUrl ? (
                <img src={client.avatarUrl} alt={profile.businessName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center text-3xl font-bold rounded-lg">
                  {profile.businessName?.charAt(0) || client.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {profile.businessName || client.name}
                    {profile.isVerified && (
                      <CheckCircle className="text-brand-500 fill-brand-100 dark:fill-brand-900" size={24} />
                    )}
                  </h1>
                   <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {profile.industry} • {profile.location}
                    </p>
                    <div className="inline-flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded text-xs border border-yellow-100 dark:border-yellow-800/30">
                        <Star className="text-yellow-500 mr-1" size={12} fill="currentColor" />
                        <span className="font-bold text-slate-900 dark:text-white mr-1">{profile.averageRating || '0.0'}</span>
                        <span className="text-slate-500 dark:text-slate-400">({profile.totalReviews || 0})</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {user?.id !== client.id ? (
                     <Button variant="outline">Message</Button>
                  ) : (
                     <Link to="/client/settings">
                       <Button variant="outline">Edit Profile</Button>
                     </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-brand-600 dark:text-brand-400 hover:underline">
                    <Globe size={16} className="mr-1.5" /> Website
                  </a>
                )}
                {profile.budgetRange && (
                   <span className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                     <span className="font-semibold mr-1">Budget:</span> {profile.budgetRange}
                   </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid lg:grid-cols-3 gap-8">
            
            {/* Left Column: Stats & Trust Score */}
            <div className="space-y-6">
              
              {/* Trust Score Card */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                    <ShieldCheck size={20} className="mr-2 text-brand-600" />
                    Trust Score
                   </h3>
                   <span className={`text-2xl font-black ${trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                     {trustScore}
                   </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-6 relative z-10">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${trustScore}%` }}
                  ></div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <UserCheck size={14} className="mr-2 text-slate-400" /> Verified Identity
                     </div>
                     <span className={`font-bold ${profile.isVerified ? 'text-green-600' : 'text-slate-400'}`}>
                       {profile.isVerified ? '+20' : '0'} pts
                     </span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Star size={14} className="mr-2 text-slate-400" /> Ratings & Reliability
                     </div>
                     <span className="font-bold text-slate-900 dark:text-white">
                       +{reliabilityPoints + ratingPoints} pts
                     </span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Award size={14} className="mr-2 text-slate-400" /> Completed Jobs
                     </div>
                     <span className="font-bold text-slate-900 dark:text-white">
                       {profile.stats?.contractsCompleted ? `+${profile.stats.contractsCompleted >= 10 ? 30 : profile.stats.contractsCompleted >= 5 ? 20 : 10}` : '0'} pts
                     </span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <AlertTriangle size={14} className="mr-2 text-slate-400" /> Dispute History
                     </div>
                     <span className={`font-bold ${disputeCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                       {disputeCount > 0 ? `-${disputeCount * 10}` : '+20'} pts
                     </span>
                  </div>
                </div>

                {/* Decorative BG */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl z-0"></div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
                  Activity Stats
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{contractsSent}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Contracts Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{hiringRate}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Hiring Rate</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                     <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <Clock size={14} className="mr-2" />
                      Avg. Response: <span className="font-semibold ml-1 text-slate-900 dark:text-white">{profile.stats?.avgResponseTime || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: About */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About Us</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              </div>

              {/* Reviews */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  Creator Reviews
                  <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">
                    {profile.reviews?.length || 0}
                  </span>
                </h3>

                <div className="space-y-4">
                  {profile.reviews && profile.reviews.length > 0 ? (
                    profile.reviews.map((review) => (
                      <div key={review.id} className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{review.reviewerName}</span>
                            <span className="text-slate-400 text-xs">• {new Date(review.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             {review.paymentRating && (
                                <div className="hidden sm:flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">
                                   <span className="text-[10px] text-green-700 dark:text-green-300 font-medium mr-1">Payment:</span>
                                   <div className="flex text-green-500">
                                     {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full mr-0.5 ${i < (review.paymentRating || 0) ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                                     ))}
                                   </div>
                                </div>
                             )}
                             <div className="flex text-yellow-400">
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-slate-300 dark:text-slate-600"} />
                               ))}
                             </div>
                          </div>
                        </div>
                        {review.projectTitle && (
                           <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-2">Project: {review.projectTitle}</p>
                        )}
                        {review.comment && <p className="text-slate-600 dark:text-slate-300 text-sm italic">"{review.comment}"</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 italic">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientPublicProfile;
