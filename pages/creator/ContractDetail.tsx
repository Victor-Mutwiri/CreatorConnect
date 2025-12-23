
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Clock, FileText, Send, 
  CheckCircle, XCircle, RefreshCw, MessageCircle, Paperclip, Shield, Info, AlertTriangle, Star,
  Smartphone, Building, Bitcoin, Lock, Flag, Loader, Upload, Eye, ExternalLink, HelpCircle,
  Plus, Trash2, Calculator, ChevronDown, ChevronUp, ShieldAlert, Wand2, Divide, Handshake
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { mockAuth } from '../../services/mockAuth';
import { Contract, ContractStatus, Message, ContractTerms, User, MilestoneStatus, Milestone, ContractPaymentType } from '../../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  
  // New Modals for Trust & Verification
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState<string | null>(null); // holds milestone ID
  const [showPaymentProofModal, setShowPaymentProofModal] = useState<string | null>(null); // holds milestone ID
  const [showReviewWorkModal, setShowReviewWorkModal] = useState<Milestone | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState<string | null>(null); // holds milestone ID
  const [showResolveDisputeModal, setShowResolveDisputeModal] = useState<string | null>(null); // holds milestone ID for mutual resolution
  
  // Stress Test / Warning Modals
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
  const [proofImage, setProofImage] = useState<string>(''); // Simulating image URL/Base64
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');

  // Review State (Client)
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
  
  const [customSplitCount, setCustomSplitCount] = useState(6); // Default for custom input

  // REVISION HELPER
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
          // Initialize counter terms with current contract terms
          setCounterTerms(JSON.parse(JSON.stringify(c.terms)));
          // Fetch creator details for payment info
          const cUser = await mockAuth.getCreatorProfile(c.creatorId);
          setCreatorUser(cUser);
        }
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, user]);

  // Check for auto-open review modal from navigation state
  useEffect(() => {
    if (location.state && (location.state as any).openReview && !loading && contract) {
       // Only open if valid
       const isCompleted = contract.status === ContractStatus.COMPLETED;
       const isCreator = user?.id === contract.creatorId;
       const hasReviewed = isCreator ? contract.isCreatorReviewed : contract.isClientReviewed;
       
       if (isCompleted && !hasReviewed) {
         setShowRatingModal(true);
         // Clear state to prevent reopening on refresh (optional, but good practice)
         window.history.replaceState({}, document.title);
       }
    }
  }, [location, loading, contract, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recalculate amount if milestones change in counter offer
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

  const handleCounterOffer = async () => {
    if (!contract || !user) return;
    
    // Final check for empty milestones if type is milestone
    if (counterTerms.paymentType === 'MILESTONE' && (!counterTerms.milestones || counterTerms.milestones.length === 0)) {
       alert("Please add at least one milestone.");
       return;
    }

    try {
      // Ensure milestones have proper IDs if they are new
      const sanitizedTerms = { ...counterTerms };
      if (sanitizedTerms.paymentType === 'MILESTONE' && sanitizedTerms.milestones) {
         sanitizedTerms.milestones = sanitizedTerms.milestones.map((m, idx) => ({
            ...m,
            id: m.id || `ms-new-${Date.now()}-${idx}`,
            status: 'PENDING', // Reset status for new negotiation
            revisionsUsed: m.revisionsUsed || 0
         }));
      } else {
        // FIXED Contract Logic:
        // Automatically generate/regenerate the single "Project Deliverable" milestone 
        // to ensure the work submission flow exists.
        sanitizedTerms.milestones = [{
          id: `ms-${Date.now()}-fixed`,
          title: 'Complete Project Delivery',
          description: 'Final delivery of all agreed items.',
          amount: sanitizedTerms.amount, // Ensure milestone amount matches total contract value
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

  // --- Counter Offer Helper Functions ---
  
  // SMART SPLIT LOGIC
  const handleAutoDistribute = (count: number) => {
    if (counterTerms.amount <= 0) {
       alert("Please ensure Total Amount is set before splitting.");
       return;
    }

    const total = counterTerms.amount;
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
       // If switching TO Milestone, pre-populate with 3 milestones using smart split
       // This prevents the user from seeing a 100% Milestone 1 error immediately.
       
       const total = counterTerms.amount;
       if (total > 0) {
         // Manual Smart Split for 3
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
         setCounterTerms(prev => ({
            ...prev,
            paymentType: type,
            milestones: []
         }));
       }
     } else {
       setCounterTerms(prev => ({
          ...prev,
          paymentType: type,
          milestones: []
       }));
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
     setCounterTerms(prev => ({
        ...prev,
        milestones: [...(prev.milestones || []), newMs]
     }));
  };

  const removeCounterMilestone = (index: number) => {
     if (!counterTerms.milestones) return;
     const newMilestones = counterTerms.milestones.filter((_, i) => i !== index);
     setCounterTerms(prev => ({ ...prev, milestones: newMilestones }));
  };

  // 30% Rule Validation for Counter Offer
  const firstMilestoneAmount = counterTerms.milestones?.[0]?.amount || 0;
  const thirtyPercentLimit = counterTerms.amount * 0.30;
  const isFirstMilestoneTooHigh = counterTerms.paymentType === 'MILESTONE' && counterTerms.amount > 0 && firstMilestoneAmount > thirtyPercentLimit;


  // --- Trust & Verification Handlers ---

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
              type: 'link', // Simplified for mock
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
    // Simulate upload
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
       if(showReviewWorkModal) setShowReviewWorkModal(null); // Close review modal if opened from there
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

  // Mutual Dispute Resolution Handlers
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

  // --- End Trust Handlers ---

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

  // --- TAX LOGIC ---
  const handleGrossUp = () => {
    if (!contract) return;
    
    const rate = taxResidency === 'resident' ? 0.05 : 0.20;
    const multiplier = 1 / (1 - rate);
    
    // Calculate new Gross Amount
    const currentAmount = contract.terms.amount;
    const newGrossAmount = Math.ceil(currentAmount * multiplier);
    
    // Create a deep copy for counter terms
    const newTerms = JSON.parse(JSON.stringify(contract.terms));
    newTerms.amount = newGrossAmount;

    // If Milestone, gross up EACH milestone
    if (newTerms.paymentType === 'MILESTONE' && newTerms.milestones) {
       newTerms.milestones = newTerms.milestones.map((m: Milestone) => ({
         ...m,
         amount: Math.ceil(m.amount * multiplier)
       }));
       // Recalculate total from milestones to be precise
       newTerms.amount = newTerms.milestones.reduce((sum: number, m: Milestone) => sum + m.amount, 0);
    }

    setCounterTerms(newTerms);
    setShowCounterModal(true);
  };

  if (loading) return <div className="p-20 text-center dark:text-white">Loading...</div>;
  if (!contract) return <div className="p-20 text-center dark:text-white">Contract not found</div>;

  const isPending = [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(contract.status);
  const isActive = [ContractStatus.ACTIVE, ContractStatus.ACCEPTED].includes(contract.status);
  const isCompleted = contract.status === ContractStatus.COMPLETED;
  
  const lastHistoryItem = contract.history[contract.history.length - 1];
  const isCreator = user?.id === contract.creatorId;
  const isClientViewer = user?.id === contract.clientId;

  // Check if any milestone is currently disputed
  const hasActiveDispute = contract.terms.milestones?.some(m => m.status === 'DISPUTED');
  const pendingEndRequest = contract.endRequest?.status === 'pending';

  // --- NEW: Client Termination Rules ---
  let clientEndRestriction = "";
  if (isClientViewer && isActive) {
    // Rule 2: Prevent if first milestone is unpaid (Milestone Contracts only)
    if (contract.terms.paymentType === 'MILESTONE') {
        const m1 = contract.terms.milestones?.[0];
        if (m1 && m1.status !== 'PAID' && m1.status !== 'CANCELLED') {
            clientEndRestriction = "Action blocked: Milestone 1 must be paid to ensure commitment.";
        }
    }
    
    // Rule 3: Prevent if creator has submitted work (Review pending)
    const hasPendingWork = contract.terms.milestones?.some(m => 
        ['UNDER_REVIEW', 'PAYMENT_VERIFY'].includes(m.status)
    );
    if (hasPendingWork) {
        clientEndRestriction = "Action blocked: Please review submitted work first.";
    }
  }

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
     
     const isFixedContract = contract.terms.paymentType === 'FIXED';
     const revisionLimit = getRevisionLimit(contract.terms.revisionPolicy);

     return (
       <div className="space-y-4 mt-6">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
               <Flag size={20} className="mr-2 text-brand-600" /> 
               {isFixedContract ? 'Project Deliverable' : 'Milestones'}
            </h3>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
               Policy: {contract.terms.revisionPolicy}
            </span>
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
               
               // Mutual Dispute Resolution State
               const hasPendingResolution = !!ms.disputeResolution;
               const iProposedResolution = ms.disputeResolution?.requestedBy === user?.id;

               return (
                  <div key={ms.id} className={`relative p-5 rounded-xl border ${
                     isInProgress || isReview || isPaymentVerify
                        ? 'bg-white dark:bg-slate-900 border-brand-200 dark:border-brand-900 shadow-md ring-1 ring-brand-500/30' 
                        : isPaid 
                           ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                           : isDisputed
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : isCancelled 
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50 grayscale'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70'
                  }`}>
                     {/* Timeline Node */}
                     <div className={`absolute -left-[41px] top-6 w-6 h-6 rounded-full border-4 flex items-center justify-center ${
                       isPaid ? 'bg-green-500 border-green-100 dark:border-green-900' : 
                       isDisputed ? 'bg-red-500 border-red-100 dark:border-red-900' :
                       isCancelled ? 'bg-slate-200 border-slate-100 dark:bg-slate-800 dark:border-slate-700' :
                       (isInProgress || isReview || isPaymentVerify) ? 'bg-brand-500 border-brand-100 dark:border-brand-900' : 
                       'bg-slate-300 border-slate-100 dark:bg-slate-700 dark:border-slate-800'
                     }`}>
                        {isPaid && <CheckCircle size={12} className="text-white" />}
                        {isLocked && <Lock size={10} className="text-slate-500" />}
                        {isDisputed && <XCircle size={12} className="text-white" />}
                        {isCancelled && <XCircle size={12} className="text-slate-400" />}
                        {(isInProgress || isReview || isPaymentVerify) && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                     </div>

                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-lg ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{ms.title}</h4>
                              {usedRevisions > 0 && (
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                   REV #{usedRevisions}
                                </span>
                              )}
                           </div>
                           <p className="text-sm text-slate-500 dark:text-slate-400">{ms.description}</p>
                        </div>
                        <div className="text-right">
                           <div className={`font-bold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{contract.terms.currency} {ms.amount.toLocaleString()}</div>
                           <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              isPaid ? 'bg-green-100 text-green-700' :
                              isReview ? 'bg-orange-100 text-orange-700' :
                              isPaymentVerify ? 'bg-purple-100 text-purple-700' :
                              isDisputed ? 'bg-red-100 text-red-700' :
                              isInProgress ? 'bg-brand-100 text-brand-700' : 
                              isCancelled ? 'bg-slate-200 text-slate-500' : 'bg-slate-200 text-slate-600'
                           }`}>
                              {ms.status.replace('_', ' ')}
                           </span>
                        </div>
                     </div>
                     
                     {/* Revision Notes if any */}
                     {ms.revisionNotes && isInProgress && (
                        <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50 text-sm">
                           <p className="font-bold text-yellow-800 dark:text-yellow-500 text-xs uppercase mb-1">Changes Requested:</p>
                           <p className="text-slate-700 dark:text-slate-300 italic">"{ms.revisionNotes}"</p>
                        </div>
                     )}

                     {/* Actions */}
                     {isActive && !isCancelled && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                           
                           {/* CREATOR ACTIONS */}
                           {isCreator && (
                              <div className="flex justify-between items-center">
                                 {/* Last Resort Dispute for Creator */}
                                 {(isInProgress || isReview) && (
                                   <button 
                                      onClick={() => setShowDisputeModal(ms.id)}
                                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center"
                                   >
                                      <ShieldAlert size={14} className="mr-1" /> Dispute Milestone
                                   </button>
                                 )}
                                 
                                 <div className="flex justify-end gap-2 ml-auto">
                                    {isInProgress && (
                                       // Rule 1: Prevent submission if active end request
                                       pendingEndRequest ? (
                                       <span className="text-xs text-red-600 dark:text-red-400 flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded font-medium border border-red-200 dark:border-red-800">
                                          <AlertTriangle size={12} className="mr-1" /> Action Blocked: End Request Pending
                                       </span>
                                       ) : (
                                       <Button size="sm" onClick={() => setShowSubmitWorkModal(ms.id)}>
                                          <Upload size={16} className="mr-2" /> Submit Work
                                       </Button>
                                       )
                                    )}
                                    {isPaymentVerify && (
                                       <div className="flex flex-col items-end w-full">
                                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800 mb-3 w-full">
                                             <p className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2">Client has sent payment.</p>
                                             {ms.paymentProof && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                                                   <Eye size={14} /> 
                                                   <a href={ms.paymentProof.content} target="_blank" rel="noreferrer" className="hover:underline text-blue-500">View Proof</a>
                                                   <span className="text-slate-300">|</span>
                                                   <span>Method: {ms.paymentProof.method}</span>
                                                </div>
                                             )}
                                          </div>
                                          <div className="flex gap-2">
                                             <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDisputeModal(ms.id)}>
                                                Dispute Payment
                                             </Button>
                                             <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmPayment(ms.id)}>
                                                Confirm Receipt
                                             </Button>
                                          </div>
                                       </div>
                                    )}
                                    {isReview && <span className="text-xs text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded"><Clock size={12} className="mr-1"/> Waiting for client approval</span>}
                                 </div>
                              </div>
                           )}

                           {/* CLIENT ACTIONS */}
                           {isClientViewer && (
                              <div className="w-full">
                                 {isReview && (
                                    <div className="w-full">
                                       <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-800 mb-3">
                                          <div className="flex justify-between items-start">
                                             <div>
                                                <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Review Submission</p>
                                                {/* REVISION TRACKER UI */}
                                                <div className="flex items-center mt-1">
                                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${revisionsLeft <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                      {revisionLimit === Infinity ? 'Unlimited Revisions' : `${revisionsLeft} Revisions Remaining`}
                                                   </span>
                                                </div>
                                             </div>
                                             <div className="text-xs text-orange-600 flex items-center">
                                                <Clock size={12} className="mr-1" /> Auto-approves in 71h 59m
                                             </div>
                                          </div>
                                          {ms.submission && (
                                             <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-sm mt-3">
                                                <p className="font-semibold text-slate-900 dark:text-white mb-1">Creator Note:</p>
                                                <p className="text-slate-600 dark:text-slate-400 mb-2 italic">"{ms.submission.note}"</p>
                                                <a href={ms.submission.content} target="_blank" rel="noreferrer" className="inline-flex items-center text-brand-600 hover:underline">
                                                   <ExternalLink size={14} className="mr-1" /> View Work
                                                </a>
                                             </div>
                                          )}
                                       </div>
                                       <div className="flex justify-end gap-2 items-center">
                                          {revisionsLeft > 0 ? (
                                             <Button size="sm" variant="outline" onClick={() => setShowReviewWorkModal(ms)}>Request Changes</Button>
                                          ) : (
                                             <button 
                                                onClick={() => setShowDisputeModal(ms.id)}
                                                className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-full hover:bg-red-50 flex items-center transition-colors"
                                             >
                                                <ShieldAlert size={14} className="mr-1.5" /> Raise Quality Dispute
                                             </button>
                                          )}
                                          <Button size="sm" onClick={() => setShowPaymentProofModal(ms.id)}>
                                             Approve & Pay
                                          </Button>
                                       </div>
                                    </div>
                                 )}
                                 {isInProgress && <span className="text-xs text-brand-600 flex items-center bg-brand-50 px-2 py-1 rounded"><Loader size={12} className="mr-1 animate-spin"/> Creator is working on this</span>}
                                 {isPaymentVerify && <span className="text-xs text-purple-600 flex items-center bg-purple-50 px-2 py-1 rounded"><Clock size={12} className="mr-1"/> Waiting for creator to confirm payment</span>}
                              </div>
                           )}
                           
                           {/* COMMON: Disputed Status Logic */}
                           {isDisputed && (
                              <div className="w-full bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                 <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-red-800 dark:text-red-400 text-sm flex items-center">
                                       <AlertTriangle size={16} className="mr-2" /> Dispute Raised
                                    </p>
                                    {!hasPendingResolution && (
                                      <button 
                                        onClick={() => setShowResolveDisputeModal(ms.id)}
                                        className="text-xs flex items-center text-blue-600 dark:text-blue-400 hover:underline font-bold"
                                      >
                                        <Handshake size={14} className="mr-1" /> Resolve Amicably
                                      </button>
                                    )}
                                 </div>
                                 <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    Reason: {ms.disputeReason}
                                 </p>
                                 
                                 {/* Resolution Status Banner */}
                                 {hasPendingResolution && (
                                    <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900/50 animate-in fade-in">
                                       <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Proposed Resolution</p>
                                       <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                                          <span className="font-bold">{ms.disputeResolution?.requestedByName}</span> suggests: 
                                          <span className="italic"> "{ms.disputeResolution?.message}"</span>
                                       </p>
                                       <div className="flex items-center justify-between">
                                          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                             Action: {ms.disputeResolution?.type === 'RESUME_WORK' ? 'Resume Work' : 'Retry Payment'}
                                          </span>
                                          {iProposedResolution ? (
                                             <span className="text-xs text-slate-500 italic flex items-center"><Clock size={12} className="mr-1"/> Waiting for response</span>
                                          ) : (
                                             <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => handleAcceptResolution(ms.id)}>
                                                Accept Resolution
                                             </Button>
                                          )}
                                       </div>
                                    </div>
                                 )}

                                 {!hasPendingResolution && (
                                    <p className="text-xs text-slate-500 mt-2">Support team has been notified. Try resolving amicably to avoid penalties.</p>
                                 )}
                              </div>
                           )}

                           {isLocked && <span className="text-xs text-slate-400 italic flex items-center"><Lock size={12} className="mr-1"/> Locked until previous milestone is paid</span>}
                        </div>
                     )}
                  </div>
               )
            })}
         </div>
       </div>
     );
  };

  // Render Tax Module
  const renderTaxModule = () => {
    if (!contract || !isCreator || !isPending) return null;

    const grossAmount = contract.terms.amount;
    const taxRate = taxResidency === 'resident' ? 0.05 : 0.20;
    const estimatedTax = grossAmount * taxRate;
    const estimatedTakeHome = grossAmount - estimatedTax;

    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div 
          className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer"
          onClick={() => setShowTaxDetails(!showTaxDetails)}
        >
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
            <Calculator size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            Tax Awareness & Planning
          </h3>
          <button className="text-slate-500 dark:text-slate-400">
            {showTaxDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showTaxDetails && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Residency Status:</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setTaxResidency('resident')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    taxResidency === 'resident'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Resident (5%)
                </button>
                <button
                  onClick={() => setTaxResidency('non-resident')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    taxResidency === 'non-resident'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Non-Resident (20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Offer Amount</p>
                <p className="font-bold text-slate-900 dark:text-white">{contract.terms.currency} {grossAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Withholding Tax</p>
                <p className="font-bold text-slate-600 dark:text-slate-400">{contract.terms.currency} {estimatedTax.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 mb-1">Est. Take-home</p>
                <p className="font-bold text-green-800 dark:text-green-400">{contract.terms.currency} {estimatedTakeHome.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-6 flex items-start">
              <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Disclaimer:</strong> Ubuni Connect does not deduct or remit taxes. This tool is for your personal financial planning only. You are responsible for filing your own taxes with KRA.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-2"
                onClick={() => setShowTaxDetails(false)}
              >
                Accept Estimate
              </button>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white dark:bg-slate-900"
                onClick={handleGrossUp}
              >
                Adjust Price to Maintain Take-home
              </Button>
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
                  contract.status === ContractStatus.CANCELLED ? 'bg-red-100 text-red-700' :
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

            {/* Always render milestones logic because we now auto-create a single milestone for FIXED contracts */}
            {renderMilestones()}

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

          {/* --- TAX AWARENESS MODULE --- */}
          {renderTaxModule()}

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
            <div className={`sticky bottom-4 z-10 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border ${hasActiveDispute || clientEndRestriction ? 'border-red-200 dark:border-red-800 ring-2 ring-red-100 dark:ring-red-900/20' : 'border-slate-200 dark:border-slate-800'} flex items-center justify-between animate-in slide-in-from-bottom-4`}>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Active Contract</p>
                {hasActiveDispute ? (
                   <p className="text-xs text-red-500 font-medium flex items-center mt-1">
                     <AlertTriangle size={12} className="mr-1" /> Action blocked: Active dispute detected.
                   </p>
                ) : clientEndRestriction ? (
                   <p className="text-xs text-red-500 font-medium flex items-center mt-1">
                     <Lock size={12} className="mr-1" /> {clientEndRestriction}
                   </p>
                ) : (
                   <p className="text-xs text-slate-500 dark:text-slate-400">Project is currently in progress.</p>
                )}
              </div>
              
              {hasActiveDispute || clientEndRestriction ? (
                <button 
                  disabled
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-medium rounded-lg cursor-not-allowed flex items-center"
                >
                  <Lock size={16} className="mr-2" /> End Contract
                </button>
              ) : (
                <button 
                  onClick={() => setShowEndContractModal(true)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  End Contract
                </button>
              )}
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
                      {item.action === 'dispute_resolved_amicably' && 'Dispute Resolved Amicably'}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      by {item.actorName}
                    </span>
                    {item.note && (
                      <p className="mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 italic">
                        "{item.note}"
                      </p>
                    )}
                    {item.attachment && (
                       <a href={item.attachment} target="_blank" rel="noreferrer" className="mt-2 text-xs text-brand-600 dark:text-brand-400 flex items-center hover:underline">
                          <Paperclip size={12} className="mr-1" /> View Attachment
                       </a>
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

      {/* --- MODALS --- */}

      {/* 1. Submit Work Modal */}
      {showSubmitWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Submit Work for Review</h3>
                <button onClick={() => setShowSubmitWorkModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-slate-600 dark:text-slate-400">
                    Provide a link to your work (Google Drive, Dropbox, etc.) or describe what you've done.
                 </p>
                 <Input 
                   label="Work Link / URL"
                   placeholder="https://..."
                   value={workLink}
                   onChange={(e) => setWorkLink(e.target.value)}
                 />
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Description</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:text-white"
                      rows={3}
                      placeholder="I've completed the video edits..."
                      value={workNote}
                      onChange={(e) => setWorkNote(e.target.value)}
                   />
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowSubmitWorkModal(null)}>Cancel</Button>
                 {/* Change: Open Warning Modal instead of direct submit */}
                 <Button onClick={() => setShowSubmitWarning(true)} disabled={!workLink && !workNote}>Submit Work</Button>
              </div>
           </div>
        </div>
      )}

      {/* 2. Review Work Modal (Client Request Changes) */}
      {showReviewWorkModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Request Changes</h3>
                <button onClick={() => setShowReviewWorkModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-slate-600 dark:text-slate-400">
                    Please explain clearly what needs to be changed. 
                    <span className="block font-bold text-orange-600 mt-1">This will consume 1 of your agreed revisions.</span>
                 </p>
                 <textarea 
                   className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:bg-slate-800 dark:text-white"
                   rows={4}
                   placeholder="The logo is too small in the intro..."
                   value={revisionNote}
                   onChange={(e) => setRevisionNote(e.target.value)}
                 />
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowReviewWorkModal(null)}>Cancel</Button>
                 <Button onClick={() => handleRequestChanges(showReviewWorkModal.id)} disabled={!revisionNote}>Request Changes</Button>
              </div>
           </div>
        </div>
      )}

      {/* 3. Payment Proof Modal */}
      {showPaymentProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Upload Payment Proof</h3>
                <button onClick={() => setShowPaymentProofModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                    Please send the payment using the details provided, then upload the screenshot here.
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method Used</label>
                    <select 
                       className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:bg-slate-800 dark:text-white"
                       value={paymentMethod}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                       <option>M-Pesa</option>
                       <option>Bank Transfer</option>
                       <option>Crypto</option>
                    </select>
                 </div>

                 {/* Simulated Upload */}
                 <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setProofImage("https://via.placeholder.com/300x400?text=Payment+Proof")}
                 >
                    {proofImage ? (
                       <div className="relative">
                          <img src={proofImage} alt="Proof" className="mx-auto h-32 object-contain rounded" />
                          <p className="text-xs text-green-600 mt-2 font-bold">Image Selected</p>
                       </div>
                    ) : (
                       <>
                          <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Click to upload screenshot</p>
                       </>
                    )}
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowPaymentProofModal(null)}>Cancel</Button>
                 {/* Change: Open Warning Modal instead of direct submit */}
                 <Button onClick={() => setShowPaymentWarning(true)} disabled={!proofImage}>Send Verification</Button>
              </div>
           </div>
        </div>
      )}

      {/* 4. Dispute Modal */}
      {showDisputeModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                <h3 className="font-bold text-lg text-red-900 dark:text-red-400 flex items-center">
                   <AlertTriangle className="mr-2" size={20}/> Raise Dispute
                </h3>
                <button onClick={() => { setShowDisputeModal(null); setTriedChatting(false); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Disputes should be a last resort. Our support team will review the evidence provided by both parties.
                 </p>

                 {/* Last Resort Warning for Clients out of revisions */}
                 {isClientViewer && getRevisionLimit(contract?.terms.revisionPolicy) <= (contract?.terms.milestones?.find(m => m.id === showDisputeModal)?.revisionsUsed || 0) && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                       <p className="text-xs text-orange-800 dark:text-orange-300">
                         <strong>Policy Notice:</strong> You have used all agreed revisions. This dispute will be reviewed by Ubuni Support. If found to be in bad faith or an attempt to bypass the revision limit, your **Trust Score** will be penalized.
                       </p>
                    </div>
                 )}

                 {/* Amicable Resolution Check */}
                 <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${triedChatting ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    <input 
                       type="checkbox" 
                       id="amicableCheck"
                       className="mt-1 w-4 h-4 text-brand-600 rounded"
                       checked={triedChatting}
                       onChange={(e) => setTriedChatting(e.target.checked)}
                    />
                    <label htmlFor="amicableCheck" className="text-sm text-slate-700 dark:text-slate-300 leading-tight cursor-pointer">
                       I have attempted to resolve this disagreement amicably through the project discussion board first.
                    </label>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Reason for Dispute</label>
                    <textarea 
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-red-500 dark:bg-slate-800 dark:text-white"
                      rows={4}
                      placeholder={isCreator ? "e.g. Scope creep - client is asking for work not in contract..." : "e.g. Quality issue - deliverable does not match requirements..."}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => { setShowDisputeModal(null); setTriedChatting(false); }}>Cancel</Button>
                 {/* Change: Open Warning Modal instead of direct submit */}
                 <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowDisputeWarning(true)} disabled={!disputeReason || !triedChatting}>Submit Dispute</Button>
              </div>
           </div>
        </div>
      )}

      {/* 5. Mutual Dispute Resolution Modal */}
      {showResolveDisputeModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-800">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300 flex items-center">
                   <Handshake className="mr-2" size={20}/> Resolve Amicably
                </h3>
                <button onClick={() => setShowResolveDisputeModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                 {/* Strategic Warning */}
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start">
                       <HelpCircle className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" size={18} />
                       <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                          It is in your best interest to resolve this dispute together. If Support intervenes, the liable party may face <strong>Trust Score penalties</strong> or <strong>account suspension</strong>.
                       </p>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proposed Solution</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                       <button
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${resolutionType === 'RESUME_WORK' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                          onClick={() => setResolutionType('RESUME_WORK')}
                       >
                          Resume Work / Fixes
                       </button>
                       <button
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${resolutionType === 'RETRY_PAYMENT' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                          onClick={() => setResolutionType('RETRY_PAYMENT')}
                       >
                          Retry Payment
                       </button>
                    </div>
                    <textarea 
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-brand-500 dark:bg-slate-800 dark:text-white text-sm"
                      rows={3}
                      placeholder="e.g. I will edit the video as requested, please accept to unlock status..."
                      value={resolutionMessage}
                      onChange={(e) => setResolutionMessage(e.target.value)}
                    />
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowResolveDisputeModal(null)}>Cancel</Button>
                 <Button onClick={handleProposeResolution} disabled={!resolutionMessage}>Send Proposal</Button>
              </div>
           </div>
        </div>
      )}

      {/* --- NEW STRESS TEST / WARNING MODALS --- */}

      {/* A. Submit Work Warning */}
      {showSubmitWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in zoom-in-95">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-orange-200 dark:border-orange-800">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                    <ShieldAlert size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Confirm Submission</h3>
                 <div className="text-left bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                       By clicking confirm, you certify that the work for this milestone has been completed as per the requirements. 
                       <br/><br/>
                       <span className="font-bold text-orange-800 dark:text-orange-400">Warning:</span> Attempting to collect funds under false pretenses constitutes fraud and may result in immediate account suspension and legal action.
                    </p>
                 </div>
                 <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setShowSubmitWarning(false)}>Back</Button>
                    <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSubmitWork}>I Confirm</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* B. Payment Proof Warning */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in zoom-in-95">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-800">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <ShieldAlert size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Confirm Payment</h3>
                 <div className="text-left bg-blue-50 bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                       You are about to mark this milestone as paid. Please ensure the attached proof is authentic.
                       <br/><br/>
                       <span className="font-bold text-blue-800 dark:text-blue-400">Warning:</span> Submitting fake transaction details is a serious offense punishable by law. This action cannot be undone; incorrect submissions will result in a dispute process.
                    </p>
                 </div>
                 <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setShowPaymentWarning(false)}>Back</Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmitPaymentProof}>Confirm Payment</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* C. Dispute Warning */}
      {showDisputeWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in zoom-in-95">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-red-200 dark:border-red-800">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Raise Payment Dispute?</h3>
                 <div className="text-left bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/30 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                       Disputing a project triggers a formal investigation by our Support Team. This action cannot be undone.
                       <br/><br/>
                       <span className="font-bold text-red-800 dark:text-red-400">Warning:</span> If it is determined that this dispute was raised in bad faith (e.g. to avoid payment or bypass revision limits), you will face penalties including **Trust Score reduction** or account ban.
                    </p>
                 </div>
                 <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setShowDisputeWarning(false)}>Back</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleRaiseDispute}>Raise Dispute</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Propose Counter Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Contract Type Selector */}
              <div className="grid grid-cols-2 gap-4">
                 <button
                   onClick={() => toggleCounterPaymentType('FIXED')}
                   className={`p-4 rounded-xl border text-center transition-all ${
                     counterTerms.paymentType === 'FIXED'
                       ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500'
                       : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                    <DollarSign className="mx-auto mb-2" size={24} />
                    <div className="font-bold">Fixed Contract</div>
                 </button>
                 <button
                   onClick={() => toggleCounterPaymentType('MILESTONE')}
                   className={`p-4 rounded-xl border text-center transition-all ${
                     counterTerms.paymentType === 'MILESTONE'
                       ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500'
                       : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                    <Flag className="mx-auto mb-2" size={24} />
                    <div className="font-bold">Milestone Contract</div>
                 </button>
              </div>

              {counterTerms.paymentType === 'FIXED' ? (
                // Fixed Contract Fields
                <Input 
                  label="Total Amount (KES)"
                  type="number"
                  value={counterTerms.amount}
                  onChange={(e) => setCounterTerms({...counterTerms, amount: parseInt(e.target.value)})}
                />
              ) : (
                // Milestone Builder
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Milestones</label>
                    <span className="text-sm font-bold text-brand-600">Total: KES {counterTerms.amount.toLocaleString()}</span>
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

                  {counterTerms.milestones?.map((ms, idx) => {
                     // Check 30% rule for first milestone
                     const isViolation = idx === 0 && isFirstMilestoneTooHigh;

                     return (
                      <div key={idx} className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${isViolation ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center justify-center bg-white dark:bg-slate-900 w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 font-bold text-slate-500 text-sm flex-shrink-0 mt-2">
                           {idx + 1}
                         </div>
                         <div className="flex-1 w-full space-y-3">
                            <div className="flex flex-col md:flex-row gap-4">
                               <Input 
                                 label="Milestone Title"
                                 value={ms.title}
                                 onChange={(e) => updateCounterMilestone(idx, 'title', e.target.value)}
                               />
                               <Input 
                                 label="Amount (KES)"
                                 type="number"
                                 value={ms.amount || ''}
                                 onChange={(e) => updateCounterMilestone(idx, 'amount', Number(e.target.value))}
                               />
                            </div>
                            <Input 
                               label="Description"
                               value={ms.description}
                               onChange={(e) => updateCounterMilestone(idx, 'description', e.target.value)}
                            />
                             {isViolation && (
                                <p className="text-xs text-amber-600 font-bold">
                                  Amount exceeds 30% limit for the first milestone. Max allowed: KES {thirtyPercentLimit.toLocaleString()}
                                </p>
                              )}
                         </div>
                         <button 
                            onClick={() => removeCounterMilestone(idx)}
                            className="text-slate-400 hover:text-red-500 p-2 mt-2"
                         >
                            <Trash2 size={20} />
                         </button>
                      </div>
                     );
                  })}

                  <button 
                      onClick={addCounterMilestone}
                      className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700 mt-2"
                   >
                      <Plus size={16} className="mr-1" /> Add Milestone
                   </button>
                   
                   {/* Rule Explanation */}
                   <div className={`mt-4 p-4 rounded-lg border ${isFirstMilestoneTooHigh ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start">
                         <ShieldAlert className={`mr-2 mt-0.5 ${isFirstMilestoneTooHigh ? 'text-amber-600' : 'text-blue-600'}`} size={20} />
                         <div>
                            <p className={`text-sm font-bold ${isFirstMilestoneTooHigh ? 'text-amber-800 dark:text-amber-400' : 'text-blue-800 dark:text-blue-400'}`}>
                               Fair Play Protection: 30% Rule
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                               Work on Milestone 1 must not exceed 30% of total contract value.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

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
              <Button onClick={handleCounterOffer} disabled={isFirstMilestoneTooHigh}>Submit Proposal</Button>
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
