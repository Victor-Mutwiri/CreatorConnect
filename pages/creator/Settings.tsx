
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Bell, Lock, Palette, Save, CheckCircle, 
  Instagram, Youtube, Trash2, Plus, Moon, Sun, AlertTriangle, CreditCard,
  Smartphone, Building, Bitcoin, ShieldCheck, HelpCircle, EyeOff, Loader,
  Copy, Check, Facebook, Twitter
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CreatorProfile } from '../../types';

const CATEGORIES = [
  "Lifestyle", "Fashion", "Beauty", "Tech", "Travel", "Food", 
  "Gaming", "Fitness", "Music", "Education", "Comedy", "Business",
  "Art & Design", "Photography", "Parenting", "Sports"
];

const KENYAN_BANKS = [
  "KCB Bank", "Equity Bank", "Co-operative Bank", "NCBA Bank", 
  "Stanbic Bank", "Absa Bank Kenya", "Diamond Trust Bank (DTB)", 
  "I&M Bank", "Standard Chartered", "Family Bank"
];

const Settings: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'account' | 'appearance' | 'payments'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deathEffect, setDeathEffect] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Verification Edit Warning
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CreatorProfile>>({});

  useEffect(() => {
    if (user?.profile) {
      setFormData(user.profile);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData) {
        await updateProfile({ profile: formData as CreatorProfile });
        setSuccessMsg('Settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSubmit = async () => {
    // Basic validation
    if (!formData.legalName || !formData.dob || !formData.mpesaNumber) {
      alert("Please fill in all verification fields.");
      return;
    }

    setIsSaving(true);
    try {
      // Logic for submitting verification
      // NOTE: We do NOT ask for ID upload anymore. Just details.
      const updatedProfile = { 
        ...formData,
        verification: {
          ...formData.verification!,
          status: 'pending' as const, // TS enum constraint
          isIdentityVerified: false
        }
      };
      
      await updateProfile({ profile: updatedProfile as CreatorProfile });
      setFormData(updatedProfile); // Update local state immediately
      setSuccessMsg('Verification submitted! Review pending.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Failed to submit verification", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockVerification = () => {
    // Reset status to unverified so they can edit
    setShowVerificationWarning(false);
    setFormData(prev => ({
      ...prev,
      verification: {
        ...prev.verification!,
        status: 'unverified' as const,
        isIdentityVerified: false
      }
    }));
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    const result = await deleteAccount();
    
    if (result.success) {
      setShowDeleteModal(false);
      // Trigger Dramatic Effect
      setDeathEffect(true);
      setTimeout(async () => {
        navigate('/');
      }, 2500);
    } else {
      setDeleteError(result.error || "Failed to delete account.");
    }
  };

  // Generate a random bio code if not present
  useEffect(() => {
    if (activeTab === 'verification' && !formData.verification?.bioCode) {
      setFormData(prev => ({
        ...prev,
        verification: {
          ...prev.verification!,
          bioCode: `UBUNI-${Math.floor(1000 + Math.random() * 9000)}`
        }
      }));
    }
  }, [activeTab, formData.verification]);

  const verifySocials = async () => {
    // Simulate verification
    setIsSaving(true);
    setTimeout(async () => {
      const updatedProfile = {
        ...formData,
        verification: {
          ...formData.verification!,
          isSocialVerified: true,
          trustScore: (formData.verification?.trustScore || 20) + 20
        }
      };
      await updateProfile({ profile: updatedProfile as CreatorProfile });
      setFormData(updatedProfile);
      setSuccessMsg('Socials Verified!');
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1000);
  };

  const renderProfileTab = () => (
    <div className="space-y-8 animate-in fade-in">
      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Input 
            label="Display Name" 
            value={formData.displayName || ''}
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
          />
          <Input 
            label="Username" 
            value={formData.username || ''}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
          />
          <Input 
            label="Location" 
            value={formData.location || ''}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all duration-200"
            value={formData.bio || ''}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Your Niche</h3>
        <div className="flex flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isSelected 
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Socials */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Social Media Links</h3>
        <div className="space-y-4">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Instagram className="h-5 w-5 text-pink-500" />
             </div>
             <input 
                type="text"
                placeholder="Instagram Username"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.socials?.instagram || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  socials: {...formData.socials, instagram: e.target.value}
                })}
             />
          </div>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Youtube className="h-5 w-5 text-red-600" />
             </div>
             <input 
                type="text"
                placeholder="YouTube URL"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.socials?.youtube || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  socials: {...formData.socials, youtube: e.target.value}
                })}
             />
          </div>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Facebook className="h-5 w-5 text-blue-600" />
             </div>
             <input 
                type="text"
                placeholder="Facebook Page URL"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.socials?.facebook || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  socials: {...formData.socials, facebook: e.target.value}
                })}
             />
          </div>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Twitter className="h-5 w-5 text-slate-800 dark:text-slate-200" />
             </div>
             <input 
                type="text"
                placeholder="X (Twitter) Username"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.socials?.twitter || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  socials: {...formData.socials, twitter: e.target.value}
                })}
             />
          </div>
          {/* TikTok - Using SVG as Lucide might not have it in older versions, but here using placeholder logic or simple input */}
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
             </div>
             <input 
                type="text"
                placeholder="TikTok Username"
                className="block w-full pl-10 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                value={formData.socials?.tiktok || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  socials: {...formData.socials, tiktok: e.target.value}
                })}
             />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {successMsg && (
          <span className="text-green-600 dark:text-green-400 font-medium flex items-center animate-in fade-in">
            <CheckCircle size={18} className="mr-2" /> {successMsg}
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  const renderVerificationTab = () => {
    const status = formData.verification?.status || 'unverified';
    const isIdentityLocked = status === 'pending' || status === 'verified';
    const isSocialVerified = formData.verification?.isSocialVerified;

    return (
      <div className="space-y-8 animate-in fade-in">
        
        {/* Status Banner */}
        <div className={`p-6 rounded-2xl border ${
          status === 'verified' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          status === 'pending' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
          status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
           <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${
                 status === 'verified' ? 'bg-green-100 text-green-600' :
                 status === 'pending' ? 'bg-orange-100 text-orange-600' :
                 status === 'rejected' ? 'bg-red-100 text-red-600' :
                 'bg-slate-200 text-slate-500'
              }`}>
                 {status === 'verified' ? <ShieldCheck size={28} /> :
                  status === 'pending' ? <Loader size={28} className="animate-spin" /> :
                  status === 'rejected' ? <AlertTriangle size={28} /> :
                  <Lock size={28} />}
              </div>
              <div className="flex-1">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                    Account Status: {status}
                 </h3>
                 <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {status === 'verified' && "Your identity is verified! You have the Blue Badge and are visible to all clients."}
                    {status === 'pending' && "We are reviewing your details. This usually takes up to 72 hours. You cannot edit details during this time."}
                    {status === 'rejected' && "Your verification was rejected. Please update your details and try again."}
                    {status === 'unverified' && "Your profile is hidden from clients. Verify your identity to get listed."}
                 </p>
                 {status === 'verified' && (
                    <button 
                      onClick={() => setShowVerificationWarning(true)}
                      className="mt-4 text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center"
                    >
                       Edit Legal Details
                    </button>
                 )}
              </div>
           </div>
        </div>

        {/* SECTION 1: Social Media Verification */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mr-auto flex items-center">
                 <Instagram size={20} className="mr-2 text-pink-500"/> Social Media Ownership
              </h3>
              {isSocialVerified && (
                 <span className="flex items-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full font-bold">
                    <CheckCircle size={14} className="mr-1.5" /> Verified
                 </span>
              )}
           </div>

           <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                 <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    To verify ownership, copy the code below and paste it into your Instagram or TikTok bio temporarily.
                 </p>
                 <div className="flex items-center gap-2 mb-4">
                    <code className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-lg font-mono text-center text-lg tracking-widest text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                       {formData.verification?.bioCode || '...'}
                    </code>
                    <button 
                       onClick={() => {
                          navigator.clipboard.writeText(formData.verification?.bioCode || '');
                          setSuccessMsg('Code copied!');
                          setTimeout(() => setSuccessMsg(''), 2000);
                       }}
                       className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                       <Copy size={20} />
                    </button>
                 </div>
                 <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={verifySocials}
                    disabled={isSocialVerified || isSaving}
                 >
                    {isSocialVerified ? 'Ownership Confirmed' : (isSaving ? 'Checking Bio...' : 'Verify Code')}
                 </Button>
              </div>
           </div>
        </div>

        {/* SECTION 2: Legal Identity (M-Pesa Match) */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative ${isIdentityLocked ? 'opacity-70 pointer-events-none' : ''}`}>
           {isIdentityLocked && <div className="absolute inset-0 z-10" />} {/* Block interaction */}
           
           <div className="flex items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mr-auto flex items-center">
                 <ShieldCheck size={20} className="mr-2 text-brand-600"/> Legal Identity
              </h3>
              <div className="flex items-center text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                 <EyeOff size={14} className="mr-1.5" /> Private
              </div>
           </div>

           <div className="grid gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                 <Lock className="flex-shrink-0 mt-0.5" size={16} />
                 <p>
                    We verify your identity by matching your <strong>Legal Name</strong> with your <strong>M-Pesa registered name</strong>. 
                    <br/><span className="font-bold">No ID card upload required.</span> These details remain private.
                 </p>
              </div>

              <div>
                 <Input 
                    label="Legal Full Name"
                    placeholder="As registered on M-Pesa"
                    value={formData.legalName || ''}
                    onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                    disabled={isIdentityLocked}
                 />
                 <p className="text-xs text-slate-500 mt-1">Must strictly match your M-Pesa account name.</p>
              </div>

              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <div className="group relative">
                       <HelpCircle size={14} className="text-slate-400 cursor-help" />
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          You must be 18+ to legally sign contracts.
                       </div>
                    </div>
                 </div>
                 <input 
                    type="date"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    disabled={isIdentityLocked}
                 />
              </div>

              <div>
                 <Input 
                    label="M-Pesa Registered Number"
                    placeholder="07..."
                    value={formData.mpesaNumber || ''}
                    onChange={(e) => setFormData({...formData, mpesaNumber: e.target.value})}
                    disabled={isIdentityLocked}
                 />
                 <p className="text-xs text-slate-500 mt-1">We perform a name query to verify you.</p>
              </div>
           </div>
        </div>

        {/* Disclaimer & Action */}
        {!isIdentityLocked && (
           <div className="space-y-6">
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center px-4">
                 By submitting, you agree to our Terms. Verification usually takes up to 72 hours.
              </div>
              <div className="flex justify-end">
                 <Button onClick={handleVerificationSubmit} disabled={isSaving}>
                    {isSaving ? 'Submitting...' : 'Submit for Verification'}
                 </Button>
              </div>
           </div>
        )}
      </div>
    );
  };

  const renderPaymentsTab = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-800 dark:text-blue-300 text-sm mb-6 border border-blue-100 dark:border-blue-800">
        <p className="font-bold mb-1">Secure Information</p>
        <p>Your payment details are encrypted and only shown to clients after you accept a contract that requires a deposit.</p>
      </div>

      {/* M-PESA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Smartphone size={20} className="mr-2 text-green-600" />
          M-PESA
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
            <select
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
              value={formData.paymentMethods?.mpesa?.type || 'personal'}
              onChange={(e) => setFormData({
                ...formData,
                paymentMethods: {
                  ...formData.paymentMethods,
                  mpesa: { 
                    ...(formData.paymentMethods?.mpesa || { number: '' }), 
                    type: e.target.value as any 
                  }
                }
              })}
            >
              <option value="personal">Send Money (Personal)</option>
              <option value="till">Buy Goods (Till Number)</option>
              <option value="paybill">Paybill</option>
            </select>
          </div>
          <Input 
            label={formData.paymentMethods?.mpesa?.type === 'personal' ? 'Phone Number' : 'Till / Paybill Number'}
            placeholder="e.g. 0712345678"
            value={formData.paymentMethods?.mpesa?.number || ''}
            onChange={(e) => setFormData({
              ...formData,
              paymentMethods: {
                ...formData.paymentMethods,
                mpesa: { 
                  ...(formData.paymentMethods?.mpesa || { type: 'personal' }), 
                  number: e.target.value 
                }
              }
            })}
          />
          {formData.paymentMethods?.mpesa?.type !== 'personal' && (
            <Input 
              label="Business/Account Name"
              placeholder="e.g. Sarah K Creatives"
              value={formData.paymentMethods?.mpesa?.name || ''}
              onChange={(e) => setFormData({
                ...formData,
                paymentMethods: {
                  ...formData.paymentMethods,
                  mpesa: { 
                    ...(formData.paymentMethods?.mpesa || { type: 'till', number: '' }), 
                    name: e.target.value 
                  }
                }
              })}
            />
          )}
        </div>
      </div>

      {/* Bank Transfer */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Building size={20} className="mr-2 text-blue-600" />
          Bank Transfer
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
            <select
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
              value={formData.paymentMethods?.bank?.bankName || ''}
              onChange={(e) => setFormData({
                ...formData,
                paymentMethods: {
                  ...formData.paymentMethods,
                  bank: { 
                    ...(formData.paymentMethods?.bank || { accountNumber: '', accountName: '' }), 
                    bankName: e.target.value 
                  }
                }
              })}
            >
              <option value="">Select a Bank</option>
              {KENYAN_BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <Input 
            label="Account Number"
            placeholder="e.g. 1100220033"
            value={formData.paymentMethods?.bank?.accountNumber || ''}
            onChange={(e) => setFormData({
              ...formData,
              paymentMethods: {
                ...formData.paymentMethods,
                bank: { 
                  ...(formData.paymentMethods?.bank || { bankName: '', accountName: '' }), 
                  accountNumber: e.target.value 
                }
              }
            })}
          />
          <Input 
            label="Account Name"
            placeholder="e.g. Sarah Kamau"
            value={formData.paymentMethods?.bank?.accountName || ''}
            onChange={(e) => setFormData({
              ...formData,
              paymentMethods: {
                ...formData.paymentMethods,
                bank: { 
                  ...(formData.paymentMethods?.bank || { bankName: '', accountNumber: '' }), 
                  accountName: e.target.value 
                }
              }
            })}
          />
        </div>
      </div>

      {/* Crypto */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Bitcoin size={20} className="mr-2 text-orange-500" />
          Crypto
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Network</label>
            <select
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
              value={formData.paymentMethods?.crypto?.network || ''}
              onChange={(e) => setFormData({
                ...formData,
                paymentMethods: {
                  ...formData.paymentMethods,
                  crypto: { 
                    ...(formData.paymentMethods?.crypto || { walletAddress: '' }), 
                    network: e.target.value 
                  }
                }
              })}
            >
              <option value="">Select Network</option>
              <option value="USDT (TRC20)">USDT (TRC20)</option>
              <option value="USDT (ERC20)">USDT (ERC20)</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
            </select>
          </div>
          <Input 
            label="Wallet Address"
            placeholder="0x..."
            value={formData.paymentMethods?.crypto?.walletAddress || ''}
            onChange={(e) => setFormData({
              ...formData,
              paymentMethods: {
                ...formData.paymentMethods,
                crypto: { 
                  ...(formData.paymentMethods?.crypto || { network: '' }), 
                  walletAddress: e.target.value 
                }
              }
            })}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {successMsg && (
          <span className="text-green-600 dark:text-green-400 font-medium flex items-center animate-in fade-in">
            <CheckCircle size={18} className="mr-2" /> {successMsg}
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Theme Preferences</h3>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-900 dark:text-white">
               {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
             </div>
             <div>
               <p className="font-bold text-slate-900 dark:text-white">Dark Mode</p>
               <p className="text-sm text-slate-500 dark:text-slate-400">
                 {theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
               </p>
             </div>
           </div>
           
           <button 
             onClick={toggleTheme}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
               theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'
             }`}
           >
             <span
               className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                 theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
               }`}
             />
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Tabs */}
          <div className="md:w-64 flex-shrink-0 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <User size={18} className="mr-3" /> Profile Info
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'verification' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <ShieldCheck size={18} className="mr-3" /> Verification
              {/* Optional: Add a dot if unverified */}
              {(formData.verification?.status !== 'verified') && (
                 <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'payments' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <CreditCard size={18} className="mr-3" /> Payments
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'appearance' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <Palette size={18} className="mr-3" /> Appearance
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'account' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <Lock size={18} className="mr-3" /> Account & Security
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
             {activeTab === 'profile' && renderProfileTab()}
             {activeTab === 'verification' && renderVerificationTab()}
             {activeTab === 'payments' && renderPaymentsTab()}
             {activeTab === 'appearance' && renderAppearanceTab()}
             {activeTab === 'account' && (
                <div className="space-y-8 animate-in fade-in">
                  
                  {/* Security Section */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center mb-6">
                      <Lock className="w-5 h-5 text-slate-400 mr-2" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Login & Security</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="mb-4 sm:mb-0">
                        <p className="font-bold text-slate-900 dark:text-white">Password</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Last changed 3 months ago</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>Change Password</Button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex items-start">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-4 text-red-600 dark:text-red-400">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Danger Zone</h3>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                           Once you delete your account, there is no going back. Please be certain.
                         </p>
                         <button 
                           onClick={() => setShowDeleteModal(true)}
                           className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                         >
                           Delete Account
                         </button>
                      </div>
                    </div>
                  </div>

                </div>
             )}
          </div>
        </div>
      </div>

      {/* Verification Warning Modal */}
      {showVerificationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-red-200 dark:border-red-800">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Warning: Lose Verification Status?</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                Editing your legal details will immediately <span className="font-bold text-red-500">remove your Verified Badge</span> and hide your profile from clients until your new details are reviewed (72h).
              </p>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowVerificationWarning(false)}>
                  Cancel
                </Button>
                <button 
                  onClick={handleUnlockVerification}
                  className="flex-1 bg-red-600 text-white rounded-full font-bold py-3 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  I Understand, Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete your account?</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                You are about to permanently delete your account and all associated data. This action <span className="font-bold text-slate-900 dark:text-white">cannot be undone</span>.
              </p>
              
              {deleteError && (
                 <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-200 dark:border-red-800">
                   {deleteError}
                 </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white rounded-full font-bold py-3 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  Yes, Delete It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dramatic Death Effect Overlay */}
      {deathEffect && (
        <div className="fixed inset-0 z-[100] bg-red-600 flex items-center justify-center animate-pulse-fast pointer-events-none mix-blend-multiply dark:mix-blend-normal opacity-90">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-widest uppercase drop-shadow-lg scale-110 animate-in zoom-in duration-1000">
            Account Deleted
          </h1>
        </div>
      )}

    </div>
  );
};

export default Settings;