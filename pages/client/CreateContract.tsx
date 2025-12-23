
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, DollarSign, FileText, AlertCircle, Smartphone, Building, Bitcoin, HelpCircle, Target, ShieldCheck, Flag, ShieldAlert, Zap, Info } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { User, ContractTerms, ContractPaymentType, Milestone, ContractPaymentMethod } from '../../types';

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
  const [paymentMethod, setPaymentMethod] = useState<ContractPaymentMethod>('ESCROW');
  const [customSplitCount, setCustomSplitCount] = useState(6); // Default for custom split input
  const [splitBaseAmount, setSplitBaseAmount] = useState(0); // New Input for split logic
  
  const [terms, setTerms] = useState<ContractTerms>({
    paymentType: 'MILESTONE',
    paymentMethod: 'ESCROW',
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
  // Default to 3 milestones to start safely, descriptions empty to show placeholder
  const [milestones, setMilestones] = useState<Partial<Milestone>[]>([
    { title: 'Phase 1: Initial Concept', amount: 0, description: '' },
    { title: 'Phase 2: Development', amount: 0, description: '' },
    { title: 'Phase 3: Final Polish', amount: 0, description: '' }
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
      setTerms(prev => ({ ...prev, amount: total, paymentMethod }));
    } else {
      setTerms(prev => ({ ...prev, paymentMethod }));
    }
  }, [milestones, paymentType, paymentMethod]);

  const handleCreate = async () => {
    if (!user || !creator || !title || !terms.amount) return;
    
    setIsSubmitting(true);
    try {
      const finalTerms = { ...terms, paymentType, paymentMethod };
      
      if (paymentType === 'MILESTONE') {
        finalTerms.milestones = milestones.map((m, idx) => ({
          id: `ms-${Date.now()}-${idx}`,
          title: m.title || `Milestone ${idx + 1}`,
          description: m.description || '',
          amount: m.amount || 0,
          status: 'PENDING'
        })) as Milestone[];
      } else {
        // FIXED CONTRACT LOGIC UPDATE:
        // We create a single "Hidden" milestone to enable the submission/payment flow.
        finalTerms.milestones = [{
          id: `ms-${Date.now()}-fixed`,
          title: 'Complete Project Delivery',
          description: 'Final delivery of all agreed items.',
          amount: terms.amount,
          status: 'PENDING'
        }];
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
        description: '', // Empty description to show placeholder
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

  // Escrow Kenya Fee Calculation (3% on top)
  const escrowFee = paymentMethod === 'ESCROW' ? Math.round(terms.amount * 0.03) : 0;
  const totalWithEscrow = terms.amount + escrowFee;

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

  // Block creation if creator is restricted
  if (creator.status === 'suspended' || creator.status === 'banned') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center min-h-[60vh]">
           <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
              <ShieldAlert size={40} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Creator Unavailable</h1>
           <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
             We cannot proceed with this contract because the creator's account has been restricted ({creator.status}) due to a policy violation.
           </p>
           <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

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
                 <Target size={20} className="mr-2 text-brand-600" /> Contract Structure
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
                       <span className="font-bold text-slate-900 dark:text-white">Milestones</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Break work into phases. Recommended for larger campaigns to manage risk.
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
                       <span className="font-bold text-slate-900 dark:text-white">Fixed Price</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Single delivery and payment. Best for quick turnaround items.
                    </p>
                 </button>
              </div>
           </div>

           {/* NEW: Payment Method Selection (Escrow vs Direct) */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="flex items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mr-auto flex items-center">
                    <ShieldCheck size={20} className="mr-2 text-brand-600" /> Payment Security
                 </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                 <button
                   onClick={() => setPaymentMethod('ESCROW')}
                   className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                     paymentMethod === 'ESCROW'
                       ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                       : 'border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800'
                   }`}
                 >
                    <div className="flex items-center gap-3 mb-2">
                       <ShieldCheck className={`w-6 h-6 ${paymentMethod === 'ESCROW' ? 'text-brand-600' : 'text-slate-400'}`} />
                       <span className="font-bold text-slate-900 dark:text-white">Escrow Kenya</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Funds held by 3rd party. Released only when you approve work. Highly Secure.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-100 dark:bg-brand-900/40 px-2 py-1 rounded w-fit group cursor-help">
                       <Zap size={12} /> Transformative Security
                       <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                         Escrow Kenya keeps your funds safe. Funds are only released when you approve the work. No risk of paying for unfinished jobs.
                         <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900"></div>
                       </div>
                    </div>
                 </button>

                 <button
                   onClick={() => setPaymentMethod('DIRECT')}
                   className={`p-6 rounded-xl border-2 text-left transition-all ${
                     paymentMethod === 'DIRECT'
                       ? 'border-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-white ring-1 ring-slate-900 dark:ring-white'
                       : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                   }`}
                 >
                    <div className="flex items-center gap-3 mb-2">
                       <Smartphone className={`w-6 h-6 ${paymentMethod === 'DIRECT' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} />
                       <span className="font-bold text-slate-900 dark:text-white">Direct Transfer</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Manual M-Pesa or Bank transfer. No middleman. Standard trust applies.
                    </p>
                 </button>
              </div>
              
              {paymentMethod === 'ESCROW' && (
                 <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-full text-brand-600 h-fit">
                       <Info size={18} />
                    </div>
                    <div className="text-sm">
                       <p className="font-bold text-brand-900 dark:text-brand-300">Escrow Kenya Fee Notice</p>
                       <p className="text-brand-700 dark:text-brand-400 mt-0.5">
                          Escrow Kenya charges a <span className="font-bold">3% processing fee</span>. This is added to your budget to ensure the creator receives their full amount.
                       </p>
                    </div>
                 </div>
              )}
           </div>

           {/* Budget & Payments */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
               <DollarSign size={20} className="mr-2 text-brand-600" /> Budget Breakdown
             </h3>

             {paymentType === 'FIXED' ? (
                // FIXED CONTRACT INPUTS
                <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   <Input 
                      label="Base Project Amount (KES)"
                      type="number"
                      placeholder="e.g. 5000"
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
                      <span className="text-sm font-bold text-brand-600">Base Total: KES {terms.amount.toLocaleString()}</span>
                   </div>

                   <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
                      <Input 
                        label="Calculate Split from Total Budget (KES)"
                        type="number"
                        placeholder="e.g. 20000"
                        value={splitBaseAmount || ''}
                        onChange={(e) => setSplitBaseAmount(Number(e.target.value))}
                      />
                   </div>

                   <div className="flex flex-wrap items-center gap-2 mb-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mr-2">Auto-Split:</span>
                     <button onClick={() => handleAutoDistribute(2)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">2 Phases</button>
                     <button onClick={() => handleAutoDistribute(3)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">3 Phases</button>
                     <button onClick={() => handleAutoDistribute(4)} className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm hover:border-brand-500 text-slate-700 dark:text-slate-200">4 Phases</button>
                     
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
                        <button onClick={() => handleAutoDistribute(customSplitCount)} className="px-3 py-1 text-xs bg-brand-600 text-white rounded shadow-sm hover:bg-brand-700">Split</button>
                     </div>
                   </div>
                   
                   {milestones.map((ms, idx) => {
                      const isViolation = idx === 0 && isFirstMilestoneTooHigh;
                      return (
                        <div key={idx} className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${isViolation ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                           <div className="flex items-center justify-center bg-white dark:bg-slate-900 w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 font-bold text-slate-500 text-sm flex-shrink-0 mt-2">{idx + 1}</div>
                           <div className="flex-1 w-full space-y-3">
                              <div className="flex flex-col md:flex-row gap-4">
                                 <Input label="Milestone Title" value={ms.title} onChange={(e) => { const newM = [...milestones]; newM[idx].title = e.target.value; setMilestones(newM); }} />
                                 <Input label="Amount (KES)" type="number" value={ms.amount || ''} onChange={(e) => { const newM = [...milestones]; newM[idx].amount = Number(e.target.value); setMilestones(newM); }} />
                              </div>
                              <Input label="Description / Deliverable" placeholder="Placeholder..." value={ms.description} onChange={(e) => { const newM = [...milestones]; newM[idx].description = e.target.value; setMilestones(newM); }} />
                              {isViolation && <p className="text-xs text-amber-600 font-bold">Exceeds 30% limit for Milestone 1.</p>}
                           </div>
                           <button onClick={() => { if (milestones.length > 1) setMilestones(milestones.filter((_, i) => i !== idx)); }} className="text-slate-400 hover:text-red-500 p-2 mt-2" disabled={milestones.length <= 1}><Trash2 size={20} /></button>
                        </div>
                      );
                   })}
                   <button onClick={() => setMilestones([...milestones, { title: '', amount: 0, description: '' }])} className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700 mt-2"><Plus size={16} className="mr-1" /> Add Milestone</button>
                </div>
             )}

             {/* Final Totals Widget */}
             <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white mt-8 shadow-xl shadow-slate-900/20">
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-slate-400">
                      <span>Base Contract Amount</span>
                      <span className="font-mono font-bold text-white">KES {terms.amount.toLocaleString()}</span>
                   </div>
                   {paymentMethod === 'ESCROW' && (
                      <div className="flex justify-between items-center text-brand-400 font-medium">
                         <div className="flex items-center gap-1.5">
                            <span>Escrow Kenya Fee (3%)</span>
                            <Info size={14} className="opacity-50" />
                         </div>
                         <span className="font-mono font-bold">+ KES {escrowFee.toLocaleString()}</span>
                      </div>
                   )}
                   <div className="h-px bg-slate-700 my-4"></div>
                   <div className="flex justify-between items-center">
                      <div className="space-y-1">
                         <span className="text-lg font-bold">Total Funding Required</span>
                         {paymentMethod === 'ESCROW' && <p className="text-xs text-slate-400">Safe payments via Escrow Kenya</p>}
                      </div>
                      <span className="text-2xl font-black text-brand-500 font-mono">KES {totalWithEscrow.toLocaleString()}</span>
                   </div>
                </div>
             </div>
           </div>

           {/* Schedule Inputs */}
           <div className="border-t border-slate-100 dark:border-slate-800 pt-6 grid md:grid-cols-2 gap-6">
                <Input label="Duration (Days)" type="number" value={terms.durationDays || ''} onChange={(e) => setTerms({...terms, durationDays: Number(e.target.value)})} required />
                <Input label="Project Start Date" type="date" value={terms.startDate ? terms.startDate.split('T')[0] : ''} onChange={(e) => setTerms({...terms, startDate: new Date(e.target.value).toISOString()})} required />
           </div>

           {/* Final Actions */}
           <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Revision Policy</label>
                   <select className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white" value={terms.revisionPolicy} onChange={(e) => setTerms({...terms, revisionPolicy: e.target.value})}>
                     <option>No Revisions</option>
                     <option>1 Revision</option>
                     <option>2 Revisions</option>
                     <option>Unlimited Revisions</option>
                   </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Offer Valid Until</label>
                  <Input label="" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required min={todayStr} max={maxExpiryStr} />
                </div>
           </div>

           <div className="pt-6 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
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
