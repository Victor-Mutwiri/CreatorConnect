
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, DollarSign, FileText, AlertCircle, Smartphone, Building, Bitcoin, HelpCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { User, ContractTerms } from '../../types';

const CreateContract: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [creator, setCreator] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState(''); // Offer Expiry
  const [terms, setTerms] = useState<ContractTerms>({
    amount: 0,
    currency: 'KES',
    deposit: 0,
    durationDays: 7,
    deliverables: [''],
    schedule: '',
    startDate: '',
    revisionPolicy: '1 Revision'
  });

  useEffect(() => {
    const fetchCreator = async () => {
      if (creatorId) {
        const data = await mockAuth.getCreatorProfile(creatorId);
        setCreator(data);
      }
      setLoading(false);
    };
    fetchCreator();
  }, [creatorId]);

  const handleCreate = async () => {
    if (!user || !creator || !title || !terms.amount) return;
    
    setIsSubmitting(true);
    try {
      const contract = await mockContractService.createContract(
        user.id,
        user.clientProfile?.businessName || user.name,
        user.avatarUrl,
        creator.id,
        creator.name,
        {
          title,
          description,
          terms,
          expiryDate
        }
      );
      // Redirect to the contract details (client view)
      navigate(`/creator/contracts/${contract.id}`); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndDate = () => {
    if (!terms.startDate || !terms.durationDays) return null;
    const start = new Date(terms.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + terms.durationDays);
    return end.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Validation
  const isValid = 
    title.trim() !== '' &&
    description.trim() !== '' &&
    terms.amount > 0 &&
    terms.durationDays > 0 &&
    terms.startDate !== '' &&
    expiryDate !== '';

  if (loading) return <div className="p-20 text-center dark:text-white">Loading...</div>;
  if (!creator) return <div className="p-20 text-center dark:text-white">Creator not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <button 
           onClick={() => navigate(-1)}
           className="flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Contract</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Send a proposal to <span className="font-bold text-slate-900 dark:text-white">{creator.name}</span>
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-8">
           
           {/* Project Basics */}
           <div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
               <FileText size={20} className="mr-2 text-brand-600" /> Project Details
             </h3>
             <div className="space-y-4">
               <Input 
                 label="Contract Title"
                 placeholder="e.g. Summer Campaign Instagram Reels"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 required
               />
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description & Requirements</label>
                  <textarea 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                    rows={4}
                    placeholder="Describe the campaign goals, tone, and specific requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
               </div>
             </div>
           </div>

           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
               <Calendar size={20} className="mr-2 text-brand-600" /> Deliverables
             </h3>
             <div className="space-y-3">
               {terms.deliverables.map((item, idx) => (
                 <div key={idx} className="flex gap-2">
                    <input 
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                      placeholder="e.g. 1 x 60s Reel Video"
                      value={item}
                      onChange={(e) => {
                        const newD = [...terms.deliverables];
                        newD[idx] = e.target.value;
                        setTerms({...terms, deliverables: newD});
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (terms.deliverables.length > 1) {
                           const newD = terms.deliverables.filter((_, i) => i !== idx);
                           setTerms({...terms, deliverables: newD});
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
               ))}
               <button 
                 onClick={() => setTerms({...terms, deliverables: [...terms.deliverables, '']})}
                 className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700"
               >
                 <Plus size={16} className="mr-1" /> Add Deliverable
               </button>
             </div>
           </div>

           {/* Terms */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
               <DollarSign size={20} className="mr-2 text-brand-600" /> Payment & Schedule
             </h3>
             <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Input 
                   label="Total Amount (KES)"
                   type="number"
                   value={terms.amount || ''}
                   onChange={(e) => setTerms({...terms, amount: Number(e.target.value)})}
                   required
                />
                <Input 
                   label="Upfront Deposit (KES)"
                   type="number"
                   value={terms.deposit || 0}
                   onChange={(e) => setTerms({...terms, deposit: Number(e.target.value)})}
                />
                <Input 
                   label="Duration (Days)"
                   type="number"
                   value={terms.durationDays || ''}
                   onChange={(e) => setTerms({...terms, durationDays: Number(e.target.value)})}
                   required
                />
                <Input 
                   label="Start Date"
                   type="date"
                   value={terms.startDate ? terms.startDate.split('T')[0] : ''}
                   onChange={(e) => setTerms({...terms, startDate: new Date(e.target.value).toISOString()})}
                   required
                />
             </div>

             {/* Auto-Calculated Date Info */}
             {terms.startDate && terms.durationDays > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                   <Calendar className="text-blue-600 dark:text-blue-400 mt-1" size={18} />
                   <div>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Project Timeline</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Based on the start date and duration, this project is estimated to end on <span className="font-bold">{calculateEndDate()}</span>.
                      </p>
                   </div>
                </div>
             )}
             
             <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Revision Policy</label>
                   <select 
                     className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                     value={terms.revisionPolicy}
                     onChange={(e) => setTerms({...terms, revisionPolicy: e.target.value})}
                   >
                     <option>No Revisions</option>
                     <option>1 Revision</option>
                     <option>2 Revisions</option>
                     <option>Unlimited Revisions</option>
                   </select>
                </div>
                
                {/* Offer Expiry with Tooltip */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Offer Valid Until</label>
                    <div className="relative group">
                       <HelpCircle size={16} className="text-slate-400 cursor-help" />
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                         This is the deadline for the creator to accept this contract. If they don't accept by this date, the offer will expire.
                         <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                       </div>
                    </div>
                  </div>
                  <Input 
                     label=""
                     type="date"
                     value={expiryDate}
                     onChange={(e) => setExpiryDate(e.target.value)}
                     required
                     className="mt-0"
                  />
                </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule / Milestones Description</label>
                <textarea 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                    rows={3}
                    placeholder="e.g. 50% Deposit on Start, 50% on Final Approval..."
                    value={terms.schedule}
                    onChange={(e) => setTerms({...terms, schedule: e.target.value})}
                />
             </div>

             {/* Accepted Payment Methods Display */}
             {creator.profile?.paymentMethods && (
                <div className="mt-6">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Creator's Accepted Payment Methods</label>
                   <div className="flex flex-wrap gap-3">
                      {creator.profile.paymentMethods.mpesa?.number && (
                         <div className="flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 text-sm font-medium">
                            <Smartphone size={16} className="mr-1.5" /> M-PESA
                         </div>
                      )}
                      {creator.profile.paymentMethods.bank?.accountNumber && (
                         <div className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-medium">
                            <Building size={16} className="mr-1.5" /> Bank Transfer
                         </div>
                      )}
                      {creator.profile.paymentMethods.crypto?.walletAddress && (
                         <div className="flex items-center px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 text-sm font-medium">
                            <Bitcoin size={16} className="mr-1.5" /> Crypto
                         </div>
                      )}
                      {!creator.profile.paymentMethods.mpesa?.number && !creator.profile.paymentMethods.bank?.accountNumber && !creator.profile.paymentMethods.crypto?.walletAddress && (
                         <span className="text-slate-500 text-sm italic">No specific payment methods listed.</span>
                      )}
                   </div>
                </div>
             )}

           </div>

           {!isValid && (
             <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
               <AlertCircle size={18} className="mr-2" />
               Please fill in all required fields (Title, Amount, Duration, Start Date, Offer Expiry) to send.
             </div>
           )}

           <div className="pt-6 flex justify-end gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting || !isValid}>
                {isSubmitting ? 'Sending...' : 'Send Contract Offer'}
              </Button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default CreateContract;
