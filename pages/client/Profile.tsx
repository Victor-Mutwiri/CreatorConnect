

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Globe, CheckCircle, ShieldCheck, Star, 
  Briefcase, MessageSquare, Clock
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { mockAuth } from '../../services/mockAuth';
import { User, ClientProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

const ClientPublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Current logged in user (could be creator)

  useEffect(() => {
    const fetchProfile = async () => {
      if (id) {
        const data = await mockAuth.getClientProfile(id);
        setClient(data);
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
                
                {/* Only show "Send Proposal" if user is NOT the client themselves */}
                {user?.id !== client.id && (
                  <div className="flex gap-3">
                     <Button variant="outline">Message</Button>
                     {/* In a real scenario, creators typically wait for clients, but if there's a job post, they apply. 
                         If this is a client profile, maybe creators can 'Pitch' them? 
                         For now, let's keep it informative. */}
                  </div>
                )}
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
            
            {/* Left Column: Stats */}
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <ShieldCheck size={18} className="mr-2 text-brand-600" />
                  Client Reliability
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Payment Reliability</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.stats?.reliabilityScore || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${profile.stats?.reliabilityScore || 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.stats?.contractsSent || 0}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Contracts Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.stats?.hiringRate || '0%'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Hiring Rate</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <Clock size={14} className="mr-2" />
                    Avg. Response: <span className="font-semibold ml-1 text-slate-900 dark:text-white">{profile.stats?.avgResponseTime || 'N/A'}</span>
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
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-slate-300 dark:text-slate-600"} />
                            ))}
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