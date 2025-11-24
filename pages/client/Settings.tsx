
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Lock, Palette, CheckCircle, 
  AlertTriangle, Sun, Moon, Globe, MapPin, Building
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ClientProfile, ClientType } from '../../types';

const ClientSettings: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deathEffect, setDeathEffect] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<ClientProfile>>({});

  useEffect(() => {
    if (user?.clientProfile) {
      setFormData(user.clientProfile);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData) {
        await updateProfile({ clientProfile: formData as ClientProfile });
        setSuccessMsg('Settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    // Trigger Dramatic Effect
    setDeathEffect(true);

    // Wait for effect to play out before actually deleting and redirecting
    setTimeout(async () => {
      await deleteAccount();
      navigate('/');
    }, 2500);
  };

  const renderProfileTab = () => (
    <div className="space-y-8 animate-in fade-in">
      {/* Basic Business Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Business Information</h3>
        
        <div className="mb-6">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Client Type</label>
           <div className="flex gap-3">
             {[ClientType.INDIVIDUAL, ClientType.BUSINESS, ClientType.COMPANY].map(type => (
               <button
                 key={type}
                 onClick={() => setFormData({...formData, clientType: type})}
                 className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                   formData.clientType === type
                     ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400'
                     : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                 }`}
               >
                 {type.charAt(0) + type.slice(1).toLowerCase()}
               </button>
             ))}
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Input 
            label="Business Name" 
            value={formData.businessName || ''}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            placeholder="e.g. Acme Corp"
          />
          <Input 
            label="Industry" 
            value={formData.industry || ''}
            onChange={(e) => setFormData({...formData, industry: e.target.value})}
            placeholder="e.g. Technology"
          />
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 top-7 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
             </div>
             <Input 
                label="Website"
                className="pl-10"
                value={formData.website || ''}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://example.com"
             />
          </div>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 top-7 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
             </div>
             <Input 
                label="Location"
                className="pl-10"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="City, Country"
             />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">About</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all duration-200"
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe your business..."
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Preferences</h3>
        <div>
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Typical Budget Range</label>
           <div className="flex flex-wrap gap-2">
             {['< KES 10k', 'KES 10k - 50k', 'KES 50k - 100k', 'KES 100k+'].map(range => (
               <button
                  key={range}
                  onClick={() => setFormData({...formData, budgetRange: range})}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.budgetRange === range
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                 {range}
               </button>
             ))}
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
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Client Settings</h1>

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
              <Building size={18} className="mr-3" /> Business Info
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
              <Lock size={18} className="mr-3" /> Account
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
             {activeTab === 'profile' && renderProfileTab()}
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

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete your account?</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                You are about to permanently delete your account and all associated data. This action <span className="font-bold text-slate-900 dark:text-white">cannot be undone</span>.
              </p>
              
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

export default ClientSettings;
