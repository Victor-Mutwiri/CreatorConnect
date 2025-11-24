import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, PenTool, Lock } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../context/AuthContext';
import { mockAuth } from '../services/mockAuth';

const FraudWarningModal: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not logged in or has already signed, don't show the modal
  if (!user || user.hasSignedLegalAgreement) return null;

  const handleSubmit = async () => {
    // 1. Validate signature matches name (case insensitive)
    if (signature.trim().toLowerCase() !== user.name.trim().toLowerCase()) {
      setError("Signature must strictly match your account name to confirm identity.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await mockAuth.signLegalAgreement(user.id);
      // Update local context
      await updateProfile({ hasSignedLegalAgreement: true });
    } catch (e) {
      setError("Failed to process signature. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-red-200 dark:border-red-900/50 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-full">
             <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Mandatory Fraud Warning</h2>
            <p className="text-red-100 mt-1 text-sm">Action Required: Read and Sign below to proceed.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300">
           
           <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-600 p-4 rounded-r-lg">
             <p className="font-bold text-red-800 dark:text-red-400 mb-2">ZERO TOLERANCE POLICY</p>
             <p className="text-sm">
               Ubuni Connect maintains a strict zero-tolerance policy regarding impersonation, identity theft, and fraudulent activities.
             </p>
           </div>

           <div className="space-y-4 text-sm leading-relaxed">
             <p>
               <strong>1. Data Monitoring & Reporting:</strong> You acknowledge that all activity on this platform is monitored and logged. We store device fingerprints, IP addresses, and transaction history securely.
             </p>
             <p>
               <strong>2. Law Enforcement Cooperation:</strong> In the event of confirmed or suspected fraud (including but not limited to obtaining money by false pretenses), we will immediately forward all user data to the <strong>Directorate of Criminal Investigations (DCI)</strong> and other relevant law enforcement agencies in Kenya for prosecution.
             </p>
             <p>
               <strong>3. Legal Liability:</strong> Fraudulent actions are punishable under the <strong>Computer Misuse and Cybercrimes Act, 2018</strong> and the <strong>Penal Code (Cap. 63)</strong>. Offenders risk imprisonment, heavy fines, or both.
             </p>
             <p>
               <strong>4. Account Bans:</strong> Accounts flagged for investigation will be suspended indefinitely and cannot be deleted while an investigation is pending. Users found violating these terms will be permanently banned.
             </p>
           </div>

           <hr className="border-slate-200 dark:border-slate-800" />

           <div>
             <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
               Digital Signature
             </label>
             <p className="text-xs text-slate-500 mb-3">
               To proceed, type your full name <strong>"{user.name}"</strong> below to confirm you have read, understood, and agree to abide by these laws and policies.
             </p>
             
             <div className="flex items-center gap-3">
               <div className="relative flex-1">
                 <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text"
                   value={signature}
                   onChange={(e) => setSignature(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                   placeholder="Type your full name here"
                   autoComplete="off"
                 />
               </div>
               <Button 
                 onClick={handleSubmit} 
                 disabled={isSubmitting || !signature}
                 className="bg-red-600 hover:bg-red-700 text-white"
               >
                 {isSubmitting ? 'Signing...' : 'I Agree & Submit'}
               </Button>
             </div>
             {error && (
               <p className="text-red-600 text-sm mt-2 flex items-center">
                 <AlertTriangle size={14} className="mr-1" /> {error}
               </p>
             )}
           </div>

           <div className="flex items-center justify-center text-xs text-slate-400 mt-4">
             <Lock size={12} className="mr-1" /> This signature is legally binding and recorded.
           </div>
        </div>
      </div>
    </div>
  );
};

export default FraudWarningModal;