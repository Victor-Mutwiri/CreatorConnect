import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Clock, FileText, Send, 
  CheckCircle, XCircle, RefreshCw, MessageCircle, Paperclip, Shield, Info, AlertTriangle, Star,
  Smartphone, Building, Bitcoin, Lock, Flag, Loader, Upload, Eye, ExternalLink, HelpCircle,
  Plus, Trash2, Calculator, ChevronDown, ChevronUp, ShieldAlert, Wand2, Divide, Handshake, Zap, ShieldCheck
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { Contract, ContractStatus, Message, ContractTerms, User, MilestoneStatus, Milestone, ContractPaymentType, ContractPaymentMethod } from '../../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  // Added isSubmitting state to fix undefined errors in escrow payment flow
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [creatorUser, setCreatorUser] = useState<User | null>(null);

  // Modals
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showEndContractModal, setShowEndContractModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRejectEndModal, setShowRejectEndModal] = useState(false);
  const [showEscrowPayModal, setShowEscrowPayModal] = useState(false);
  
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState<string | null>(null);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState<string | null>(null);
  const [showReviewWorkModal, setShowReviewWorkModal] = useState<Milestone | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState<string | null>(null);
  const [showResolveDisputeModal, setShowResolveDisputeModal] = useState<string | null>(null);
  
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [showDisputeWarning, setShowDisputeWarning] = useState(false);

  // Tax Module State
  const [taxResidency, setTaxResidency] = useState<'resident' | 'non-resident'>('resident');
  const [showTaxDetails, setShowTaxDetails] = useState(true);

  // Work Submission State
  const [workLink, setWorkLink] = useState('');
  const [workNote, setWorkNote] = useState('');

  // Payment Proof State
  const [proofImage, setProofImage] = useState<string>(''); 
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');

  const [revisionNote, setRevisionNote] = useState('');

  // Dispute State
  const [disputeReason, setDisputeReason] = useState('');
  const [triedChatting, setTriedChatting] = useState(false);
  const [resolutionType, setResolutionType] = useState<'RESUME_WORK' | 'RETRY_PAYMENT'>('RESUME_WORK');
  const [resolutionMessage, setResolutionMessage] = useState('');

  // End Contract State
  const [endReason, setEndReason] = useState('');
  const [endType, setEndType] = useState<'completion' | 'termination'>('completion');
  const [rejectionReason, setRejectionReason] = useState('');

  // Rating State
  const [rating, setRating] = useState(0);
  const [paymentRating, setPaymentRating] = useState(0); 
  const [reviewComment, setReviewComment] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Counter offer state
  const [counterTerms, setCounterTerms] = useState<ContractTerms>({
    paymentType: 'FIXED',
    paymentMethod: 'ESCROW',
    amount: 0,
    currency: 'KES',
    durationDays: 0,
    deliverables: [],
    schedule: '',
    startDate: '',
    milestones: []
  });
  
  const getRevisionLimit = (policy: string | undefined): number => {
    if (!policy) return 0;
    if (policy === 'Unlimited Revisions') return Infinity;
    if (policy === 'No Revisions') return 0;
    const match = policy.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

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
          const cTerms = JSON.parse(JSON.stringify(c.terms));
          if (!cTerms.paymentMethod) cTerms.paymentMethod = 'DIRECT';
          setCounterTerms(cTerms);
          const cUser = await mockAuth.getCreatorProfile(c.creatorId);
          setCreatorUser(cUser);
        }
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, user]);

  useEffect(() => {
    if (location.state && (location.state as any).openReview && !loading && contract) {
       const isCompleted = contract.status === ContractStatus.COMPLETED;
       const isCreator = user?.id === contract.creatorId;
       const hasReviewed = isCreator ? contract.isCreatorReviewed : contract.isClientReviewed;
       
       if (isCompleted && !hasReviewed) {
         setShowRatingModal(true);
         window.history.replaceState({}, document.title);
       }
    }
  }, [location, loading, contract, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (counterTerms.paymentType === 'MILESTONE' && counterTerms.milestones) {
      const total = counterTerms.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      setCounterTerms(prev => ({ ...prev, amount: total }));
    }
  }, [counterTerms.milestones, counterTerms.paymentType]);

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

  const handleConfirmEscrowPayment = async () => {
    setIsSubmitting(true);
    await handleStatusChange(ContractStatus.ACTIVE);
    setShowEscrowPayModal(false);
    setIsSubmitting(false);
  };

  const handleCounterOffer = async () => {
    if (!contract || !user) return;
    
    if (counterTerms.paymentType === 'MILESTONE' && (!counterTerms.milestones || counterTerms.milestones.length === 0)) {
       alert("Please add at least one milestone.");
       return;
    }

    try {
      const sanitizedTerms = { ...counterTerms };
      if (sanitizedTerms.paymentType === 'MILESTONE' && sanitizedTerms.milestones) {
         sanitizedTerms.milestones = sanitizedTerms.milestones.map((m, idx) => ({
            ...m,
            id: m.id || `ms-new-${Date.now()}-${idx}`,
            status: 'PENDING',
            revisionsUsed: m.revisionsUsed || 0
         }));
      } else {
        sanitizedTerms.milestones = [{
          id: `ms-${Date.now()}-fixed`,
          title: 'Complete Project Delivery',
          description: 'Final delivery of all agreed items.',
          amount: sanitizedTerms.amount,
          status: 'PENDING',
          revisionsUsed: 0
        }];
      }

      const updated = await mockContractService.counterOffer(
        contract.id, sanitizedTerms, user.id, user.name
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

  const handleAutoDistribute = (count: number) => {
    if (counterTerms.amount <= 0) {
       alert("Please ensure Total Amount is set before splitting.");
       return;
    }

    const total = counterTerms.amount;
    const maxFirst = Math.floor(total * 0.30);
    let firstAmount = Math.floor(total / count);
    if (firstAmount > maxFirst) firstAmount = maxFirst;

    const remainder = total - firstAmount;
    const otherAmount = count > 1 ? Math.floor(remainder / (count - 1)) : 0;
    const lastAmount = remainder - (otherAmount * (count - 2)); 

    const newMilestones: Milestone[] = [];
    for (let i = 0; i < count; i++) {
      let amount = otherAmount;
      if (i === 0) amount = firstAmount;
      if (i === count - 1 && count > 1) amount = lastAmount;

      newMilestones.push({
        id: `temp-${Date.now()}-${i}`,
        title: `Phase ${i + 1}`,
        description: i === 0 ? 'Initial deliverable / Concept' : 'Work in progress',
        amount: amount,
        status: 'PENDING',
        revisionsUsed: 0
      });
    }
    setCounterTerms(prev => ({ ...prev, milestones: newMilestones }));
  };

  const toggleCounterPaymentType = (type: ContractPaymentType) => {
     if (type === 'MILESTONE') {
       const total = counterTerms.amount;
       if (total > 0) {
         const m1 = Math.floor(total * 0.30);
         const remainder = total - m1;
         const m2 = Math.floor(remainder / 2);
         const m3 = remainder - m2;

         setCounterTerms(prev => ({
            ...prev,
            paymentType: type,
            milestones: [
              { id: `temp-1`, title: 'Phase 1', amount: m1, description: 'Initial Phase', status: 'PENDING', revisionsUsed: 0 },
              { id: `temp-2`, title: 'Phase 2', amount: m2, description: 'Mid Phase', status: 'PENDING', revisionsUsed: 0 },
              { id: `temp-3`, title: 'Phase 3', amount: m3, description: 'Final Phase', status: 'PENDING', revisionsUsed: 0 }
            ]
         }));
       } else {
         setCounterTerms(prev => ({ ...prev, paymentType: type, milestones: [] }));
       }
     } else {
       setCounterTerms(prev => ({ ...prev, paymentType: type, milestones: [] }));
     }
  };

  const updateCounterMilestone = (index: number, field: keyof Milestone, value: any) => {
     if (!counterTerms.milestones) return;
     const newMilestones = [...counterTerms.milestones];
     // @ts-ignore
     newMilestones[index][field] = value;
     setCounterTerms(prev => ({ ...prev, milestones: newMilestones }));
  };

  const addCounterMilestone = () => {
     const newMs: Milestone = {
        id: `temp-${Date.now()}`,
        title: '',
        amount: 0,
        description: '',
        status: 'PENDING',
        revisionsUsed: 0
     };
     setCounterTerms(prev => ({ ...prev, milestones: [...(prev.milestones || []), newMs] }));
  };

  const removeCounterMilestone = (index: number) => {
     if (!counterTerms.milestones) return;
     const newMilestones = counterTerms.milestones.filter((_, i) => i !== index);
     setCounterTerms(prev => ({ ...prev, milestones: newMilestones }));
  };

  const firstMilestoneAmount = counterTerms.milestones?.[0]?.amount || 0;
  const thirtyPercentLimit = counterTerms.amount * 0.30;
  const isFirstMilestoneTooHigh = counterTerms.paymentType === 'MILESTONE' && counterTerms.amount > 0 && firstMilestoneAmount > thirtyPercentLimit;

  const handleSubmitWork = async () => {
    if (!contract || !user || !showSubmitWorkModal) return;
    try {
      const updated = await mockContractService.updateMilestoneStatus(
        contract.id, 
        showSubmitWorkModal, 
        'UNDER_REVIEW', 
        user.id, 
        user.name,
        {
           submission: {
              type: 'link',
              content: workLink,
              note: workNote,
              date: new Date().toISOString()
           }
        }
      );
      setContract(updated);
      setShowSubmitWarning(false);
      setShowSubmitWorkModal(null);
      setWorkLink('');
      setWorkNote('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestChanges = async (milestoneId: string) => {
    if (!contract || !user) return;
    try {
       const updated = await mockContractService.updateMilestoneStatus(
          contract.id,
          milestoneId,
          'IN_PROGRESS',
          user.id,
          user.name,
          { revisionNotes: revisionNote }
       );
       setContract(updated);
       setShowReviewWorkModal(null);
       setRevisionNote('');
    } catch (e) {
       console.error(e);
    }
  };

  const handleSubmitPaymentProof = async () => {
    if (!contract || !user || !showPaymentProofModal) return;
    const mockUrl = proofImage || "https://example.com/payment-proof.jpg"; 
    try {
       const updated = await mockContractService.updateMilestoneStatus(
          contract.id,
          showPaymentProofModal,
          'PAYMENT_VERIFY',
          user.id,
          user.name,
          {
             paymentProof: {
                content: mockUrl,
                method: paymentMethod,
                date: new Date().toISOString()
             }
          }
       );
       setContract(updated);
       setShowPaymentWarning(false);
       setShowPaymentProofModal(null);
    } catch (e) {
       console.error(e);
    }
  };

  const handleConfirmPayment = async (milestoneId: string) => {
     if (!contract || !user) return;
     try {
       const updated = await mockContractService.updateMilestoneStatus(
          contract.id,
          milestoneId,
          'PAID',
          user.id,
          user.name
       );
       setContract(updated);
     } catch (e) {
        console.error(e);
     }
  };

  const handleRaiseDispute = async () => {
    if (!contract || !user || !showDisputeModal) return;
    try {
       const updated = await mockContractService.updateMilestoneStatus(
          contract.id,
          showDisputeModal,
          'DISPUTED',
          user.id,
          user.name,
          { disputeReason }
       );
       setContract(updated);
       setShowDisputeWarning(false);
       setShowDisputeModal(null);
       setDisputeReason('');
       setTriedChatting(false);
    } catch (e) {
       console.error(e);
    }
  };

  const handleProposeResolution = async () => {
    if (!contract || !user || !showResolveDisputeModal) return;
    try {
      const updated = await mockContractService.proposeDisputeResolution(
        contract.id,
        showResolveDisputeModal,
        resolutionType,
        resolutionMessage,
        user.id,
        user.name
      );
      setContract(updated);
      setShowResolveDisputeModal(null);
      setResolutionMessage('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptResolution = async (milestoneId: string) => {
    if (!contract || !user) return;
    try {
      const updated = await mockContractService.acceptDisputeResolution(
        contract.id,
        milestoneId,
        user.id,
        user.name
      );
      setContract(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestEndContract = async (reason: string, type: any) => {
    if (!contract || !user || !reason) return;
    try {
      const updated = await mockContractService.requestEndContract(
        contract.id, user.id, user.name, reason, type
      );
      setContract(updated);
      setShowEndContractModal(false);
      const actionText = type === 'completion' ? 'completion' : 'termination';
      const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', 
        `End of contract (${actionText}) requested by ${user.name}. Reason: ${reason}`
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
       const text = approved ? "End request APPROVED." : `End request REJECTED. Reason: ${rejectionReason}`;
       const sysMsg = await mockContractService.sendMessage(contract.id, 'system', 'System', text);
       setMessages([...messages, sysMsg]);
     } catch(e) {
       console.error(e);
     }
  };

  const handleSubmitRating = async () => {
    if (!contract || !user || rating === 0) return;
    const isCreatorReviewing = user.id === contract.creatorId;
    if (isCreatorReviewing && paymentRating === 0) return; 

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

  const handleGrossUp = () => {
    if (!contract) return;
    
    // Use modal terms if open, else fallback
    const activePaymentMethod = showCounterModal ? counterTerms.paymentMethod : contract.terms.paymentMethod;
    const isEscrow = activePaymentMethod === 'ESCROW';
    
    const platformCommissionRate = isEscrow ? 0.08 : 0;
    const taxRate = taxResidency === 'resident' ? 0.05 : 0.20;
    
    const multiplier = 1 / ((1 - platformCommissionRate) * (1 - taxRate));
    
    const currentBaseAmount = showCounterModal ? counterTerms.amount : contract.terms.amount;
    const newGrossAmount = Math.ceil(currentBaseAmount * multiplier);
    
    if (showCounterModal) {
       const updatedTerms = JSON.parse(JSON.stringify(counterTerms));
       updatedTerms.amount = newGrossAmount;
       if (updatedTerms.paymentType === 'MILESTONE' && updatedTerms.milestones) {
          updatedTerms.milestones = updatedTerms.milestones.map((m: Milestone) => ({
            ...m,
            amount: Math.ceil(m.amount * multiplier)
          }));
          updatedTerms.amount = updatedTerms.milestones.reduce((sum: number, m: Milestone) => sum + m.amount, 0);
       }
       setCounterTerms(updatedTerms);
    } else {
       const newTerms = JSON.parse(JSON.stringify(contract.terms));
       newTerms.amount = newGrossAmount;
       if (newTerms.paymentType === 'MILESTONE' && newTerms.milestones) {
          newTerms.milestones = newTerms.milestones.map((m: Milestone) => ({
            ...m,
            amount: Math.ceil(m.amount * multiplier)
          }));
          newTerms.amount = newTerms.milestones.reduce((sum: number, m: Milestone) => sum + m.amount, 0);
       }
       setCounterTerms(newTerms);
       setShowCounterModal(true);
    }
  };

  if (loading) return <div className="p-20 text-center dark:text-white">Loading...</div>;
  if (!contract) return <div className="p-20 text-center dark:text-white">Contract not found</div>;

  const isPending = [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(contract.status);
  const isAwaitingDeposit = contract.status === ContractStatus.AWAITING_DEPOSIT;
  const isActive = [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(contract.status);
  const isCompleted = contract.status === ContractStatus.COMPLETED;
  const lastHistoryItem = contract.history[contract.history.length - 1];
  const isCreator = user?.id === contract.creatorId;
  const isClientViewer = user?.id === contract.clientId;
  const hasActiveDispute = contract.terms.milestones?.some(m => m.status === 'DISPUTED');
  const pendingEndRequest = contract.endRequest?.status === 'pending';
  
  const isCreatorWorking = contract.terms.milestones?.some(m => m.status === 'IN_PROGRESS');
  const disableEndContractInit = isClientViewer && isCreatorWorking;

  let canTakeAction = false;
  if (contract.status === ContractStatus.SENT) {
    if (isCreator) canTakeAction = true;
  } else if (contract.status === ContractStatus.NEGOTIATING) {
    if (lastHistoryItem?.actionBy && lastHistoryItem.actionBy !== user?.id) {
       canTakeAction = true;
    }
  }

  // Escrow Calculation Helpers for Client View
  const escrowFee = contract.terms.paymentMethod === 'ESCROW' ? Math.round(contract.terms.amount * 0.03) : 0;
  const totalFundingRequired = contract.terms.amount + escrowFee;

  const renderDiffValue = (current: number, previous: number | undefined, label: string, icon: React.ReactNode, prefix: string = '', suffix: string = '') => {
    const hasChange = contract.status === ContractStatus.NEGOTIATING && previous !== undefined && current !== previous;
    return (
      <div className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl relative overflow-hidden transition-all ${hasChange ? 'ring-2 ring-yellow-400/50' : ''}`}>
        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center">{icon} {label}</div>
        {hasChange && <div className="text-sm text-slate-400 line-through mb-1 font-medium">{prefix} {previous.toLocaleString()} {suffix}</div>}
        <div className={`text-xl font-bold ${hasChange ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>{prefix} {current.toLocaleString()} {suffix}</div>
        {hasChange && <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">EDITED</div>}
      </div>
    );
  };

  const renderMilestones = () => {
     if (!contract.terms.milestones || contract.terms.milestones.length === 0) return null;
     const isFixedContract = contract.terms.paymentType === 'FIXED';
     const revisionLimit = getRevisionLimit(contract.terms.revisionPolicy);

     return (
       <div className="space-y-4 mt-6">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center"><Flag size={20} className="mr-2 text-brand-600" /> {isFixedContract ? 'Project Deliverable' : 'Milestones'}</h3>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">Policy: {contract.terms.revisionPolicy}</span>
         </div>
         <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pl-8 py-2">
            {contract.terms.milestones.map((ms, idx) => {
               const isLocked = ms.status === 'PENDING';
               const isPaid = ms.status === 'PAID';
               const isInProgress = ms.status === 'IN_PROGRESS';
               const isReview = ms.status === 'UNDER_REVIEW';
               const isPaymentVerify = ms.status === 'PAYMENT_VERIFY';
               const isDisputed = ms.status === 'DISPUTED';
               const isCancelled = ms.status === 'CANCELLED';
               const usedRevisions = ms.revisionsUsed || 0;
               const revisionsLeft = revisionLimit === Infinity ? Infinity : revisionLimit - usedRevisions;

               return (
                  <div key={ms.id} className={`relative p-5 rounded-xl border ${isInProgress || isReview || isPaymentVerify ? 'bg-white dark:bg-slate-900 border-brand-200 shadow-md ring-1 ring-brand-500/30' : isPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : isDisputed ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : isCancelled ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 opacity-50 grayscale' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 opacity-70'}`}>
                     <div className={`absolute -left-[41px] top-6 w-6 h-6 rounded-full border-4 flex items-center justify-center ${isPaid ? 'bg-green-500 border-green-100' : isDisputed ? 'bg-red-500 border-red-100' : isCancelled ? 'bg-slate-200 border-slate-100' : (isInProgress || isReview || isPaymentVerify) ? 'bg-brand-500 border-brand-100' : 'bg-slate-300 border-slate-100'}`}>
                        {isPaid && <CheckCircle size={12} className="text-white" />}
                        {isLocked && <Lock size={10} className="text-slate-50" />}
                        {isDisputed && <XCircle size={12} className="text-white" />}
                        {isCancelled && <XCircle size={12} className="text-white opacity-50" />}
                        {(isInProgress || isReview || isPaymentVerify) && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                     </div>
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <div className="flex items-center gap-2"><h4 className={`font-bold text-lg ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{ms.title}</h4>{usedRevisions > 0 && <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">REV #{usedRevisions}</span>}</div>
                           <p className="text-sm text-slate-500 dark:text-slate-400">{ms.description}</p>
                        </div>
                        <div className="text-right">
                           <div className={`font-bold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{contract.terms.currency} {ms.amount.toLocaleString()}</div>
                           <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${isPaid ? 'bg-green-100 text-green-700' : isReview ? 'bg-orange-100 text-orange-700' : isPaymentVerify ? 'bg-purple-100 text-purple-700' : isDisputed ? 'bg-red-100 text-red-700' : isInProgress ? 'bg-brand-100 text-brand-700' : isCancelled ? 'bg-slate-200 text-slate-500' : 'bg-slate-200 text-slate-600'}`}>{ms.status.replace('_', ' ')}</span>
                        </div>
                     </div>
                     {ms.revisionNotes && isInProgress && <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 text-sm"><p className="font-bold text-yellow-800 text-xs uppercase mb-1">Changes Requested:</p><p className="text-slate-700 dark:text-slate-300 italic">"{ms.revisionNotes}"</p></div>}
                     {isActive && !isCancelled && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                           {isCreator && (
                              <div className="flex justify-between items-center">
                                 {(isInProgress || isReview) && <button onClick={() => setShowDisputeModal(ms.id)} className="text-xs font-bold text-red-600 hover:underline flex items-center"><ShieldAlert size={14} className="mr-1" /> Dispute Milestone</button>}
                                 <div className="flex justify-end gap-2 ml-auto">
                                    {isInProgress && (pendingEndRequest ? <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium border border-red-200"><AlertTriangle size={12} className="mr-1" /> Action Blocked: End Request Pending</span> : <Button size="sm" onClick={() => setShowSubmitWorkModal(ms.id)}><Upload size={16} className="mr-2" /> Submit Work</Button>)}
                                    {isPaymentVerify && (
                                       <div className="flex flex-col items-end w-full">
                                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 mb-3 w-full"><p className="text-sm font-bold text-purple-800 mb-2">Client has sent payment.</p>{ms.paymentProof && <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-200"><Eye size={14} /><a href={ms.paymentProof.content} target="_blank" rel="noreferrer" className="hover:underline text-brand-600">View Proof</a><span className="text-slate-300">|</span><span>Method: {ms.paymentProof.method}</span></div>}</div>
                                          <div className="flex gap-2"><Button size="sm" variant="outline" className="text-red-600" onClick={() => setShowDisputeModal(ms.id)}>Dispute Payment</Button><Button size="sm" className="bg-green-600" onClick={() => handleConfirmPayment(ms.id)}>Confirm Receipt</Button></div>
                                       </div>
                                    )}
                                    {isReview && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded"><Clock size={12} className="mr-1"/> Waiting for client approval</span>}
                                 </div>
                              </div>
                           )}
                           {isClientViewer && (
                              <div className="w-full">
                                 {isReview && (
                                    <div className="w-full">
                                       <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-3">
                                          <div className="flex justify-between items-start"><div><p className="text-sm font-bold text-orange-800">Review Submission</p><div className="flex items-center mt-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${revisionsLeft <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{revisionLimit === Infinity ? 'Unlimited Revisions' : `${revisionsLeft} Revisions Remaining`}</span></div></div><div className="text-xs text-orange-600 flex items-center"><Clock size={12} className="mr-1" /> Auto-approves in 71h 59m</div></div>
                                          {ms.submission && <div className="bg-white p-2 rounded border border-slate-200 text-sm mt-3"><p className="font-semibold text-slate-900 mb-1">Creator Note:</p><p className="text-slate-600 italic">"{ms.submission.note}"</p><a href={ms.submission.content} target="_blank" rel="noreferrer" className="inline-flex items-center text-brand-600 hover:underline"><ExternalLink size={14} className="mr-1" /> View Work</a></div>}
                                       </div>
                                       <div className="flex justify-end gap-2 items-center">{revisionsLeft > 0 ? <Button size="sm" variant="outline" onClick={() => setShowReviewWorkModal(ms)}>Request Changes</Button> : <button onClick={() => setShowDisputeModal(ms.id)} className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-full hover:bg-red-50 flex items-center"><ShieldAlert size={14} className="mr-1.5" /> Raise Quality Dispute</button>}<Button size="sm" onClick={() => setShowPaymentProofModal(ms.id)}>Approve & Pay</Button></div>
                                    </div>
                                 )}
                                 {isInProgress && <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded"><Loader size={12} className="mr-1 animate-spin"/> Creator is working on this</span>}
                                 {isPaymentVerify && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded"><Clock size={12} className="mr-1"/> Waiting for creator to confirm payment</span>}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )
            })}
         </div>
       </div>
     );
  };

  const renderCreatorEarningsBreakdown = () => {
    if (!contract || !isCreator) return null;
    
    // Counter-offer check UI
    if (!canTakeAction && isPending) {
       return (
         <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in">
            <p className="text-sm text-slate-500 italic">Your proposal is being reviewed by the client. You can adjust terms again if they counter-offer.</p>
         </div>
       );
    }

    const baseAmount = contract.terms.amount;
    const isEscrow = contract.terms.paymentMethod === 'ESCROW';
    const platformCommission = isEscrow ? Math.round(baseAmount * 0.08) : 0;
    const taxRate = taxResidency === 'resident' ? 0.05 : 0.20;
    const estimatedTax = (baseAmount - platformCommission) * taxRate;
    const estimatedTakeHome = baseAmount - platformCommission - estimatedTax;

    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-in slide-in-from-right-2">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 flex justify-between items-center cursor-pointer" onClick={() => setShowTaxDetails(!showTaxDetails)}>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center"><Calculator size={20} className="mr-2 text-blue-600" /> Earnings Breakdown & Tax</h3>
          <button className="text-slate-500">{showTaxDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>
        {showTaxDetails && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Residency Status:</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setTaxResidency('resident')} className={`px-3 py-1 text-xs font-bold rounded-md ${taxResidency === 'resident' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Resident (5%)</button>
                <button onClick={() => setTaxResidency('non-resident')} className={`px-3 py-1 text-xs font-bold rounded-md ${taxResidency === 'non-resident' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Non-Resident (20%)</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200"><p className="text-xs text-slate-500 mb-1">Contract Total</p><p className="font-bold text-slate-900 dark:text-white">{contract.terms.currency} {baseAmount.toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 relative group"><p className="text-xs text-slate-500 mb-1 flex items-center">Platform Fee {isEscrow && <Info size={10} className="ml-1 opacity-50" />}</p><p className={`font-bold ${platformCommission > 0 ? 'text-red-500' : 'text-slate-400'}`}>{contract.terms.currency} {platformCommission.toLocaleString()}</p>{isEscrow && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">8% Ubuni Connect platform commission for secured Escrow transactions.</div>}</div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200"><p className="text-xs text-slate-500 mb-1">Est. WHT Tax</p><p className="font-bold text-slate-600">{contract.terms.currency} {estimatedTax.toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100"><p className="text-xs text-green-700 mb-1">Net Take-home</p><p className="font-bold text-green-800">{contract.terms.currency} {estimatedTakeHome.toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 mb-2 transition-colors"><ArrowLeft size={18} className="mr-1" /> Back to Contracts</button>
          
          {/* AWAITING DEPOSIT BANNERS */}
          {isAwaitingDeposit && (
            <div className="animate-in slide-in-from-top-4 duration-500">
               {isClientViewer ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6 shadow-lg">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-800/50 rounded-full text-red-600 animate-pulse">
                           <Clock size={32} />
                        </div>
                        <div className="flex-1">
                           <h3 className="text-xl font-bold text-red-900 dark:text-red-300">Action Required: Escrow Funding Required</h3>
                           <p className="text-red-800 dark:text-red-400 mt-1 font-medium">
                              Your contract is waiting for the initial deposit to become active.
                           </p>
                           <div className="mt-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-100 space-y-3">
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                 Deposit <span className="font-bold">KES {totalFundingRequired.toLocaleString()}</span> to the Escrow Kenya secure wallet to protect both parties and start the job.
                              </p>
                              <div className="flex gap-2">
                                 <Button 
                                    onClick={() => setShowEscrowPayModal(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20"
                                 >
                                    Pay KES {totalFundingRequired.toLocaleString()} to Escrow
                                 </Button>
                                 <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Payment Security Info</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 rounded-2xl p-6">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-800/50 rounded-full text-orange-600">
                           <Shield size={32} />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300">Waiting for Client Funding</h3>
                           <p className="text-orange-800 dark:text-orange-400 mt-1">
                              The client has been notified to fund the escrow account. 
                              <span className="font-bold block mt-2 text-red-600">IMPORTANT: Do not begin work until the status changes to "ACTIVE" to ensure your payment is secured.</span>
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          )}

          {/* MUTUAL END REQUEST RESPONSE UI */}
          {pendingEndRequest && (
            <div className="animate-in slide-in-from-top-2 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-2xl shadow-md">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-600">
                     <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">End Contract Request Pending</h3>
                     <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                        <strong>{contract.endRequest?.requesterName}</strong> has requested to end this contract.
                        <br/><span className="italic mt-1 block">"Reason: {contract.endRequest?.reason}"</span>
                     </p>
                     
                     {contract.endRequest?.requesterId !== user?.id ? (
                        <div className="mt-4 flex gap-3">
                           <button 
                             onClick={() => handleResolveEndRequest(true)}
                             className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow-md"
                           >
                             Approve & End Contract
                           </button>
                           <button 
                             onClick={() => setShowRejectEndModal(true)}
                             className="px-6 py-2 bg-white border border-amber-300 text-amber-700 font-bold rounded-lg hover:bg-amber-50"
                           >
                             Reject Request
                           </button>
                        </div>
                     ) : (
                        <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-400">
                           <Loader size={16} className="mr-2 animate-spin" />
                           Waiting for response from {isCreator ? 'Client' : 'Creator'}...
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{contract.title}</h1>{isClientViewer ? <p className="text-slate-500">Creator: <Link to={`/profile/${contract.creatorId}`} className="font-semibold text-slate-700 hover:text-brand-600">{contract.creatorName}</Link></p> : <p className="text-slate-500">Client: <Link to={`/client/profile/${contract.clientId}`} className="font-semibold text-slate-700 hover:text-brand-600">{contract.clientName}</Link></p>}</div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase mb-2 ${
                  isActive ? 'bg-green-100 text-green-700' : 
                  isAwaitingDeposit ? 'bg-orange-100 text-orange-700' :
                  contract.status === ContractStatus.SENT ? 'bg-blue-100 text-blue-700' : 
                  'bg-orange-100 text-orange-700'
                }`}>
                  {contract.status.replace('_', ' ')}
                </span>
                <div className="flex flex-col items-end">{contract.terms.paymentType && <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{contract.terms.paymentType} Contract</span>}{contract.terms.paymentMethod === 'ESCROW' ? <span className="flex items-center gap-1 text-[10px] text-brand-600 font-black uppercase mt-1"><ShieldCheck size={12} /> Escrow Kenya Secured</span> : <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Direct Transfer</span>}</div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{contract.description}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center"><FileText size={20} className="mr-2 text-brand-600" /> Contract Terms</h3>
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {renderDiffValue(contract.terms.amount, contract.previousTerms?.amount, "Project Amount", <DollarSign size={14} className="mr-1"/>, contract.terms.currency)}
                {renderDiffValue(contract.terms.durationDays, contract.previousTerms?.durationDays, "Duration", <Calendar size={14} className="mr-1"/>, "", "Days")}
                
                {isClientViewer && contract.terms.paymentMethod === 'ESCROW' && (
                  <>
                    <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-xl border border-brand-100 dark:border-brand-800">
                        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center"><Zap size={14} className="mr-1 text-brand-600"/> Escrow Fee (3%)</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white">{contract.terms.currency} {escrowFee.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg col-span-full sm:col-span-1">
                        <div className="text-slate-400 text-sm mb-1 flex items-center"><ShieldCheck size={14} className="mr-1 text-brand-500"/> Total Funding Required</div>
                        <div className="text-xl font-black text-white">{contract.terms.currency} {totalFundingRequired.toLocaleString()}</div>
                    </div>
                  </>
                )}
             </div>
             {renderMilestones()}
          </div>

          {renderCreatorEarningsBreakdown()}

          {/* NEGOTIATION ACTIONS - STRICT TURN BASED LOCK */}
          {isPending && canTakeAction && (
            <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border-2 border-brand-200 dark:border-brand-800 flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw size={16} className="text-brand-600" /> Action Required
                </p>
                <p className="text-xs text-slate-500">Respond to this proposal to move forward.</p>
              </div>
              <div className="flex gap-2">
                {/* STRICT LOCK: Adjust Price is now part of the conditional Action Bar only */}
                {isCreator && (
                  <button 
                    onClick={handleGrossUp}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 flex items-center text-sm border border-blue-200"
                  >
                    <Wand2 size={16} className="mr-2" /> Adjust Price
                  </button>
                )}
                <button onClick={() => setShowCounterModal(true)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center text-sm"><RefreshCw size={16} className="mr-2" />Counter Offer</button>
                <button onClick={() => handleStatusChange(ContractStatus.DECLINED)} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 flex items-center text-sm"><XCircle size={16} className="mr-2" />Decline</button>
                <Button onClick={() => handleStatusChange(ContractStatus.ACCEPTED)} className="flex items-center text-sm"><CheckCircle size={16} className="mr-2" />Accept Contract</Button>
              </div>
            </div>
          )}
          
          {/* ACTIVE CONTRACT ACTIONS - NO COUNTER OFFER OR ADJUST PRICE ALLOWED */}
          {isActive && !pendingEndRequest && (
            <div className="sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 flex items-center justify-between">
               <div>
                  <p className="font-bold text-slate-900 dark:text-white">Active Contract</p>
                  <p className="text-xs text-slate-500">Project is in progress.</p>
               </div>
               
               <div className="flex items-center gap-3">
                  {disableEndContractInit && (
                     <div className="group relative">
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full flex items-center">
                           <Lock size={12} className="mr-1" /> End Locked
                        </span>
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                           You cannot initiate contract termination while the creator is actively working on an IN-PROGRESS milestone.
                        </div>
                     </div>
                  )}
                  <button 
                     disabled={disableEndContractInit}
                     onClick={() => setShowEndContractModal(true)} 
                     className={`px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors ${disableEndContractInit ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600'}`}
                  >
                     End Contract
                  </button>
               </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6"><h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Contract History</h3><div className="relative border-l-2 border-slate-100 ml-3 space-y-6">{contract.history.map((item) => (<div key={item.id} className="relative pl-6"><div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div><div className="flex flex-col"><span className="text-xs text-slate-400 font-mono mb-1">{new Date(item.date).toLocaleString()}</span><span className="font-medium text-slate-900 dark:text-white">{item.action.toUpperCase()}</span><span className="text-sm text-slate-500">by {item.actorName}</span>{item.note && <p className="mt-1 text-sm bg-slate-50 p-2 rounded text-slate-600 italic">"{item.note}"</p>}</div></div>))}</div></div>
        </div>
        <div className="lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 h-[600px] sticky top-24">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 font-bold flex items-center text-slate-800 dark:text-white"><MessageCircle size={18} className="mr-2" />Discussion Board</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.senderId === user?.id ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}><p className="text-sm leading-relaxed">{msg.content}</p></div></div>))}<div ref={messagesEndRef} /></div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 flex gap-2"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-full px-4 text-sm dark:text-white"/><button type="submit" className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 shadow-sm"><Send size={18} /></button></form>
        </div>
      </div>

      {/* ESCROW PAYMENT REDIRECTION MODAL */}
      {showEscrowPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto text-brand-600">
                 <ShieldCheck size={32} />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Escrow Payment Gateway</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                   You are paying <span className="font-bold text-slate-900 dark:text-white">KES {totalFundingRequired.toLocaleString()}</span> to secure this project.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-3">
                 <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">You will be redirected to <span className="font-bold">Escrow Kenya's secure page</span> to complete the transaction.</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Follow the M-Pesa or Bank transfer instructions on their page.</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold text-brand-600">Crucial:</span> After paying, do not close the window. Simply navigate back to Ubuni Connect and wait for the confirmation.</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                   onClick={handleConfirmEscrowPayment}
                   disabled={isSubmitting}
                   className="w-full h-12 text-lg"
                >
                  {isSubmitting ? <Loader className="animate-spin mr-2" /> : 'Proceed to Payment'}
                </Button>
                <button 
                  onClick={() => setShowEscrowPayModal(false)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors py-2"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800"><h3 className="font-bold text-lg text-slate-900 dark:text-white">Propose Counter Offer</h3><button onClick={() => setShowCounterModal(false)} className="text-slate-400 hover:text-slate-700"><XCircle size={24} /></button></div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Payment Method</label><div className="grid grid-cols-2 gap-4"><button onClick={() => setCounterTerms({...counterTerms, paymentMethod: 'ESCROW'})} className={`p-4 rounded-xl border-2 text-left transition-all ${counterTerms.paymentMethod === 'ESCROW' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}><div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1"><ShieldCheck size={18} className="text-brand-600" /> Escrow Kenya</div><p className="text-xs text-slate-500">Highly secured via 3rd party hold. Fees apply.</p></button><button onClick={() => setCounterTerms({...counterTerms, paymentMethod: 'DIRECT'})} className={`p-4 rounded-xl border-2 text-left transition-all ${counterTerms.paymentMethod === 'DIRECT' ? 'border-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-white ring-1 ring-slate-900' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}><div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1"><Smartphone size={18} className="text-slate-400" /> Direct Transfer</div><p className="text-xs text-slate-500">Manual M-Pesa/Bank transfer. Zero platform fees.</p></button></div></div>
              
              {isCreator && (
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-3">
                   <p className="text-xs text-blue-700 flex items-start gap-2">
                     <Info size={14} className="mt-0.5 flex-shrink-0" />
                     {counterTerms.paymentMethod === 'ESCROW' 
                       ? "Escrow contracts include an 8% platform commission. Use the 'Adjust' button below to cover this and WHT taxes." 
                       : "Direct payments have 0% platform commission. Only WHT taxes apply."}
                   </p>
                   <Button size="sm" variant="outline" className="w-fit bg-white" onClick={handleGrossUp}>
                     <Wand2 size={14} className="mr-2" /> Adjust Price to Net Desired Amount
                   </Button>
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4"><button onClick={() => toggleCounterPaymentType('FIXED')} className={`p-4 rounded-xl border text-center transition-all ${counterTerms.paymentType === 'FIXED' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}><DollarSign className="mx-auto mb-2" size={24} /><div className="font-bold">Fixed</div></button><button onClick={() => toggleCounterPaymentType('MILESTONE')} className={`p-4 rounded-xl border text-center transition-all ${counterTerms.paymentType === 'MILESTONE' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}><Flag className="mx-auto mb-2" size={24} /><div className="font-bold">Milestone</div></button></div>
              {counterTerms.paymentType === 'FIXED' ? <Input label="Total Amount (KES)" type="number" value={counterTerms.amount} onChange={(e) => setCounterTerms({...counterTerms, amount: parseInt(e.target.value)})} /> : (
                <div className="space-y-4"><div className="flex justify-between items-center"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Milestones</label><span className="text-sm font-bold text-brand-600">Total: KES {counterTerms.amount.toLocaleString()}</span></div>
                  {counterTerms.milestones?.map((ms, idx) => (<div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start"><div className="flex-1 w-full space-y-3"><div className="flex flex-col md:flex-row gap-4"><Input label="Milestone Title" value={ms.title} onChange={(e) => { const newM = [...counterTerms.milestones!]; newM[idx].title = e.target.value; setCounterTerms({...counterTerms, milestones: newM}); }} /><Input label="Amount (KES)" type="number" value={ms.amount || ''} onChange={(e) => { const newM = [...counterTerms.milestones!]; newM[idx].amount = Number(e.target.value); setCounterTerms({...counterTerms, milestones: newM}); }} /></div><Input label="Description" value={ms.description} onChange={(e) => { const newM = [...counterTerms.milestones!]; newM[idx].description = e.target.value; setCounterTerms({...counterTerms, milestones: newM}); }} /></div><button onClick={() => removeCounterMilestone(idx)} className="text-slate-400 hover:text-red-500 p-2 mt-2"><Trash2 size={20} /></button></div>))}
                  <button onClick={addCounterMilestone} className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700 mt-2"><Plus size={16} className="mr-1" /> Add Milestone</button>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Duration (Days)" type="number" value={counterTerms.durationDays} onChange={(e) => setCounterTerms({...counterTerms, durationDays: parseInt(e.target.value)})} />
                {isClientViewer && <Input label="Offer Valid Until" type="date" min={new Date().toISOString().split('T')[0]} />}
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowCounterModal(false)}>Cancel</Button><Button onClick={handleCounterOffer} disabled={isFirstMilestoneTooHigh}>Submit Proposal</Button></div>
          </div>
        </div>
      )}
      
      {showSubmitWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Submit Work for Review</h3>
              <button onClick={() => setShowSubmitWorkModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Provide a link to your work.</p>
              <Input label="Work Link / URL" placeholder="https://..." value={workLink} onChange={(e) => setWorkLink(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 dark:bg-slate-800" rows={3} placeholder="Describe what you've done..." value={workNote} onChange={(e) => setWorkNote(e.target.value)} />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowSubmitWorkModal(null)}>Cancel</Button>
              <Button onClick={() => setShowSubmitWarning(true)} disabled={!workLink && !workNote}>Submit Work</Button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORED CREATOR SUBMISSION WARNING */}
      {showSubmitWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 text-center">
            <ShieldAlert size={48} className="mx-auto mb-4 text-orange-600" />
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-tight">Confirm Submission</h3>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl mb-4 border border-orange-200">
               <p className="text-sm text-orange-800 dark:text-orange-400 font-medium">
                  By clicking confirm, you certify that the work link provided is authentic and complete. 
                  <br/><br/>
                  <span className="font-bold">WARNING:</span> Submitting empty, invalid, or non-functional links to trigger payment is considered fraud. Fraudulent claims lead to <span className="font-black underline">immediate account suspension and permanent banning</span>.
               </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowSubmitWarning(false)}>Back</Button>
              <Button className="flex-1 bg-orange-600" onClick={handleSubmitWork}>I Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {showReviewWorkModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-900">Request Changes</h3><button onClick={() => setShowReviewWorkModal(null)} className="text-slate-400 hover:text-slate-700"><XCircle size={24} /></button></div>
               <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">Explain clearly what needs to be changed. <span className="font-bold text-orange-600">This consumes 1 revision.</span></p>
                  <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 dark:bg-slate-800" rows={4} placeholder="e.g. Change the music tracks..." value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} />
               </div>
               <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowReviewWorkModal(null)}>Cancel</Button>
                  <Button onClick={() => handleRequestChanges(showReviewWorkModal.id)} disabled={!revisionNote}>Request Changes</Button>
               </div>
            </div>
         </div>
      )}

      {showPaymentProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Upload Payment Proof</h3>
              <button onClick={() => setShowPaymentProofModal(null)} className="text-slate-400 hover:text-slate-700"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">Send payment then upload screenshot here.</div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-800" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                 <option>M-Pesa</option>
                 <option>Bank Transfer</option>
                 <option>Crypto</option>
              </select>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50" onClick={() => setProofImage("https://via.placeholder.com/300x400")} >
                 {proofImage ? <p className="text-xs text-green-600 font-bold">Image Selected</p> : <p className="text-sm text-slate-600 font-medium">Click to upload screenshot</p>}
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowPaymentProofModal(null)}>Cancel</Button>
              <Button onClick={() => setShowPaymentWarning(true)} disabled={!proofImage}>Send Verification</Button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORED CLIENT PAYMENT WARNING */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 text-center">
            <ShieldAlert size={48} className="mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-tight">Verify Payment Proof</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4 border border-blue-200">
               <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                  By uploading this proof, you certify that the payment has been successfully sent to the creator.
                  <br/><br/>
                  <span className="font-bold">LEGAL NOTICE:</span> Submitting fake payment screenshots or doctored SMS alerts is a crime under Kenyan Law. Accounts found submitting fake proof will be <span className="font-black underline">permanently banned and reported to the authorities</span>.
               </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowPaymentWarning(false)}>Back</Button>
              <Button className="flex-1 bg-blue-600" onClick={handleSubmitPaymentProof}>I Certify & Send</Button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-red-50 flex justify-between items-center"><h3 className="font-bold text-lg text-red-900"><AlertTriangle className="mr-2" size={20}/> Raise Dispute</h3><button onClick={() => setShowDisputeModal(null)} className="text-slate-400 hover:text-slate-700"><XCircle size={24} /></button></div>
               <div className="p-6 space-y-4">
                  <p className="text-sm font-medium">Disputes are a last resort.</p>
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${triedChatting ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}><input type="checkbox" id="amicableCheck" className="mt-1 w-4 h-4 text-brand-600 rounded" checked={triedChatting} onChange={(e) => setTriedChatting(e.target.checked)}/><label htmlFor="amicableCheck" className="text-sm text-slate-700 leading-tight cursor-pointer">I attempted to resolve this amicably first.</label></div>
                  <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-red-500 dark:bg-slate-800" rows={4} placeholder="Describe the issue..." value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} />
               </div>
               <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowDisputeModal(null)}>Cancel</Button><Button className="bg-red-600" onClick={() => setShowDisputeWarning(true)} disabled={!disputeReason || !triedChatting}>Submit Dispute</Button></div>
            </div>
         </div>
      )}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-900">Rate Experience</h3><button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button></div>
            <div className="p-8 text-center space-y-6">
              <p>How was your experience with <span className="font-bold">{isCreator ? contract.clientName : contract.creatorName}</span>?</p>
              <div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setRating(star)}><Star size={32} fill={star <= rating ? "#eab308" : "none"} className={star <= rating ? "text-yellow-500" : "text-slate-300"} /></button>))}</div>
              <textarea className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-brand-500 dark:bg-slate-800" rows={3} placeholder="Share details..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /><Button onClick={handleSubmitRating} disabled={rating === 0} className="w-full">Submit Review</Button>
            </div>
          </div>
        </div>
      )}
      {showDisputeWarning && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 text-center"><AlertTriangle size={32} className="mx-auto mb-4 text-red-600" /><h3 className="text-xl font-bold mb-3">Raise Dispute?</h3><p className="text-sm text-slate-700 mb-4">This triggers a formal investigation. Bad faith disputes result in bans.</p><div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={() => setShowDisputeWarning(false)}>Back</Button><Button className="flex-1 bg-red-600" onClick={handleRaiseDispute}>Raise Dispute</Button></div></div></div>}
      {showResolveDisputeModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-blue-200"><h3 className="font-bold text-lg text-blue-900 flex items-center mb-4"><Handshake className="mr-2" size={20}/> Resolve Amicably</h3><div className="grid grid-cols-2 gap-3 mb-3"><button className={`p-3 rounded-lg border font-medium ${resolutionType === 'RESUME_WORK' ? 'bg-brand-50 border-brand-500' : ''}`} onClick={() => setResolutionType('RESUME_WORK')}>Resume Work</button><button className={`p-3 rounded-lg border font-medium ${resolutionType === 'RETRY_PAYMENT' ? 'bg-brand-50 border-brand-500' : ''}`} onClick={() => setResolutionType('RETRY_PAYMENT')}>Retry Payment</button></div><textarea className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 mb-4" rows={3} placeholder="Explain the solution..." value={resolutionMessage} onChange={(e) => setResolutionMessage(e.target.value)} /><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowResolveDisputeModal(null)}>Cancel</Button><Button onClick={handleProposeResolution}>Send Proposal</Button></div></div></div>}
      {showEndContractModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6"><h3 className="font-bold text-lg mb-4">End Contract</h3><div className="grid grid-cols-2 gap-4 mb-4"><button onClick={() => setEndType('completion')} className={`p-4 rounded-xl border-2 ${endType === 'completion' ? 'border-brand-500 bg-brand-50' : ''}`}><CheckCircle size={24} className="mx-auto mb-2" />Completed</button><button onClick={() => setEndType('termination')} className={`p-4 rounded-xl border-2 ${endType === 'termination' ? 'border-red-500 bg-red-50' : ''}`}><XCircle size={24} className="mx-auto mb-2" />Terminate</button></div><textarea className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 mb-4" rows={3} placeholder="Description..." value={endReason} onChange={(e) => setEndReason(e.target.value)} /><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowEndContractModal(false)}>Cancel</Button><Button onClick={() => handleRequestEndContract(endReason, endType)} disabled={!endReason}>Send Request</Button></div></div></div>}
      {showRejectEndModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6"><h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Reject Request</h3><p className="text-sm text-slate-600 dark:text-slate-400 mb-4">State why you are rejecting the request to end the contract.</p><textarea className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 mb-4 dark:text-white" rows={3} placeholder="Reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowRejectEndModal(false)}>Cancel</Button><Button onClick={() => handleResolveEndRequest(false)} disabled={!rejectionReason}>Reject</Button></div></div></div>}
    </div>
  );
};

export default ContractDetail;