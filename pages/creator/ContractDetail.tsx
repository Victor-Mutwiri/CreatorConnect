import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Clock, FileText, Send, 
  CheckCircle, XCircle, RefreshCw, MessageCircle, Paperclip, Shield, Info, AlertTriangle, Star,
  Smartphone, Building, Bitcoin, Lock, Flag, Loader, Upload, Eye, ExternalLink, HelpCircle,
  Plus, Trash2, Calculator, ChevronDown, ChevronUp, ShieldAlert, Wand2, Divide, Handshake
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import FileUpload from '../../components/FileUpload';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { Contract, ContractStatus, Message, ContractTerms, User, MilestoneStatus, Milestone, ContractPaymentType, Review } from '../../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEndContractModal, setShowEndContractModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRejectEndModal, setShowRejectEndModal] = useState(false); // For rejecting end request
  
  // Submission & Dispute Modals
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState<string | null>(null); // holds milestone ID or 'FIXED'
  const [showDisputeModal, setShowDisputeModal] = useState<string | null>(null); // holds milestone ID or 'FIXED'
  
  // Form states for modals
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [endReason, setEndReason] = useState('');
  const [endType, setEndType] = useState<'completion' | 'termination'>('completion');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Rating
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (id && user) {
        const c = await mockContractService.getContractById(id);
        const m = await mockContractService.getMessages(id);
        setContract(c);
        setMessages(m);
      }
      setLoading(false);
    };
    fetchData();
    // Poll for updates (simplified for mock)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id, user]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !contract || !user) return;
    await mockContractService.sendMessage(contract.id, user.id, user.name, newMessage);
    setNewMessage('');
    // Refresh messages immediately
    const m = await mockContractService.getMessages(contract.id);
    setMessages(m);
  };

  const handleStatusChange = async (status: ContractStatus) => {
    if (!contract || !user) return;
    await mockContractService.updateContractStatus(contract.id, status, user.id, user.name);
    // Refresh
    const c = await mockContractService.getContractById(contract.id);
    setContract(c);
  };
  
  const handleSubmitWork = async () => {
    if (!contract || !user || !showSubmitWorkModal) return;
    
    // In a real app, we would upload files here. 
    // Mock: Use file name or placeholder URL
    const content = submissionFiles.length > 0 ? submissionFiles.map(f => f.name).join(', ') : 'Link to work';
    
    if (showSubmitWorkModal === 'FIXED') {
       await mockContractService.updateContractStatus(
         contract.id, 
         ContractStatus.UNDER_REVIEW, 
         user.id, 
         user.name, 
         undefined, 
         { submission: { type: 'file', content, note: submissionNote, date: new Date().toISOString() } }
       );
    } else {
       // Milestone
       await mockContractService.updateMilestoneStatus(
         contract.id, 
         showSubmitWorkModal, 
         'UNDER_REVIEW', 
         user.id, 
         user.name, 
         { submission: { type: 'file', content, note: submissionNote, date: new Date().toISOString() } }
       );
    }
    
    setShowSubmitWorkModal(null);
    setSubmissionNote('');
    setSubmissionFiles([]);
    
    const c = await mockContractService.getContractById(contract.id);
    setContract(c);
  };

  const handleDispute = async () => {
      if (!contract || !user || !showDisputeModal) return;

      if (showDisputeModal === 'FIXED') {
          await mockContractService.updateContractStatus(
              contract.id,
              ContractStatus.DISPUTED,
              user.id,
              user.name,
              undefined,
              { disputeReason }
          );
      } else {
          await mockContractService.updateMilestoneStatus(
              contract.id,
              showDisputeModal,
              'DISPUTED',
              user.id,
              user.name,
              { disputeReason }
          );
      }
      setShowDisputeModal(null);
      setDisputeReason('');
      const c = await mockContractService.getContractById(contract.id);
      setContract(c);
  };

  const handleRequestEndContract = async () => {
    if (!contract || !user) return;
    await mockContractService.requestEndContract(contract.id, user.id, user.name, endReason, endType);
    setShowEndContractModal(false);
    const c = await mockContractService.getContractById(contract.id);
    setContract(c);
  };
  
  const handleResolveEndRequest = async (approved: boolean) => {
    if (!contract || !user) return;
    await mockContractService.resolveEndContract(contract.id, approved, user.id, user.name, !approved ? rejectionReason : undefined);
    setShowRejectEndModal(false);
    setRejectionReason('');
    const c = await mockContractService.getContractById(contract.id);
    setContract(c);
  };

  const handleLeaveReview = async () => {
     if (!contract || !user) return;
     await mockContractService.leaveReview(contract.id, user.id, rating, undefined, reviewComment);
     setShowRatingModal(false);
     const c = await mockContractService.getContractById(contract.id);
     setContract(c);
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!contract || !user) return <div className="p-20 text-center">Contract not found</div>;

  const isCreator = user.id === contract.creatorId;
  const otherPartyName = isCreator ? contract.clientName : contract.creatorName;
  const isFixed = contract.terms.paymentType === 'FIXED';

  // Helper to render status badge
  const renderStatusBadge = (status: string) => {
    let color = 'bg-slate-100 text-slate-700';
    if (['ACTIVE', 'ACCEPTED', 'IN_PROGRESS'].includes(status)) color = 'bg-green-100 text-green-700';
    if (['COMPLETED', 'PAID'].includes(status)) color = 'bg-blue-100 text-blue-700';
    if (['DISPUTED', 'CANCELLED', 'DECLINED'].includes(status)) color = 'bg-red-100 text-red-700';
    if (['UNDER_REVIEW', 'PAYMENT_VERIFY'].includes(status)) color = 'bg-orange-100 text-orange-700';
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${color}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
         
         <div className="mb-6">
            <Link to="/creator/contracts" className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-4">
               <ArrowLeft size={16} className="mr-1" /> Back to Contracts
            </Link>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                     {contract.title}
                     {renderStatusBadge(contract.status)}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                     Contract #{contract.id.slice(-6)} • Created on {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
               </div>
               
               {/* Global Actions */}
               <div className="flex gap-2">
                  {contract.status === ContractStatus.SENT && isCreator && (
                     <>
                        <Button variant="outline" onClick={() => handleStatusChange(ContractStatus.DECLINED)} className="text-red-600 border-red-200 hover:bg-red-50">Decline</Button>
                        <Button onClick={() => handleStatusChange(ContractStatus.ACCEPTED)}>Accept Offer</Button>
                     </>
                  )}
                  {contract.status === ContractStatus.ACCEPTED && (
                      <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm font-medium border border-blue-200">
                         Contract Active. Work can begin.
                      </div>
                  )}
                  {(contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.ACCEPTED) && (
                     <Button variant="outline" onClick={() => setShowEndContractModal(true)} className="text-red-600 border-red-200 hover:bg-red-50">
                        End Contract
                     </Button>
                  )}
                  {contract.status === ContractStatus.COMPLETED && !contract.isCreatorReviewed && isCreator && (
                     <Button onClick={() => setShowRatingModal(true)}>Leave Review</Button>
                  )}
                  {contract.status === ContractStatus.COMPLETED && !contract.isClientReviewed && !isCreator && (
                     <Button onClick={() => setShowRatingModal(true)}>Leave Review</Button>
                  )}
               </div>
            </div>
         </div>

         <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Col: Contract Terms & Milestones */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* End Request Banner */}
               {contract.endRequest && contract.endRequest.status === 'pending' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                     <div className="flex items-start gap-4">
                        <AlertTriangle className="text-orange-600 flex-shrink-0" size={24} />
                        <div className="flex-1">
                           <h3 className="font-bold text-orange-900 dark:text-orange-300">
                              {contract.endRequest.type === 'completion' ? 'Completion' : 'Termination'} Requested
                           </h3>
                           <p className="text-sm text-orange-800 dark:text-orange-400 mt-1">
                              {contract.endRequest.requesterName} has requested to end this contract. <br/>
                              Reason: "{contract.endRequest.reason}"
                           </p>
                           {contract.endRequest.requesterId !== user.id && (
                              <div className="flex gap-3 mt-4">
                                 <Button size="sm" variant="outline" onClick={() => setShowRejectEndModal(true)} className="bg-white border-orange-300 text-orange-700 hover:bg-orange-50">Reject</Button>
                                 <Button size="sm" onClick={() => handleResolveEndRequest(true)} className="bg-orange-600 hover:bg-orange-700 text-white">Accept & End</Button>
                              </div>
                           )}
                           {contract.endRequest.requesterId === user.id && (
                              <p className="text-xs text-orange-700 mt-2 font-bold italic">Waiting for response...</p>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {/* Description */}
               <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Description</h3>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{contract.description}</p>
               </div>

               {/* Milestones / Deliverables */}
               <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                     <span>{isFixed ? 'Deliverables & Payment' : 'Milestones'}</span>
                     <span className="text-sm font-normal text-slate-500">Total: {contract.terms.currency} {contract.terms.amount.toLocaleString()}</span>
                  </h3>
                  
                  {isFixed ? (
                     <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-slate-700 dark:text-slate-200">Full Project Delivery</span>
                           {renderStatusBadge(contract.status)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                           One-time payment upon completion.
                        </p>
                        {isCreator && (contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.ACCEPTED) && (
                           <div className="flex gap-2">
                             <Button size="sm" onClick={() => setShowSubmitWorkModal('FIXED')}>Submit Work</Button>
                           </div>
                        )}
                        {contract.status === ContractStatus.UNDER_REVIEW && (
                           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded">
                              Work submitted. Waiting for client approval.
                           </div>
                        )}
                        {contract.status === ContractStatus.DISPUTED && (
                           <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded">
                              Contract is disputed. Reason: {contract.disputeReason}
                           </div>
                        )}
                        {/* Only allow dispute if Active, Accepted, Under Review, or Payment Verify */}
                        {isCreator && ['ACTIVE', 'ACCEPTED', 'UNDER_REVIEW', 'PAYMENT_VERIFY'].includes(contract.status) && (
                           <button 
                             onClick={() => setShowDisputeModal('FIXED')}
                             className="text-xs text-red-500 hover:underline mt-2 flex items-center"
                           >
                             <Flag size={12} className="mr-1" /> Raise Dispute
                           </button>
                        )}
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {contract.terms.milestones?.map((ms, idx) => (
                           <div key={ms.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 relative">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <span className="text-xs text-slate-400 font-bold uppercase">Phase {idx + 1}</span>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{ms.title}</h4>
                                 </div>
                                 <div className="text-right">
                                    <div className="font-bold text-slate-900 dark:text-white">{contract.terms.currency} {ms.amount.toLocaleString()}</div>
                                    <div className="mt-1">{renderStatusBadge(ms.status)}</div>
                                 </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{ms.description}</p>
                              
                              {/* Creator Actions for Milestone */}
                              {isCreator && (
                                 <div className="flex flex-wrap gap-2 items-center">
                                    {(ms.status === 'PENDING' || ms.status === 'IN_PROGRESS') && (
                                       <Button size="sm" onClick={() => setShowSubmitWorkModal(ms.id)}>Submit Work</Button>
                                    )}
                                    {ms.status === 'UNDER_REVIEW' && (
                                       <span className="text-sm text-slate-500 italic">Waiting for client review...</span>
                                    )}
                                    {['IN_PROGRESS', 'UNDER_REVIEW', 'PAYMENT_VERIFY'].includes(ms.status) && (
                                       <button 
                                         onClick={() => setShowDisputeModal(ms.id)}
                                         className="text-xs text-red-500 hover:underline ml-auto"
                                       >
                                         Report Issue
                                       </button>
                                    )}
                                    {ms.status === 'DISPUTED' && (
                                       <span className="text-sm text-red-500 font-bold">Dispute Active</span>
                                    )}
                                 </div>
                              )}
                              
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               {/* Timeline / History */}
               <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Contract History</h3>
                  <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6">
                     {contract.history.slice().reverse().map((event) => (
                        <div key={event.id} className="relative">
                           <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">{event.action.replace('_', ' ').toUpperCase()}</p>
                           <p className="text-xs text-slate-500 mb-1">{new Date(event.date).toLocaleString()} by {event.actorName}</p>
                           {event.note && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                 {event.note}
                              </p>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

            </div>

            {/* Right Col: Chat & Terms Summary */}
            <div className="space-y-6">
               <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-[500px] flex flex-col">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                     <MessageCircle size={18} className="mr-2" /> Chat with {otherPartyName}
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                     {messages.length > 0 ? messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                              msg.senderId === user.id 
                                 ? 'bg-brand-600 text-white rounded-tr-none' 
                                 : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                           }`}>
                              {msg.content}
                           </div>
                           <span className="text-[10px] text-slate-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                     )) : (
                        <p className="text-center text-slate-400 text-sm py-10">No messages yet. Say hi!</p>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                     />
                     <button 
                        onClick={handleSendMessage}
                        className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                     >
                        <Send size={18} />
                     </button>
                  </div>
               </div>
               
               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Quick Terms</h3>
                  <div className="space-y-2 text-slate-600 dark:text-slate-400">
                     <div className="flex justify-between">
                        <span>Payment Type:</span>
                        <span className="font-medium">{contract.terms.paymentType}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{contract.terms.durationDays} Days</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Revisions:</span>
                        <span className="font-medium">{contract.terms.revisionPolicy || 'Standard'}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="font-medium">{new Date(contract.terms.startDate).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* Submit Work Modal */}
      {showSubmitWorkModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Submit Work</h3>
               
               <div className="space-y-4">
                  <FileUpload 
                     label="Upload Files (Images, Documents, Zips)" 
                     onFileSelect={(files) => setSubmissionFiles(files)}
                     multiple
                  />
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Links</label>
                     <textarea 
                        className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" 
                        rows={3} 
                        placeholder="Add links or comments about this submission..."
                        value={submissionNote}
                        onChange={(e) => setSubmissionNote(e.target.value)}
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setShowSubmitWorkModal(null)}>Cancel</Button>
                  <Button onClick={handleSubmitWork}>Submit for Review</Button>
               </div>
            </div>
         </div>
      )}
      
      {/* Dispute Modal */}
      {showDisputeModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-500">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Raise a Dispute</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Disputes pause the contract and alert our admin team. Please try to resolve with the client in chat first.
               </p>
               <textarea 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" 
                  rows={4} 
                  placeholder="Describe the issue clearly..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
               />
               <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowDisputeModal(null)}>Cancel</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDispute} disabled={!disputeReason}>Raise Dispute</Button>
               </div>
            </div>
         </div>
      )}

      {/* End Contract Modal */}
      {showEndContractModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">End Contract</h3>
               
               <div className="space-y-4 mb-4">
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                     <button onClick={() => setEndType('completion')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${endType === 'completion' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        Completed Successfully
                     </button>
                     <button onClick={() => setEndType('termination')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${endType === 'termination' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        Terminate Early
                     </button>
                  </div>
                  
                  <textarea 
                     className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" 
                     rows={3} 
                     placeholder={endType === 'completion' ? "Closing notes..." : "Reason for termination..."}
                     value={endReason}
                     onChange={(e) => setEndReason(e.target.value)}
                  />
               </div>

               <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowEndContractModal(false)}>Cancel</Button>
                  <Button onClick={handleRequestEndContract} disabled={!endReason}>Request to End</Button>
               </div>
            </div>
         </div>
      )}

      {/* Reject End Contract Modal */}
      {showRejectEndModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject End Request</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Please provide a reason why you are rejecting the request to end the contract.
               </p>
               <textarea 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" 
                  rows={3} 
                  placeholder="Reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
               />
               <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowRejectEndModal(false)}>Cancel</Button>
                  <Button onClick={() => handleResolveEndRequest(false)} disabled={!rejectionReason} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
               </div>
            </div>
         </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Leave a Review</h3>
               
               <div className="flex justify-center mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                     <button key={star} onClick={() => setRating(star)} className="p-1 focus:outline-none transition-transform hover:scale-110">
                        <Star size={32} fill={star <= rating ? "#EAB308" : "none"} className={star <= rating ? "text-yellow-500" : "text-slate-300 dark:text-slate-600"} />
                     </button>
                  ))}
               </div>
               
               <textarea 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white" 
                  rows={3} 
                  placeholder="Describe your experience working with them..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
               />
               
               <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setShowRatingModal(false)}>Cancel</Button>
                  <Button onClick={handleLeaveReview}>Submit Review</Button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ContractDetail;
