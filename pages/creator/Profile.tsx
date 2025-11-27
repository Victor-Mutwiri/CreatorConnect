
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, CheckCircle, Star, Instagram, Youtube, Twitter, Facebook, 
  MessageCircle, Share2, Briefcase, Globe, Shield, Clock, CheckSquare, Copy, Link as LinkIcon, Check
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { mockAuth } from '../../services/mockAuth';
import { mockContractService } from '../../services/mockContract';
import { User, CreatorProfile, ServicePackage, ContractStatus, Contract } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Verification Badge Component
const VerificationBadge: React.FC<{ 
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'youtube'; 
  url?: string;
  isVerified?: boolean; 
}> = ({ platform, url, isVerified }) => {
  if (!url) return null;

  const styles = {
    instagram: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white',
    facebook: 'bg-blue-600 text-white',
    twitter: 'bg-black dark:bg-white text-white dark:text-black',
    tiktok: 'bg-black text-white border border-slate-800',
    youtube: 'bg-red-600 text-white'
  };

  const icons = {
    instagram: <Instagram size={16} />,
    facebook: <Facebook size={16} />,
    twitter: <Twitter size={16} />,
    tiktok: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
    youtube: <Youtube size={16} />
  };

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className={`relative p-2 rounded-lg transition-transform hover:scale-105 flex items-center justify-center ${isVerified ? styles[platform] : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
    >
      {icons[platform]}
      {isVerified && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
           <Check size={8} className="text-green-500 font-bold" />
        </div>
      )}
    </a>
  );
};

const Profile: React.FC = () => {
  const { id, username } = useParams<{ id?: string; username?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Metrics State
  const [ongoingCount, setOngoingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      let userData: User | null = null;
      
      if (username) {
        userData = await mockAuth.getUserByUsername(username);
      } else if (id) {
        userData = await mockAuth.getCreatorProfile(id);
      }
      
      setUser(userData);
      
      if (userData) {
        const contracts = await mockContractService.getContracts(userData.id);
        if (contracts) {
          const ongoing = contracts.filter((c: Contract) => 
             (c.creatorId === userData?.id) && [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(c.status)
          ).length;
          const completed = contracts.filter((c: Contract) => 
             (c.creatorId === userData?.id) && c.status === ContractStatus.COMPLETED
          ).length;
          
          setOngoingCount(ongoing);
          setCompletedCount(completed);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id, username]);

  const handleHireMe = () => {
    if (!currentUser) {
      // Redirect to login with state to come back here
      navigate('/login', { state: { from: location.pathname } });
    } else {
      if (user) {
        navigate(`/client/create-contract/${user.id}`);
      }
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
  const isOwner = currentUser?.id === user.id;
  const isIdentityVerified = profile.verification?.status === 'verified';
  const isSocialVerified = profile.verification?.isSocialVerified;

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
        
        {/* Share Button (Visible to everyone) */}
        <div className="absolute top-24 right-4 z-20">
           <button 
             onClick={() => setShowShareModal(true)}
             className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
           >
             <Share2 size={24} />
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Info Card */}
          <div className="space-y-6">
            {/* Removed overflow-hidden to fix avatar clipping */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-md mx-auto -mt-20 overflow-hidden bg-white dark:bg-slate-800 relative z-20">
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
                    
                    {/* Identity Verification Badge with Tooltip */}
                    {isIdentityVerified && (
                      <div className="relative group cursor-pointer">
                        <CheckCircle className="text-brand-500 fill-brand-100 dark:fill-brand-900" size={24} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-30 text-center">
                          <p className="font-bold mb-1">Identity Verified</p>
                          <p className="text-slate-300">Real Person, Account Owner</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      </div>
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

                {/* Rating Badge */}
                <div className="mt-4 inline-flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-100 dark:border-yellow-800/30">
                  <Star className="text-yellow-500 mr-1.5" size={16} fill="currentColor" />
                  <span className="font-bold text-slate-900 dark:text-white mr-1">{profile.averageRating || '0.0'}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">({profile.totalReviews || 0} reviews)</span>
                </div>

                {/* Social Media Badges */}
                <div className="mt-6 flex justify-center gap-3">
                  <VerificationBadge platform="instagram" url={profile.socials.instagram ? `https://instagram.com/${profile.socials.instagram}` : undefined} isVerified={isSocialVerified} />
                  <VerificationBadge platform="tiktok" url={profile.socials.tiktok ? `https://tiktok.com/@${profile.socials.tiktok}` : undefined} isVerified={isSocialVerified} />
                  <VerificationBadge platform="youtube" url={profile.socials.youtube} isVerified={isSocialVerified} />
                  <VerificationBadge platform="facebook" url={profile.socials.facebook} isVerified={isSocialVerified} />
                  <VerificationBadge platform="twitter" url={profile.socials.twitter ? `https://twitter.com/${profile.socials.twitter}` : undefined} isVerified={isSocialVerified} />
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
              
              {/* Added rounded-b-2xl to maintain bottom corners since parent overflow is visible */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
                {!isOwner ? (
                  <>
                    <Button onClick={handleHireMe} className="w-full mb-3 shadow-brand-500/20">
                      Hire Me
                    </Button>
                    <Button variant="outline" className="w-full bg-white dark:bg-slate-800">Message</Button>
                  </>
                ) : (
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

            {/* Performance Metrics Bar (New) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center shadow-sm">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ongoing Contracts</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{ongoingCount}</h3>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center shadow-sm">
                 <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl mr-4">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completed Jobs</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</h3>
                </div>
              </div>
            </div>
            
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
                           <Button size="sm" variant="outline" className="w-full" onClick={handleHireMe}>
                             Select
                           </Button>
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

            {/* NEW: Reviews Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                Client Reviews
                <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">
                  {profile.reviews?.length || 0}
                </span>
              </h2>

              <div className="space-y-4">
                {profile.reviews && profile.reviews.length > 0 ? (
                  profile.reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
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
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 border-dashed">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              x
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Share Profile</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Share this profile with clients or on social media.
            </p>

            <div className="flex gap-2 mb-6">
               <input 
                 readOnly
                 value={window.location.href}
                 className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300"
               />
               <Button onClick={handleCopyLink} size="sm">
                 {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
               </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out this creator on Ubuni Connect!`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-400 transition-colors">
                 <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><Twitter size={20} /></div>
                 <span className="text-xs">Twitter</span>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                 <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><Facebook size={20} /></div>
                 <span className="text-xs">Facebook</span>
              </a>
              <a href={`mailto:?subject=Check out this creator&body=${encodeURIComponent(window.location.href)}`} className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors">
                 <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><MessageCircle size={20} /></div>
                 <span className="text-xs">Email</span>
              </a>
               <button onClick={handleCopyLink} className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-green-500 transition-colors">
                 <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><LinkIcon size={20} /></div>
                 <span className="text-xs">Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;