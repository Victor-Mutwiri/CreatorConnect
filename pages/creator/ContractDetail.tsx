
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Clock, FileText, Send, 
  CheckCircle, XCircle, RefreshCw, MessageCircle, Paperclip
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { mockContractService } from '../../services/mockContract';
import { Contract, ContractStatus, Message, ContractTerms } from '../../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Counter offer state
  const [counterTerms, setCounterTerms] = useState<ContractTerms>({
    amount: 0,
    currency: 'KES',
    durationDays: 0,
    deliverables: [],
    schedule: '',
    startDate: ''
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
        if(c) setCounterTerms(c.terms);
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
      
      // Add system message to chat
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
       // Add system message to chat
       const sysMsg = await mockContractService.sendMessage(
        contract.id, 'system', 'System', 
        `A counter-offer was proposed by ${user.name}`
      );
      setMessages([...messages, sysMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!contract) return <div className="p-20 text-center">Contract not found</div>;

  const isPending = [ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(contract.status);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left: Contract Details & Actions */}
        <div className="flex-1 space-y-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft size={18} className="mr-1" /> Back to Contracts
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{contract.title}</h1>
                <p className="text-slate-500">Client: <span className="font-semibold text-slate-700">{contract.clientName}</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                contract.status === ContractStatus.ACTIVE ? 'bg-green-100 text-green-700' : 
                contract.status === ContractStatus.SENT ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {contract.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{contract.description}</p>
          </div>

          {/* Terms */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center">
              <FileText size={20} className="mr-2 text-brand-600" /> 
              Contract Terms
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-slate-500 text-sm mb-1 flex items-center"><DollarSign size={14} className="mr-1"/> Payment Amount</div>
                <div className="text-xl font-bold text-slate-900">{contract.terms.currency} {contract.terms.amount.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-slate-500 text-sm mb-1 flex items-center"><Calendar size={14} className="mr-1"/> Duration</div>
                <div className="text-xl font-bold text-slate-900">{contract.terms.durationDays} Days</div>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                 <h4 className="font-semibold text-slate-900 mb-2">Deliverables</h4>
                 <ul className="list-disc list-inside space-y-1 text-slate-600 ml-1">
                   {contract.terms.deliverables.map((item, i) => (
                     <li key={i}>{item}</li>
                   ))}
                 </ul>
               </div>
               <div>
                 <h4 className="font-semibold text-slate-900 mb-2">Schedule & Milestones</h4>
                 <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                   {contract.terms.schedule}
                 </p>
               </div>
            </div>
          </div>

          {/* Actions Bar (Only if pending) */}
          {isPending && (
            <div className="sticky bottom-4 z-10 bg-white p-4 rounded-xl shadow-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-4">
               <div>
                 <p className="font-bold text-slate-900">Take Action</p>
                 <p className="text-xs text-slate-500">This contract is waiting for your response.</p>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setShowCounterModal(true)}
                   className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center"
                 >
                   <RefreshCw size={16} className="mr-2" />
                   Counter Offer
                 </button>
                 <button 
                   onClick={() => handleStatusChange(ContractStatus.DECLINED)}
                   className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center"
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

          {/* History / Audit Trail */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Contract History</h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
              {contract.history.map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-mono mb-1">
                      {new Date(item.date).toLocaleString()}
                    </span>
                    <span className="font-medium text-slate-900">
                      {item.action === 'created' && 'Contract Created'}
                      {item.action === 'sent' && 'Contract Sent'}
                      {item.action === 'counter_offer' && 'Counter Offer Proposed'}
                      {item.action === 'accepted' && 'Contract Accepted'}
                      {item.action === 'declined' && 'Contract Declined'}
                    </span>
                    <span className="text-sm text-slate-500">
                      by {item.actorName}
                    </span>
                    {item.note && (
                      <p className="mt-1 text-sm bg-slate-50 p-2 rounded text-slate-600 italic">
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
        <div className="lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] sticky top-24">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center">
             <MessageCircle size={18} className="mr-2" /> 
             Discussion
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map(msg => {
              const isMe = msg.senderId === user?.id;
              const isSystem = msg.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
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

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
             <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
               <Paperclip size={20} />
             </button>
             <input
               type="text"
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="Type a message..."
               className="flex-1 bg-slate-100 border-0 rounded-full px-4 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Propose Counter Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <Input 
                label="Amount (KES)"
                type="number"
                value={counterTerms.amount}
                onChange={(e) => setCounterTerms({...counterTerms, amount: parseInt(e.target.value)})}
              />
              <Input 
                label="Duration (Days)"
                type="number"
                value={counterTerms.durationDays}
                onChange={(e) => setCounterTerms({...counterTerms, durationDays: parseInt(e.target.value)})}
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deliverables</label>
                <div className="space-y-2">
                  {counterTerms.deliverables.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        value={item}
                        onChange={(e) => {
                          const newD = [...counterTerms.deliverables];
                          newD[i] = e.target.value;
                          setCounterTerms({...counterTerms, deliverables: newD});
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newD = counterTerms.deliverables.filter((_, idx) => idx !== i);
                          setCounterTerms({...counterTerms, deliverables: newD});
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setCounterTerms({...counterTerms, deliverables: [...counterTerms.deliverables, '']})}
                    className="text-sm text-brand-600 font-medium hover:text-brand-700"
                  >
                    + Add Deliverable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Schedule / Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-500 focus:outline-none"
                  rows={3}
                  value={counterTerms.schedule}
                  onChange={(e) => setCounterTerms({...counterTerms, schedule: e.target.value})}
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowCounterModal(false)}>Cancel</Button>
              <Button onClick={handleCounterOffer}>Submit Proposal</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContractDetail;
