
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ChevronRight, ChevronLeft, Instagram, Youtube, Sparkles, 
  DollarSign, Package, Copy, AlertCircle, Facebook, Twitter
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import FileUpload from '../../components/FileUpload';
import { useAuth } from '../../context/AuthContext';
import { CreatorProfile, ServicePackage } from '../../types';

// Categories for selection
const CATEGORIES = [
  "Lifestyle", "Fashion", "Beauty", "Tech", "Travel", "Food", 
  "Gaming", "Fitness", "Music", "Education", "Comedy", "Business",
  "Art & Design", "Photography", "Parenting", "Sports", "Automotive",
  "Finance & Investing", "Books & Literature", "DIY & Crafts", "Pets",
  "Eco & Sustainability", "Movies & TV", "Mental Health", "Career & Productivity",
  "Real Estate", "Events & Weddings"
];

const SKILLS = [
  "Content Creation", "Video Editing", "Photography", "Live Streaming",
  "Copywriting", "Modelling", "Voice Over", "Public Speaking",
  "Graphic Design", "Motion Graphics", "Scriptwriting", "Storytelling", 
  "SEO", "Social Media Strategy", "Community Management", "Analytics", 
  "Brand Partnerships", "Event Hosting", "Project Management", 
  "Creative Direction", "UGC Creation", "Podcast Production"
];

const Onboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CreatorProfile>>({
    displayName: user?.name || '',
    username: '',
    bio: '',
    location: 'Nairobi, Kenya',
    categories: [],
    socials: { instagram: '', tiktok: '', youtube: '', twitter: '', facebook: '' },
    portfolio: { images: [], links: [''] },
    experience: { years: '0-1', languages: ['English', 'Swahili'], skills: [] },
    pricing: {
      model: 'negotiable',
      currency: 'KES',
      packages: []
    },
    verification: {
      status: 'unverified',
      isIdentityVerified: false,
      isSocialVerified: false,
      trustScore: 20
    }
  });

  const totalSteps = 6;

  const handleNext = () => {
    setError(null);

    // Step 1 Validation: Basic Info
    if (currentStep === 1) {
      if (!formData.displayName?.trim() || !formData.username?.trim() || !formData.bio?.trim() || !formData.location?.trim()) {
        setError("Please fill in all required fields (Display Name, Username, Bio, Location).");
        return;
      }
    }

    // Step 2 Validation: Categories
    if (currentStep === 2 && (formData.categories?.length || 0) === 0) {
      setError("Please select at least one niche to continue.");
      return;
    }

    // Step 5 Validation: Skills
    if (currentStep === 5 && (formData.experience?.skills?.length || 0) === 0) {
      setError("Please select at least one skill.");
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Mock stats generation for onboarding
      const socialStats = {
        totalFollowers: '12.5K',
        engagementRate: '4.8%',
        avgViews: '2.3K'
      };

      await updateProfile({
        profile: { ...formData, socialStats } as CreatorProfile,
        onboardingCompleted: true
      });
      
      // Redirect to dashboard where the verification banner will guide them
      navigate('/creator/dashboard');
    } catch (error) {
      console.error("Error saving profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP COMPONENTS ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Let's start with the basics</h2>
        <p className="text-slate-600 dark:text-slate-400">Tell us a bit about who you are.</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">
             {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                formData.displayName?.[0] || 'U'
             )}
          </div>
          <button className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-brand-600">
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Input 
          label="Display Name" 
          value={formData.displayName}
          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
          placeholder="e.g. Sarah K."
          required
        />
        <Input 
          label="Username" 
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          placeholder="e.g. sarah_creates"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio <span className="text-red-500">*</span></label>
        <textarea
          rows={4}
          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all duration-200"
          placeholder="Tell brands and followers what makes you unique..."
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          required
        />
        <div className="text-right text-xs text-slate-400 mt-1">
          {formData.bio?.length || 0}/200 characters
        </div>
      </div>

      <Input 
        label="Location" 
        value={formData.location}
        onChange={(e) => setFormData({...formData, location: e.target.value})}
        placeholder="City, Country"
        required
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What's your niche?</h2>
        <p className="text-slate-600 dark:text-slate-400">Select up to 5 categories that best describe your content. (Required)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => {
          const isSelected = formData.categories?.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => {
                const current = formData.categories || [];
                if (isSelected) {
                  setFormData({...formData, categories: current.filter(c => c !== cat)});
                } else if (current.length < 5) {
                  setFormData({...formData, categories: [...current, cat]});
                }
              }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                isSelected 
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm ring-1 ring-brand-500' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm text-slate-500">
        Selected: {formData.categories?.length || 0}/5
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Link your socials</h2>
        <p className="text-slate-600 dark:text-slate-400">Connect your accounts to verify your audience.</p>
      </div>

      <div className="space-y-4">
        {/* Instagram */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Instagram className="h-5 w-5 text-pink-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            placeholder="Instagram Username"
            value={formData.socials?.instagram}
            onChange={(e) => setFormData({
              ...formData, 
              socials: {...formData.socials, instagram: e.target.value}
            })}
          />
        </div>

        {/* TikTok */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            placeholder="TikTok Username"
            value={formData.socials?.tiktok}
            onChange={(e) => setFormData({
              ...formData, 
              socials: {...formData.socials, tiktok: e.target.value}
            })}
          />
        </div>

        {/* YouTube */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Youtube className="h-5 w-5 text-red-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            placeholder="YouTube Channel URL"
            value={formData.socials?.youtube}
            onChange={(e) => setFormData({
              ...formData, 
              socials: {...formData.socials, youtube: e.target.value}
            })}
          />
        </div>

        {/* Facebook */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Facebook className="h-5 w-5 text-blue-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            placeholder="Facebook Page URL"
            value={formData.socials?.facebook}
            onChange={(e) => setFormData({
              ...formData, 
              socials: {...formData.socials, facebook: e.target.value}
            })}
          />
        </div>

        {/* X / Twitter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Twitter className="h-5 w-5 text-slate-800 dark:text-slate-300" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
            placeholder="X (Twitter) Username"
            value={formData.socials?.twitter}
            onChange={(e) => setFormData({
              ...formData, 
              socials: {...formData.socials, twitter: e.target.value}
            })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Showcase your work</h2>
        <p className="text-slate-600 dark:text-slate-400">Upload your best photos or add links to past campaigns.</p>
      </div>

      <FileUpload 
        label="Portfolio Images (Max 5)" 
        multiple={true}
        onFileSelect={(files) => {
          const urls = files.map(f => URL.createObjectURL(f));
          setFormData({
            ...formData, 
            portfolio: {
              ...formData.portfolio!, 
              images: [...(formData.portfolio?.images || []), ...urls]
            }
          });
        }} 
      />

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">External Portfolio Links</label>
        {formData.portfolio?.links.map((link, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
             <input
              type="text"
              className="block w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:text-white"
              placeholder="https://..."
              value={link}
              onChange={(e) => {
                const newLinks = [...(formData.portfolio?.links || [])];
                newLinks[idx] = e.target.value;
                setFormData({
                  ...formData,
                  portfolio: {...formData.portfolio!, links: newLinks}
                });
              }}
            />
            {idx === (formData.portfolio?.links.length || 1) - 1 && (
              <button 
                onClick={() => setFormData({
                  ...formData,
                  portfolio: {...formData.portfolio!, links: [...(formData.portfolio?.links || []), '']}
                })}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Experience & Skills</h2>
        <p className="text-slate-600 dark:text-slate-400">Help brands understand what you bring to the table.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Years of Experience</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['0-1', '1-3', '3-5', '5+'].map(opt => (
            <button
              key={opt}
              onClick={() => setFormData({...formData, experience: {...formData.experience!, years: opt}})}
              className={`py-2 px-4 rounded-lg border text-sm font-medium ${
                formData.experience?.years === opt
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {opt} Years
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills (Required)</label>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(skill => {
            const isSelected = formData.experience?.skills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => {
                   const current = formData.experience?.skills || [];
                   if (isSelected) {
                     setFormData({
                       ...formData, 
                       experience: {...formData.experience!, skills: current.filter(s => s !== skill)}
                     });
                   } else {
                      setFormData({
                       ...formData, 
                       experience: {...formData.experience!, skills: [...current, skill]}
                     });
                   }
                }}
                className={`py-1.5 px-3 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pricing & Packages</h2>
        <p className="text-slate-600 dark:text-slate-400">Set your rates and service options.</p>
      </div>

      {/* Pricing Model */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {['fixed', 'range', 'negotiable'].map((m) => (
          <button
            key={m}
            onClick={() => setFormData({
              ...formData, 
              pricing: { ...formData.pricing!, model: m as any }
            })}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              formData.pricing?.model === m
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className={`w-6 h-6 mx-auto mb-2 ${formData.pricing?.model === m ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
            <div className="font-semibold capitalize text-slate-900 dark:text-white">{m} Rate</div>
          </button>
        ))}
      </div>

      {/* Dynamic Inputs based on Model */}
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
        {formData.pricing?.model === 'fixed' && (
          <Input 
            label="Starting Rate (KES)" 
            type="number"
            placeholder="e.g. 10000"
            value={formData.pricing.startingAt || ''}
            onChange={(e) => setFormData({
              ...formData, 
              pricing: { ...formData.pricing!, startingAt: parseInt(e.target.value) }
            })}
          />
        )}
        {formData.pricing?.model === 'range' && (
          <div className="flex gap-4">
             <Input 
              label="Minimum (KES)" 
              type="number"
              placeholder="5000"
              value={formData.pricing.minRate || ''}
              onChange={(e) => setFormData({
                ...formData, 
                pricing: { ...formData.pricing!, minRate: parseInt(e.target.value) }
              })}
            />
            <Input 
              label="Maximum (KES)" 
              type="number"
              placeholder="50000"
              value={formData.pricing.maxRate || ''}
              onChange={(e) => setFormData({
                ...formData, 
                pricing: { ...formData.pricing!, maxRate: parseInt(e.target.value) }
              })}
            />
          </div>
        )}
        {formData.pricing?.model === 'negotiable' && (
          <p className="text-slate-600 dark:text-slate-300 text-center italic">
            Clients will contact you to discuss budget.
          </p>
        )}
      </div>

      {/* Simple Package Builder */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Packages (Optional)</label>
          <button 
             onClick={() => {
               const newPkg: ServicePackage = {
                 id: Math.random().toString(),
                 title: 'New Package',
                 description: 'Describe what is included...',
                 price: 5000,
                 deliveryTimeDays: 3,
                 features: []
               };
               setFormData({
                 ...formData,
                 pricing: { ...formData.pricing!, packages: [...(formData.pricing?.packages || []), newPkg] }
               });
             }}
             className="text-brand-600 text-sm font-medium hover:text-brand-700"
          >
            + Add Package
          </button>
        </div>

        <div className="space-y-4">
          {formData.pricing?.packages?.map((pkg, idx) => (
            <div key={pkg.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
              <div className="flex justify-between mb-2">
                <input 
                  value={pkg.title}
                  onChange={(e) => {
                    const newPkgs = [...(formData.pricing?.packages || [])];
                    newPkgs[idx].title = e.target.value;
                    setFormData({...formData, pricing: {...formData.pricing!, packages: newPkgs}});
                  }}
                  className="font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full"
                />
                <button 
                  onClick={() => {
                     const newPkgs = (formData.pricing?.packages || []).filter((_, i) => i !== idx);
                     setFormData({...formData, pricing: {...formData.pricing!, packages: newPkgs}});
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
              <input 
                  value={pkg.price}
                  type="number"
                  onChange={(e) => {
                    const newPkgs = [...(formData.pricing?.packages || [])];
                    newPkgs[idx].price = parseInt(e.target.value);
                    setFormData({...formData, pricing: {...formData.pricing!, packages: newPkgs}});
                  }}
                  className="text-brand-600 font-semibold mb-2 block w-full bg-transparent border-none p-0 focus:ring-0"
              />
              <textarea
                value={pkg.description}
                onChange={(e) => {
                    const newPkgs = [...(formData.pricing?.packages || [])];
                    newPkgs[idx].description = e.target.value;
                    setFormData({...formData, pricing: {...formData.pricing!, packages: newPkgs}});
                }}
                className="w-full text-sm text-slate-600 dark:text-slate-300 border-none resize-none bg-slate-50 dark:bg-slate-800 p-2 rounded"
                rows={2}
              />
            </div>
          ))}
          {formData.pricing?.packages?.length === 0 && (
             <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
               <Package className="mx-auto w-8 h-8 mb-2 opacity-50" />
               <p className="text-sm">No packages added yet.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
              <motion.div 
                className="bg-brand-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-10">
             {currentStep === 1 && renderStep1()}
             {currentStep === 2 && renderStep2()}
             {currentStep === 3 && renderStep3()}
             {currentStep === 4 && renderStep4()}
             {currentStep === 5 && renderStep5()}
             {currentStep === 6 && renderStep6()}

             {error && (
                <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                   <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                   {error}
                </div>
             )}

             <div className="mt-10 flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
               <button
                 onClick={handleBack}
                 disabled={currentStep === 1}
                 className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                   currentStep === 1 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                 }`}
               >
                 <ChevronLeft size={16} className="mr-1" />
                 Back
               </button>
               
               <Button onClick={handleNext} disabled={isSubmitting}>
                 {isSubmitting ? 'Finalizing...' : (currentStep === totalSteps ? 'Complete Profile' : 'Continue')}
                 {!isSubmitting && currentStep !== totalSteps && <ChevronRight size={16} className="ml-1" />}
               </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;