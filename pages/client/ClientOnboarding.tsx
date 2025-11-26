import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, User, Building, ChevronRight, ChevronLeft, 
  Globe, MapPin, Target, Layout, AlertCircle
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { ClientProfile, ClientType } from '../../types';

const ClientOnboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ClientProfile>>({
    clientType: ClientType.INDIVIDUAL,
    businessName: '',
    website: '',
    location: '',
    description: '',
    industry: '',
    budgetRange: 'KES 10k - 50k',
  });

  const totalSteps = 3;

  const handleNext = () => {
    setError(null);

    // Validation
    if (currentStep === 2) {
      if (!formData.businessName?.trim() || !formData.location?.trim() || !formData.industry?.trim()) {
        setError("Please fill in all required fields (Business Name, Location, Industry).");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.description?.trim()) {
        setError("Please provide a brief description about your business/profile.");
        return;
      }
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
      await updateProfile({
        clientProfile: formData as ClientProfile,
        onboardingCompleted: true
      });
      navigate('/client/dashboard');
    } catch (error) {
      console.error("Error saving profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What type of client are you?</h2>
        <p className="text-slate-600 dark:text-slate-400">This helps us tailor the experience for your needs.</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => setFormData({ ...formData, clientType: ClientType.INDIVIDUAL })}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
            formData.clientType === ClientType.INDIVIDUAL
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className={`p-3 rounded-xl ${formData.clientType === ClientType.INDIVIDUAL ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <User size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Individual</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Small sellers, solo entrepreneurs, students, or freelancers looking to hire creatives.
            </p>
          </div>
        </button>

        <button
          onClick={() => setFormData({ ...formData, clientType: ClientType.BUSINESS })}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
            formData.clientType === ClientType.BUSINESS
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className={`p-3 rounded-xl ${formData.clientType === ClientType.BUSINESS ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Business</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Small business owners, online shops, startups, or local service providers.
            </p>
          </div>
        </button>

        <button
          onClick={() => setFormData({ ...formData, clientType: ClientType.COMPANY })}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
            formData.clientType === ClientType.COMPANY
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className={`p-3 rounded-xl ${formData.clientType === ClientType.COMPANY ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <Building size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Company / Organization</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Registered companies, corporations, media houses, NGOs, or marketing agencies.
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Details</h2>
        <p className="text-slate-600 dark:text-slate-400">Tell us about your brand or organization.</p>
      </div>

      <div className="space-y-4">
        
        <Input 
          label={formData.clientType === ClientType.INDIVIDUAL ? "Display Name / Brand Name" : "Business Name"} 
          placeholder={formData.clientType === ClientType.COMPANY ? "e.g. Acme Corp Ltd." : "e.g. Sarah's Boutique"}
          value={formData.businessName}
          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          required
        />
        
        <div className="relative">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website (Optional)</label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
             </div>
             <input 
                type="text"
                placeholder="https://example.com"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
             />
           </div>
        </div>

        <div className="relative">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location <span className="text-red-500">*</span></label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
             </div>
             <input 
                type="text"
                placeholder="City, Country"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
             />
           </div>
        </div>

        <Input 
          label="Industry" 
          placeholder="e.g. Fashion, Technology, Food & Beverage"
          value={formData.industry}
          onChange={(e) => setFormData({...formData, industry: e.target.value})}
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Goals</h2>
        <p className="text-slate-600 dark:text-slate-400">Help creators understand who you are and what you're looking for.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">About Your Business <span className="text-red-500">*</span></label>
        <textarea
          rows={4}
          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all duration-200"
          placeholder="Describe your brand, products, or services. What is your mission?"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
        <div className="text-right text-xs text-slate-400 mt-1">
          {formData.description?.length || 0}/500 characters
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Typical Budget Range per Project</label>
        <div className="grid grid-cols-2 gap-3">
           {['< KES 10k', 'KES 10k - 50k', 'KES 50k - 100k', 'KES 100k+'].map(range => (
             <button
                key={range}
                onClick={() => setFormData({...formData, budgetRange: range})}
                className={`py-3 px-4 rounded-xl border text-sm font-medium ${
                  formData.budgetRange === range
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
             >
               {range}
             </button>
           ))}
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
                   currentStep === 1 
                     ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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

export default ClientOnboarding;