
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Clock, FileText, Send, 
  CheckCircle, XCircle, RefreshCw, MessageCircle, Paperclip, Shield, Info, AlertTriangle, Star,
  Smartphone, Building, Bitcoin, Lock, Flag, Loader
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { Contract, ContractStatus, Message, ContractTerms, User, MilestoneStatus } from '../../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // To display creator payment info to client
  const [creatorUser, setCreatorUser] = useState<User | null>(null);

  // Modals
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showEndContractModal, setShowEndContractModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRejectEndModal, setShowRejectEndModal] = useState(false);
  
  // End Contract State
  const [endReason, setEndReason] = useState('');
  const [endType, setEndType] = useState<'completion' | 'termination'>('completion');
  const [rejectionReason, setRejectionReason] = useState('');

  // Rating State
  const [rating, setRating] = useState(0);
  const [paymentRating, setPaymentRating] = useState(0); // For payment reliability
  const [reviewComment, setReviewComment] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Counter offer state
  const [counterTerms, setCounterTerms] = useState<ContractTerms>({
    paymentType: 'FIXED',
    amount: 0,
    currency: 'KES',
    durationDays: 0,
    deliverables: [],
    schedule: '',
    startDate: '',
    milestones: []
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (id && user) {
        const [c, m] = await Promise.all([
          mockContractService.getContractById(id),
          mockContractService.getMessages(id)
        ]);
        setContract(c);
        setMessages(m);
        if(c) {
          setCounterTerms(c.terms);
          // Fetch creator details for payment info
          const cUser = await mockAuth.getCreatorProfile(c.creatorId);
          setCreatorUser(cUser);
        }
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    try {
      const msg = await mockContractService.sendMessage(id, user.id, user.name, newMessage);
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const handleStatusChange = async (status: ContractStatus) => {
    if (!contract || !user) return;
    try {
      const updated = await mockContractService.updateContractStatus(
        contract.id, status, user.id, user.name
      );
      setContract(updated);
      
      const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', 
        `Contract was ${status.toLowerCase()} by ${user.name}`
      );
      setMessages([...messages, sysMsg]);

    } catch (e) {
      console.error(e);
    }
  };

  const handleCounterOffer = async () => {
    if (!contract || !user) return;
    try {
      const updated = await mockContractService.counterOffer(
        contract.id, counterTerms, user.id, user.name
      );
      setContract(updated);
      setShowCounterModal(false);
       const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', 
        `A counter-offer was proposed by ${user.name}`
      );
      setMessages([...messages, sysMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, status: MilestoneStatus) => {
    if (!contract || !user) return;
    try {
      const updated = await mockContractService.updateMilestoneStatus(
        contract.id, milestoneId, status, user.id, user.name
      );
      setContract(updated);
    } catch (e) {
      console.error(e);
    }
  }

  const handleRequestEndContract = async () => {
    if (!contract || !user || !endReason) return;
    try {
      const updated = await mockContractService.requestEndContract(
        contract.id, user.id, user.name, endReason, endType
      );
      setContract(updated);
      setShowEndContractModal(false);
      
      const actionText = endType === 'completion' ? 'completion' : 'termination';
      const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', 
        `End of contract (${actionText}) requested by ${user.name}. Reason: ${endReason}`
      );
      setMessages([...messages, sysMsg]);

    } catch(e) {
      console.error(e);
    }
  };

  const handleResolveEndRequest = async (approved: boolean) => {
     if (!contract || !user) return;
     
     if (!approved && !rejectionReason && !showRejectEndModal) {
       setShowRejectEndModal(true);
       return;
     }

     try {
       const updated = await mockContractService.resolveEndContract(
         contract.id, approved, user.id, user.name, rejectionReason
       );
       setContract(updated);
       setShowRejectEndModal(false);
       setRejectionReason('');
       
       const text = approved 
         ? "End request APPROVED." 
         : `End request REJECTED. Reason: ${rejectionReason}`;
       
       const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', text
      );
      setMessages([...messages, sysMsg]);

     } catch(e) {
       console.error(e);
     }
  };

  const handleSubmitRating = async () => {
    if (!contract || !user || rating === 0) return;
    
    // Validate payment rating if reviewer is Creator
    const isCreatorReviewing = user.id === contract.creatorId;
    if (isCreatorReviewing && paymentRating === 0) {
      // In a real app we'd show an error, here we'll just not submit
      return; 
    }

    try {
      const updated = await mockContractService.leaveReview(
        contract.id, 
        user.id, 
        rating, 
        isCreatorReviewing ? paymentRating : undefined, 
        reviewComment
      );
      setContract(updated);
      setShowRatingModal(false);
    } catch(e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-20 text-center dark:text-white">Loading...</div>;
  if (!contract) return <div className="p-20 text-center dark:text-white">Contract not found</div>;

  const isPending = [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(contract.status);
  const isActive = [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(contract.status);
  const isCompleted = contract.status === ContractStatus.COMPLETED;
  
  const lastHistoryItem = contract.history[contract.history.length - 1];
  const isCreator = user?.id === contract.creatorId;
  const isClientViewer = user?.id === contract.clientId;

  // Proposal/Negotiation Logic
  let canTakeAction = false;
  let statusMessage = "";

  if (contract.status === ContractStatus.SENT) {
    if (isCreator) {
      canTakeAction = true;
    } else {
      statusMessage = "Waiting for creator to respond";
    }
  } else if (contract.status === ContractStatus.NEGOTIATING) {
    if (lastHistoryItem?.actionBy && lastHistoryItem.actionBy !== user?.id) {
       canTakeAction = true;
       statusMessage = "Counter-offer received. Your turn to respond.";
    } else if (lastHistoryItem?.actionBy === user?.id) {
       statusMessage = "Waiting for response to your counter-offer";
    } else {
      canTakeAction = true; 
    }
  }

  const pendingEndRequest = contract.endRequest?.status === 'pending';
  const iRequestedEnd = contract.endRequest?.requesterId === user?.id;
  const isRejectedEndRequest = contract.endRequest?.status === 'rejected';
  const hasReviewed = isCreator ? contract.isCreatorReviewed : contract.isClientReviewed;

  // Show Payment Info only if Client Viewer, Contract is Accepted/Active, and Creator has payment methods
  const showPaymentInfo = isClientViewer && isActive && creatorUser?.profile?.paymentMethods;

  // Helper for rendering comparison values
  const renderDiffValue = (
    current: number,
    previous: number | undefined,
    label: string,
    icon: React.ReactNode,
    prefix: string = '',
    suffix: string = ''
  ) => {
    // Show diff if status is negotiating and value has changed
    const hasChange = contract.status === ContractStatus.NEGOTIATING && previous !== undefined && current !== previous;

    return (
      <div className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl relative overflow-hidden transition-all ${hasChange ? 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/50' : ''}`}>
        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center">{icon} {label}</div>
        
        {hasChange && (
          <div className="text-sm text-slate-400 line-through mb-1 font-medium">
            {prefix} {previous.toLocaleString()} {suffix}
          </div>
        )}
        
        <div className={`text-xl font-bold ${hasChange ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
          {prefix} {current.toLocaleString()} {suffix}
        </div>
        
        {hasChange && (
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            EDITED
          </div>
        )}
      </div>
    );
  };

  // Milestone Renderer
  const renderMilestones = () => {
     if (!contract.terms.milestones || contract.terms.milestones.length === 0) return null;
     
     return (
       <div className="space-y-4 mt-6">
         <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
            <Flag size={20} className="mr-2 text-brand-600" /> 
            Milestones
         </h3>
         <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pl-8 py-2">
            {contract.terms.milestones.map((ms, idx) => {
               const isLocked = ms.status === 'PENDING';
               const isPaid = ms.status === 'PAID';
               const isInProgress = ms.status === 'IN_PROGRESS';
               const isReview = ms.status === 'UNDER_REVIEW';
               
               return (
                  <div key={ms.id} className={`relative p-5 rounded-xl border ${isInProgress || isReview ? 'bg-white dark:bg-slate-900 border-brand-200 dark:border-brand-900 shadow-md ring-1 ring-brand-500/30' : isPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70'}`}>
                     {/* Timeline Node */}
                     <div className={`absolute -left-[41px] top-6 w-6 h-6 rounded-full border-4 flex items-center justify-center ${
                       isPaid ? 'bg-green-500 border-green-100 dark:border-green-900' : 
                       isInProgress || isReview ? 'bg-brand-500 border-brand-100 dark:border-brand-900' : 
                       'bg-slate-300 border-slate-100 dark:bg-slate-700 dark:border-slate-800'
                     }`}>
                        {isPaid && <CheckCircle size={12} className="text-white" />}
                        {isLocked && <Lock size={10} className="text-slate-500" />}
                        {(isInProgress || isReview) && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                     </div>

                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-lg">{ms.title}</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400">{ms.description}</p>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-slate-900 dark:text-white">{contract.terms.currency} {ms.amount.toLocaleString()}</div>
                           <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              isPaid ? 'bg-green-100 text-green-700' :
                              isReview ? 'bg-orange-100 text-orange-700' :
                              isInProgress ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                           }`}>
                              {ms.status.replace('_', ' ')}
                           </span>
                        </div>
                     </div>

                     {/* Actions */}
                     {isActive && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                           {isCreator && isInProgress && (
                              <Button size="sm" onClick={() => handleUpdateMilestone(ms.id, 'UNDER_REVIEW')}>
                                 Submit Work
                              </Button>
                           )}
                           {isClientViewer && isReview && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => {}}>Request Revision</Button>
                                <Button size="sm" onClick={() => handleUpdateMilestone(ms.id, 'PAID')}>
                                   Approve & Release Payment
                                </Button>
                              </div>
                           )}
                           {isLocked && <span className="text-xs text-slate-400 italic flex items-center"><Lock size={12} className="mr-1"/> Locked until previous milestone is paid</span>}
                           {isCreator && isReview && <span className="text-xs text-orange-600 flex items-center"><Clock size={12} className="mr-1"/> Waiting for client approval</span>}
                           {isClientViewer && isInProgress && <span className="text-xs text-brand-600 flex items-center"><Loader size={12} className="mr-1 animate-spin"/> Creator is working on this</span>}
                        </div>
                     )}
                  </div>
               )
            })}
         </div>
       </div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left: Contract Details & Actions */}
        <div className="flex-1 space-y-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white mb-2">
            <ArrowLeft size={18} className="mr-1" /> Back to Contracts
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{contract.title}</h1>
                
                {/* Dynamic Link based on Viewer Role */}
                {isClientViewer ? (
                   <p className="text-slate-500 dark:text-slate-400">
                     Creator: <Link to={`/profile/${contract.creatorId}`} className="font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{contract.creatorName}</Link>
                   </p>
                ) : (
                   <p className="text-slate-500 dark:text-slate-400">
                     Client: <Link to={`/client/profile/${contract.clientId}`} className="font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{contract.clientName}</Link>
                   </p>
                )}

              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase mb-2 ${
                  contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.ACCEPTED ? 'bg-green-100 text-green-700' : 
                  contract.status === ContractStatus.SENT ? 'bg-blue-100 text-blue-700' :
                  contract.status === ContractStatus.NEGOTIATING ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' :
                  contract.status === ContractStatus.COMPLETED ? 'bg-slate-100 text-slate-700' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {contract.status.replace('_', ' ')}
                </span>
                {contract.terms.paymentType && (
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{contract.terms.paymentType} Contract</div>
                )}
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{contract.description}</p>
            
            {contract.status === ContractStatus.NEGOTIATING && (
               <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start">
                 <Info className="text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
                 <div className="text-sm text-yellow-800 dark:text-yellow-300">
                   <span className="font-bold">Negotiation in progress:</span> Changes to the contract terms are highlighted below. Review the stricken-through values to see what has changed.
                 </div>
               </div>
            )}
          </div>

          {/* Payment Information (Visible to Client ONLY when Active/Accepted) */}
          {showPaymentInfo && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl shadow-sm border border-brand-200 dark:border-brand-800 p-6">
              <div className="flex items-center mb-4">
                 <Lock className="text-brand-600 dark:text-brand-400 mr-2" size={20} />
                 <h3 className="font-bold text-lg text-brand-900 dark:text-brand-300">Creator Payment Details</h3>
              </div>
              <p className="text-sm text-brand-700 dark:text-brand-400 mb-6">
                 {contract.terms.paymentType === 'MILESTONE' 
                   ? "Payments are released per milestone. Please use one of these methods when a milestone is approved."
                   : "Payment is due upon completion of the project."
                 }
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                 {/* M-PESA */}
                 {creatorUser?.profile?.paymentMethods?.mpesa && creatorUser.profile.paymentMethods.mpesa.number && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                       <div className="flex items-center mb-2 font-bold text-slate-900 dark:text-white">
                          <Smartphone size={18} className="text-green-600 mr-2" /> M-PESA
                       </div>
                       <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                          <p><span className="font-medium text-slate-500">Type:</span> {creatorUser.profile.paymentMethods.mpesa.type.toUpperCase()}</p>
                          <p><span className="font-medium text-slate-500">Number:</span> <span className="font-mono font-bold">{creatorUser.profile.paymentMethods.mpesa.number}</span></p>
                          {creatorUser.profile.paymentMethods.mpesa.name && (
                             <p><span className="font-medium text-slate-500">Name:</span> {creatorUser.profile.paymentMethods.mpesa.name}</p>
                          )}
                       </div>
                    </div>
                 )}

                 {/* BANK */}
                 {creatorUser?.profile?.paymentMethods?.bank && creatorUser.profile.paymentMethods.bank.accountNumber && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                       <div className="flex items-center mb-2 font-bold text-slate-900 dark:text-white">
                          <Building size={18} className="text-blue-600 mr-2" /> Bank Transfer
                       </div>
                       <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                          <p><span className="font-medium text-slate-500">Bank:</span> {creatorUser.profile.paymentMethods.bank.bankName}</p>
                          <p><span className="font-medium text-slate-500">Acc No:</span> <span className="font-mono font-bold">{creatorUser.profile.paymentMethods.bank.accountNumber}</span></p>
                          <p><span className="font-medium text-slate-500">Name:</span> {creatorUser.profile.paymentMethods.bank.accountName}</p>
                       </div>
                    </div>
                 )}

                 {/* CRYPTO */}
                 {creatorUser?.profile?.paymentMethods?.crypto && creatorUser.profile.paymentMethods.crypto.walletAddress && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 md:col-span-2">
                       <div className="flex items-center mb-2 font-bold text-slate-900 dark:text-white">
                          <Bitcoin size={18} className="text-orange-500 mr-2" /> Crypto
                       </div>
                       <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                          <p><span className="font-medium text-slate-500">Network:</span> {creatorUser.profile.paymentMethods.crypto.network}</p>
                          <p><span className="font-medium text-slate-500">Address:</span></p>
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono break-all select-all">
                             {creatorUser.profile.paymentMethods.crypto.walletAddress}
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center">
              <FileText size={20} className="mr-2 text-brand-600" /> 
              Contract Terms
            </h3>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              
              {/* Amount Diff */}
              {renderDiffValue(
                 contract.terms.amount, 
                 contract.previousTerms?.amount, 
                 "Total Amount", 
                 <DollarSign size={14} className="mr-1"/>,
                 contract.terms.currency
              )}

              {/* Duration Diff */}
              {renderDiffValue(
                 contract.terms.durationDays,
                 contract.previousTerms?.durationDays,
                 "Duration",
                 <Calendar size={14} className="mr-1"/>,
                 "",
                 "Days"
              )}
              
              {/* Added Offer Expiry Display */}
              {contract.expiryDate && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center"><Clock size={14} className="mr-1 text-orange-500"/> Offer Expires</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{new Date(contract.expiryDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>

            {contract.terms.paymentType === 'MILESTONE' && renderMilestones()}

            {contract.terms.paymentType === 'FIXED' && isActive && (
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-6 flex items-start gap-3">
                 <Shield className="text-blue-600 mt-1" size={20} />
                 <div>
                   <h4 className="font-bold text-blue-900 dark:text-blue-300">End-of-Project Payment</h4>
                   <p className="text-sm text-blue-700 dark:text-blue-400">This is a fixed contract. Payment is released in full only upon successful completion of all work.</p>
                 </div>
               </div>
            )}

            <div className="space-y-4 mt-6">
               {contract.terms.revisionPolicy && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Revision Policy</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{contract.terms.revisionPolicy}</p>
                  </div>
               )}

               <div>
                 <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Schedule & Milestones</h4>
                 <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">
                   {contract.terms.schedule}
                 </p>
               </div>
            </div>
          </div>

          {/* --- ACTION BARS --- */}

          {/* 1. Proposal Actions (Accept/Decline/Counter) */}
          {isPending && canTakeAction && (
            <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-4 ring-2 ring-brand-500/10">
               <div>
                 <p className="font-bold text-slate-900 dark:text-white">Action Required</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Please respond to this proposal.</p>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setShowCounterModal(true)}
                   className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center"
                 >
                   <RefreshCw size={16} className="mr-2" />
                   Counter Offer
                 </button>
                 <button 
                   onClick={() => handleStatusChange(ContractStatus.DECLINED)}
                   className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center"
                 >
                   <XCircle size={16} className="mr-2" />
                   Decline
                 </button>
                 <Button onClick={() => handleStatusChange(ContractStatus.ACCEPTED)} className="flex items-center">
                   <CheckCircle size={16} className="mr-2" />
                   Accept Contract
                 </Button>
               </div>
            </div>
          )}

          {/* 2. Active Contract Actions (End Contract) */}
          {isActive && !pendingEndRequest && (
            <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Active Contract</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Project is currently in progress.</p>
              </div>
              <button 
                onClick={() => setShowEndContractModal(true)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                End Contract
              </button>
            </div>
          )}

          {/* 3. Completed Contract Actions (Review) */}
          {isCompleted && !hasReviewed && (
             <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-4 ring-2 ring-yellow-500/10">
               <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center">
                    <CheckCircle className="mr-2 text-green-500" size={18} />
                    Contract Completed
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Please rate your experience with {isCreator ? contract.clientName : contract.creatorName}.</p>
               </div>
               <Button onClick={() => setShowRatingModal(true)} className="flex items-center">
                 <Star size={16} className="mr-2" />
                 Rate Experience
               </Button>
             </div>
          )}

          {/* 3. Waiting Banner (Proposal) */}
          {isPending && !canTakeAction && (
             <div className="sticky bottom-4 z-10 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center animate-in slide-in-from-bottom-4">
                 <Info className="text-slate-400 mr-2" size={20} />
                 <span className="text-slate-600 dark:text-slate-300 font-medium">{statusMessage || "Waiting for other party to respond."}</span>
             </div>
          )}

          {/* 4. End Request Banner (Approval or Waiting) */}
          {pendingEndRequest && (
            <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 ring-2 ring-orange-500/20">
               {iRequestedEnd ? (
                 <div className="flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Clock className="mr-2 text-orange-500" size={20} />
                    <span>You have requested to end this contract. Waiting for approval.</span>
                 </div>
               ) : (
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                       <p className="font-bold text-slate-900 dark:text-white flex items-center">
                         <AlertTriangle className="mr-2 text-orange-500" size={20} />
                         Request to End Contract
                       </p>
                       <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                         <span className="font-medium">{contract.endRequest?.requesterName}</span> wants to mark this as 
                         <span className="font-bold uppercase ml-1">{contract.endRequest?.type}</span>.
                       </p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Reason: "{contract.endRequest?.reason}"</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setShowRejectEndModal(true)}
                         className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                       >
                         Reject
                       </button>
                       <Button onClick={() => handleResolveEndRequest(true)}>
                         Approve & Close
                       </Button>
                    </div>
                 </div>
               )}
            </div>
          )}
          
          {/* 5. End Request Rejected Banner */}
          {isRejectedEndRequest && isActive && (
             <div className="sticky bottom-4 z-10 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4">
                 <div className="flex items-center text-red-700 dark:text-red-400 font-bold mb-1">
                    <XCircle className="mr-2" size={20} />
                    End Contract Request Rejected
                 </div>
                 <p className="text-red-600 dark:text-red-300 text-sm">
                   Reason: "{contract.endRequest?.rejectionReason || 'No reason provided'}"
                 </p>
                 <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => setShowEndContractModal(true)}
                      className="text-xs bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-slate-700"
                    >
                      New Request
                    </button>
                 </div>
             </div>
          )}

          {/* History / Audit Trail */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Contract History</h3>
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6">
              {contract.history.map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-mono mb-1">
                      {new Date(item.date).toLocaleString()}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {item.action === 'created' && 'Contract Created'}
                      {item.action === 'sent' && 'Contract Sent'}
                      {item.action === 'counter_offer' && 'Counter Offer Proposed'}
                      {item.action === 'accepted' && 'Contract Accepted'}
                      {item.action === 'declined' && 'Contract Declined'}
                      {item.action === 'started' && 'Contract Started'}
                      {item.action === 'completed' && 'Contract Completed'}
                      {item.action === 'cancelled' && 'Contract Cancelled'}
                      {item.action === 'milestone_update' && 'Milestone Updated'}
                      {item.action === 'end_request_rejected' && 'End Request Rejected'}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      by {item.actorName}
                    </span>
                    {item.note && (
                      <p className="mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 italic">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Messages */}
        <div className="lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[600px] sticky top-24">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white flex items-center">
             <MessageCircle size={18} className="mr-2" /> 
             Discussion
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map(msg => {
              const isMe = msg.senderId === user?.id;
              const isSystem = msg.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-center">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-brand-100 text-right' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
             <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
               <Paperclip size={20} />
             </button>
             <input
               type="text"
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="Type a message..."
               className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-full px-4 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-white"
             />
             <button type="submit" className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors shadow-sm">
               <Send size={18} />
             </button>
          </form>
        </div>

      </div>

      {/* Counter Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Propose Counter Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <Input 
                label="Total Amount (KES)"
                type="number"
                value={counterTerms.amount}
                onChange={(e) => setCounterTerms({...counterTerms, amount: parseInt(e.target.value)})}
              />
              {/* Removed Deposit Input here as per specification */}
              <Input 
                label="Duration (Days)"
                type="number"
                value={counterTerms.durationDays}
                onChange={(e) => setCounterTerms({...counterTerms, durationDays: parseInt(e.target.value)})}
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule / Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                  rows={3}
                  value={counterTerms.schedule}
                  onChange={(e) => setCounterTerms({...counterTerms, schedule: e.target.value})}
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowCounterModal(false)}>Cancel</Button>
              <Button onClick={handleCounterOffer}>Submit Proposal</Button>
            </div>
          </div>
        </div>
      )}

      {/* End Contract Modal */}
      {showEndContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">End Contract</h3>
              <button onClick={() => setShowEndContractModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason Type</label>
                  <div className="grid grid-cols-2 gap-4">
                     <button
                       onClick={() => setEndType('completion')}
                       className={`p-4 rounded-xl border-2 text-center transition-all ${
                         endType === 'completion'
                           ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                           : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                       }`}
                     >
                       <CheckCircle className="mx-auto mb-2" size={24} />
                       <div className="font-bold text-sm">Completed</div>
                     </button>
                     <button
                       onClick={() => setEndType('termination')}
                       className={`p-4 rounded-xl border-2 text-center transition-all ${
                         endType === 'termination'
                           ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                           : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                       }`}
                     >
                       <XCircle className="mx-auto mb-2" size={24} />
                       <div className="font-bold text-sm">Terminate / Dispute</div>
                     </button>
                  </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason Description</label>
                 <textarea 
                   className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:bg-slate-800 dark:text-white"
                   rows={3}
                   placeholder="e.g. Work delivered successfully, project ended early..."
                   value={endReason}
                   onChange={(e) => setEndReason(e.target.value)}
                 />
                 <p className="text-xs text-slate-500 mt-2">
                   This request must be approved by the other party before the contract is closed.
                 </p>
               </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowEndContractModal(false)}>Cancel</Button>
              <Button onClick={handleRequestEndContract} disabled={!endReason}>Send Request</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject End Contract Modal */}
      {showRejectEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Reject Request</h3>
                <button onClick={() => setShowRejectEndModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6">
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                   Please provide a reason why you are declining the request to end this contract.
                 </p>
                 <textarea 
                   className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:bg-slate-800 dark:text-white"
                   rows={3}
                   placeholder="e.g. We are open to discussing the deadline..."
                   value={rejectionReason}
                   onChange={(e) => setRejectionReason(e.target.value)}
                 />
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowRejectEndModal(false)}>Cancel</Button>
                 <Button onClick={() => handleResolveEndRequest(false)} disabled={!rejectionReason}>Reject Request</Button>
              </div>
           </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rate Experience</h3>
                <button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-8 text-center space-y-6">
                 <p className="text-slate-600 dark:text-slate-300">
                   How was your experience working with <span className="font-bold">{isCreator ? contract.clientName : contract.creatorName}</span>?
                 </p>
                 
                 {/* Overall Rating */}
                 <div>
                    <div className="flex justify-center gap-2 mb-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button 
                           key={star}
                           type="button"
                           onClick={() => setRating(star)}
                           className="transition-transform hover:scale-110 focus:outline-none"
                         >
                           <Star 
                             size={32} 
                             fill={star <= rating ? "#eab308" : "none"} 
                             className={star <= rating ? "text-yellow-500" : "text-slate-300 dark:text-slate-600"} 
                           />
                         </button>
                       ))}
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {rating === 0 ? 'Select a rating' : rating === 5 ? 'Excellent!' : rating >= 4 ? 'Great' : rating === 3 ? 'Good' : 'Poor'}
                    </p>
                 </div>

                 {/* Payment Rating (Creator rating Client only) */}
                 {isCreator && (
                   <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/50">
                      <p className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center justify-center">
                        <DollarSign size={16} className="mr-1" /> Payment Reliability
                      </p>
                      <div className="flex justify-center gap-2">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button 
                             key={star}
                             type="button"
                             onClick={() => setPaymentRating(star)}
                             className="transition-transform hover:scale-110 focus:outline-none"
                           >
                             <div 
                               className={`w-4 h-4 rounded-full ${star <= paymentRating ? 'bg-green-500 shadow-sm' : 'bg-slate-200 dark:bg-slate-600'}`} 
                             />
                           </button>
                         ))}
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                        Was payment prompt and hassle-free?
                      </p>
                   </div>
                 )}

                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-left">Comment (Optional)</label>
                   <textarea 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white text-sm"
                      rows={3}
                      placeholder="Share details about your experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                   />
                 </div>

                 <Button 
                   onClick={handleSubmitRating} 
                   disabled={rating === 0 || (isCreator && paymentRating === 0)} 
                   className="w-full"
                 >
                   Submit Review
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ContractDetail;
