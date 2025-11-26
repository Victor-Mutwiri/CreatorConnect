
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, DollarSign, FileText, AlertCircle, Smartphone, Building, Bitcoin, HelpCircle, Target, ShieldCheck, Flag, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { User, ContractTerms, ContractPaymentType, Milestone } from '../../types';

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
  const [paymentType, setPaymentType] = useState<ContractPaymentType>('MILESTONE');
  const [customSplitCount, setCustomSplitCount] = useState(6); // Default for custom split input
  const [splitBaseAmount, setSplitBaseAmount] = useState(0); // New Input for split logic
  
  const [terms, setTerms] = useState<ContractTerms>({
    paymentType: 'MILESTONE',
    amount: 0,
    currency: 'KES',
    durationDays: 14,
    deliverables: [''],
    schedule: '',
    startDate: '',
    revisionPolicy: '1 Revision',
    milestones: []
  });

  // Milestone Builder State
  // Default to 3 milestones to start safely
  const [milestones, setMilestones] = useState<Partial<Milestone>[]>([
    { title: 'Phase 1: Initial Concept', amount: 0, description: 'Outline and initial draft' },
    { title: 'Phase 2: Development', amount: 0, description: 'Main content creation' },
    { title: 'Phase 3: Final Polish', amount: 0, description: 'Edits and final delivery' }
  ]);

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

  // Recalculate total amount when milestones change in milestone mode
  useEffect(() => {
    if (paymentType === 'MILESTONE') {
      const total = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      setTerms(prev => ({ ...prev, amount: total }));
    }
  }, [milestones, paymentType]);

  const handleCreate = async () => {
    if (!user || !creator || !title || !terms.amount) return;
    
    setIsSubmitting(true);
    try {
      const finalTerms = { ...terms, paymentType };
      
      if (paymentType === 'MILESTONE') {
        finalTerms.milestones = milestones.map((m, idx) => ({
          id: `ms-${Date.now()}-${idx}`,
          title: m.title || `Milestone ${idx + 1}`,
          description: m.description || '',
          amount: m.amount || 0,
          status: 'PENDING'
        })) as Milestone[];
      } else {
        // Clear milestones if fixed
        finalTerms.milestones = [];
      }

      const contract = await mockContractService.createContract(
        user.id,
        user.clientProfile?.businessName || user.name,
        user.avatarUrl,
        creator.id,
        creator.name,
        {
          title,
          description,
          terms: finalTerms,
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

  // --- SMART SPLIT LOGIC ---
  const handleAutoDistribute = (count: number) => {
    const sourceAmount = splitBaseAmount > 0 ? splitBaseAmount : terms.amount;

    if (sourceAmount <= 0) {
        alert("Please enter a Total Project Budget to split.");
        return;
    }

    const total = sourceAmount;
    const maxFirst = Math.floor(total * 0.30);
    let firstAmount = Math.floor(total / count);
    
    // If even split violates 30% rule, cap first amount and distribute remainder
    if (firstAmount > maxFirst) {
      firstAmount = maxFirst;
    }

    const remainder = total - firstAmount;
    // Avoid division by zero if count is 1 (though UI starts at 2)
    const otherAmount = count > 1 ? Math.floor(remainder / (count - 1)) : 0;
    // Adjust last milestone to cover rounding differences
    const lastAmount = remainder - (otherAmount * (count - 2)); 

    const newMilestones: Partial<Milestone>[] = [];
    
    for (let i = 0; i < count; i++) {
      let amount = otherAmount;
      if (i === 0) amount = firstAmount;
      if (i === count - 1 && count > 1) amount = lastAmount;

      newMilestones.push({
        title: `Phase ${i + 1}`,
        description: i === 0 ? 'Initial deliverable / Concept' : 'Work in progress',
        amount: amount
      });
    }

    setMilestones(newMilestones);
  };

  const handlePaymentTypeChange = (type: ContractPaymentType) => {
    setPaymentType(type);
    if (type === 'MILESTONE') {
       // Pre-fill with 3 milestones if converting back
       if (milestones.length === 0) {
          setMilestones([
            { title: 'Phase 1', amount: 0, description: '' },
            { title: 'Phase 2', amount: 0, description: '' },
            { title: 'Phase 3', amount: 0, description: '' }
          ]);
       }
    }
  };

  // --- FRAUD PREVENTION RULES ---
  // Rule: Milestone 1 must not exceed 30% of Total Contract Value
  const firstMilestoneAmount = milestones[0]?.amount || 0;
  const thirtyPercentLimit = terms.amount * 0.30;
  
  const isFirstMilestoneTooHigh = paymentType === 'MILESTONE' && terms.amount > 0 && firstMilestoneAmount > thirtyPercentLimit;

  // Date Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const maxExpiryStr = terms.startDate ? new Date(new Date(terms.startDate).getTime() - 86400000).toISOString().split('T')[0] : undefined;
  const isExpiryInvalid = expiryDate && terms.startDate && expiryDate >= terms.startDate;

  // Validation
  const isValid = 
    title.trim() !== '' &&
    description.trim() !== '' &&
    terms.amount > 0 &&
    terms.durationDays > 0 &&
    terms.startDate !== '' &&
    expiryDate !== '' &&
    expiryDate >= todayStr &&
    !isExpiryInvalid &&
    !isFirstMilestoneTooHigh && // Block if rule violated
    (paymentType === 'FIXED' || (paymentType === 'MILESTONE' && milestones.length > 0 && milestones.every(m => (m.amount || 0) > 0 && m.title)));

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

           {/* Contract Type Selection */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                 <Target size={20} className="mr-2 text-brand-600" /> Contract Type
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                 <button
                   onClick={() => handlePaymentTypeChange('MILESTONE')}
                   className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                     paymentType === 'MILESTONE'
                       ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                       : 'border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800'
                   }`}
                 >
                    <div className="flex items-center gap-3 mb-2">
                       <Flag className={`w-6 h-6 ${paymentType === 'MILESTONE' ? 'text-brand-600' : 'text-slate-400'}`} />
                       <span className="font-bold text-slate-900 dark:text-white">Milestone Contract</span>
                       {paymentType === 'MILESTONE' && <span className="text-xs font-bold bg-brand-200 text-brand-800 px-2 py-0.5 rounded ml-auto">Recommended</span>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Best for most projects. Break the work into phases (Deliver → Verify → Pay). Safe for both parties.
                    </p>
                 </button>

                 <button
                   onClick={() => handlePaymentTypeChange('FIXED')}
                   className={`p-6 rounded-xl border-2 text-left transition-all ${
                     paymentType === 'FIXED'
                       ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                       : 'border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800'
                   }`}
                 >
                    <div className="flex items-center gap-3 mb-2">
                       <DollarSign className={`w-6 h-6 ${paymentType === 'FIXED' ? 'text-brand-600' : 'text-slate-400'}`} />
                       <span className="font-bold text-slate-900 dark:text-white">Fixed Contract</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Best for small, quick jobs with returning creators. Payment released fully at the end. High risk for new relationships.
                    </p>
                 </button>
              </div>
           </div>

           {/* Terms */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
               <DollarSign size={20} className="mr-2 text-brand-600" /> Payment & Schedule
             </h3>

             {paymentType === 'FIXED' ? (
                // FIXED CONTRACT INPUTS
                <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-sm text-slate-500 mb-4 flex items-center">
                      <AlertCircle size={16} className="mr-2" /> 
                      Payment is secure and released only when you mark the contract as complete.
                   </p>
                   <Input 
                      label="Total Contract Amount (KES)"
                      type="number"
                      value={terms.amount || ''}
                      onChange={(e) => setTerms({...terms, amount: Number(e.target.value)})}
                      required
                   />
                </div>
             ) : (
                // MILESTONE CONTRACT INPUTS
                <div className="mb-6 space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Milestones</label>
                      <span className="text-sm font-bold text-brand-600">Total (Calculated): KES {terms.amount.toLocaleString()}</span>
                   </div>

                   {/* Project Budget Input for Split */}
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
                      <Input 
                        label="Total Project Budget (to be split)"
                        type="number"
                        placeholder="Enter total amount, e.g. 20000"
                        value={splitBaseAmount || ''}
                        onChange={(e) => setSplitBaseAmount(Number(e.target.value))}
                      />
                   </div>

                   {/* Quick Split Toolbar */}
                   <div className="flex flex-wrap items-center gap-2 mb-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mr-2">Auto-Split:</span>
                     <button onClick={() => handleAutoDistribute(2)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">
                        2 Phases
                     </button>
                     <button onClick={() => handleAutoDistribute(3)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">
                        3 Phases
                     </button>
                     <button onClick={() => handleAutoDistribute(4)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">
                        4 Phases
                     </button>
                     <button onClick={() => handleAutoDistribute(5)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">
                        5 Phases
                     </button>
                     
                     <div className="flex items-center ml-auto gap-2 pl-2 border-l border-slate-200 dark:border-slate-600">
                        <span className="text-xs text-slate-500">Custom:</span>
                        <input 
                            type="number" 
                            min="2" 
                            max="20" 
                            value={customSplitCount}
                            onChange={(e) => setCustomSplitCount(Number(e.target.value))}
                            className="w-14 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                        />
                        <button onClick={() => handleAutoDistribute(customSplitCount)} className="px-3 py-1 text-xs bg-brand-600 text-white rounded shadow-sm hover:bg-brand-700">
                            Split
                        </button>
                     </div>
                   </div>
                   
                   {milestones.map((ms, idx) => {
                      // Highlight the first milestone if it violates the 30% rule
                      const isViolation = idx === 0 && isFirstMilestoneTooHigh;
                      
                      return (
                        <div key={idx} className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${isViolation ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                           <div className="flex items-center justify-center bg-white dark:bg-slate-900 w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 font-bold text-slate-500 text-sm flex-shrink-0 mt-2">
                             {idx + 1}
                           </div>
                           <div className="flex-1 w-full space-y-3">
                              <div className="flex flex-col md:flex-row gap-4">
                                 <Input 
                                   label="Milestone Title"
                                   placeholder={`Phase ${idx + 1}`}
                                   value={ms.title}
                                   onChange={(e) => {
                                      const newM = [...milestones];
                                      newM[idx].title = e.target.value;
                                      setMilestones(newM);
                                   }}
                                 />
                                 <Input 
                                   label="Amount (KES)"
                                   type="number"
                                   placeholder="0"
                                   value={ms.amount || ''}
                                   onChange={(e) => {
                                      const newM = [...milestones];
                                      newM[idx].amount = Number(e.target.value);
                                      setMilestones(newM);
                                   }}
                                   className={isViolation ? "border-amber-400 focus:ring-amber-500" : ""}
                                 />
                              </div>
                              <Input 
                                 label="Description / Deliverable"
                                 placeholder="What is being delivered in this phase?"
                                 value={ms.description}
                                 onChange={(e) => {
                                    const newM = [...milestones];
                                    newM[idx].description = e.target.value;
                                    setMilestones(newM);
                                 }}
                              />
                              {isViolation && (
                                <p className="text-xs text-amber-600 font-bold">
                                  Amount exceeds 30% limit for the first milestone. Max allowed: KES {thirtyPercentLimit.toLocaleString()}
                                </p>
                              )}
                           </div>
                           <button 
                              onClick={() => {
                                 if (milestones.length > 1) {
                                    setMilestones(milestones.filter((_, i) => i !== idx));
                                 }
                              }}
                              className="text-slate-400 hover:text-red-500 p-2 mt-2"
                              disabled={milestones.length <= 1}
                           >
                              <Trash2 size={20} />
                           </button>
                        </div>
                      );
                   })}
                   
                   <button 
                      onClick={() => setMilestones([...milestones, { title: '', amount: 0, description: '' }])}
                      className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700 mt-2"
                   >
                      <Plus size={16} className="mr-1" /> Add Milestone
                   </button>
                   
                   {/* Rule Explanation / Warning */}
                   <div className={`mt-4 p-4 rounded-lg border ${isFirstMilestoneTooHigh ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start">
                         <ShieldAlert className={`mr-2 mt-0.5 ${isFirstMilestoneTooHigh ? 'text-amber-600' : 'text-blue-600'}`} size={20} />
                         <div>
                            <p className={`text-sm font-bold ${isFirstMilestoneTooHigh ? 'text-amber-800 dark:text-amber-400' : 'text-blue-800 dark:text-blue-400'}`}>
                               Fair Play Protection: 30% Rule
                            </p>
                            <p className={`text-sm mt-1 ${isFirstMilestoneTooHigh ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                               Work on Milestone 1 must not exceed <span className="font-bold">30%</span> of the total contract value.
                               This ensures low-risk initial deliverables (e.g. Intro content, outlines) before larger payments are unlocked.
                            </p>
                            {isFirstMilestoneTooHigh && (
                               <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mt-2">
                                  Current Milestone 1: KES {firstMilestoneAmount.toLocaleString()} ({Math.round((firstMilestoneAmount/terms.amount)*100)}%) <br/>
                                  Limit: KES {thirtyPercentLimit.toLocaleString()} (30%)
                               </p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             )}

             <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                     min={todayStr}
                     max={maxExpiryStr}
                     className="mt-0"
                  />
                  {isExpiryInvalid && (
                     <p className="text-xs text-red-500 mt-1 font-medium">Offer must expire before the contract start date.</p>
                  )}
                </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
                <textarea 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                    rows={3}
                    placeholder="Any specific instructions..."
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

           {!isValid && !isFirstMilestoneTooHigh && (
             <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
               <AlertCircle size={18} className="mr-2" />
               Please fill in all required fields to send.
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
