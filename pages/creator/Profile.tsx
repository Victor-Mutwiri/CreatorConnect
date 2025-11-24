

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, CheckCircle, Star, Instagram, Youtube, Twitter, Facebook, 
  MessageCircle, Share2, Briefcase, Globe, Shield
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { mockAuth } from '../../services/mockAuth';
import { User, CreatorProfile, ServicePackage } from '../../types';
import { useAuth } from '../../context/AuthContext';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (id) {
        const data = await mockAuth.getCreatorProfile(id);
        setUser(data);
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

  if (!user || !user.profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Creator not found</h2>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const profile = user.profile;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      {/* Cover Image */}
      <div className="h-64 md:h-80 w-full relative bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Cover"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Info Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-md mx-auto -mt-20 overflow-hidden bg-white dark:bg-slate-800">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-4xl font-bold text-brand-600 dark:text-brand-400">
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                    {profile.displayName}
                    {profile.verification?.isIdentityVerified && (
                      <CheckCircle className="text-brand-500 fill-brand-100 dark:fill-brand-900" size={24} />
                    )}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">@{profile.username}</p>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {profile.categories.map(cat => (
                    <span key={cat} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wide">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex justify-center space-x-3">
                  {profile.socials.instagram && (
                    <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-pink-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                      <Instagram size={20} />
                    </a>
                  )}
                  {profile.socials.tiktok && (
                    <a href="#" className="p-2 text-slate-400 hover:text-black dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    </a>
                  )}
                  {profile.socials.youtube && (
                    <a href={profile.socials.youtube} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                      <Youtube size={20} />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center text-slate-600 dark:text-slate-300">
                  <MapPin size={18} className="mr-3 text-slate-400" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center text-slate-600 dark:text-slate-300">
                  <Globe size={18} className="mr-3 text-slate-400" />
                  <span>{profile.experience.languages.join(', ')}</span>
                </div>
                <div className="flex items-center text-slate-600 dark:text-slate-300">
                  <Briefcase size={18} className="mr-3 text-slate-400" />
                  <span>{profile.experience.years} Years Exp.</span>
                </div>
                
                {profile.verification?.trustScore && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                         <Shield size={14} className="mr-1.5 text-brand-600" /> Trust Score
                       </span>
                       <span className="text-sm font-bold text-brand-600">{profile.verification.trustScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${profile.verification.trustScore}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                {currentUser?.id !== user.id && (
                  <>
                    <Link to={`/client/create-contract/${user.id}`}>
                      <Button className="w-full mb-3 shadow-brand-500/20">Hire Me</Button>
                    </Link>
                    <Button variant="outline" className="w-full bg-white dark:bg-slate-800">Message</Button>
                  </>
                )}
                {currentUser?.id === user.id && (
                  <Link to="/creator/settings">
                    <Button variant="outline" className="w-full">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Social Stats */}
            {profile.socialStats && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Audience Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{profile.socialStats.totalFollowers}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Followers</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{profile.socialStats.engagementRate}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Engagement</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio available."}
              </p>
              
              {profile.experience.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.experience.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Grid */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Portfolio</h2>
              </div>
              
              {profile.portfolio.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.portfolio.images.map((img, idx) => (
                    <div key={idx} className="group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative cursor-pointer">
                      <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium">View Project</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 border-dashed">
                  No portfolio items uploaded yet.
                </div>
              )}
            </div>

            {/* Packages */}
            {profile.pricing && profile.pricing.packages && profile.pricing.packages.length > 0 && (
              <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Packages</h2>
                 <div className="space-y-4">
                    {profile.pricing.packages.map((pkg) => (
                      <div key={pkg.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{pkg.title}</h3>
                          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{pkg.description}</p>
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <CheckCircle size={16} className="text-green-500 mr-2" />
                            {pkg.deliveryTimeDays} Day Delivery
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                           <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                             KES {pkg.price.toLocaleString()}
                           </div>
                           <Link to={`/client/create-contract/${user.id}`}>
                             <Button size="sm" variant="outline" className="w-full">Select</Button>
                           </Link>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Rates Overview if no packages */}
            {(!profile.pricing?.packages || profile.pricing.packages.length === 0) && profile.pricing && (
               <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-6 border border-brand-100 dark:border-brand-800">
                  <h3 className="font-bold text-brand-900 dark:text-brand-400 mb-2">Estimated Rates</h3>
                  <p className="text-brand-700 dark:text-brand-300">
                    {profile.pricing.model === 'fixed' && `Starting at KES ${profile.pricing.startingAt?.toLocaleString()}`}
                    {profile.pricing.model === 'range' && `KES ${profile.pricing.minRate?.toLocaleString()} - ${profile.pricing.maxRate?.toLocaleString()}`}
                    {profile.pricing.model === 'negotiable' && "Rates are negotiable based on project scope."}
                  </p>
               </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
