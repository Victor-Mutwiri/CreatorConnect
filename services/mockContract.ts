import { Contract, ContractStatus, Message, Notification, ContractTerms, User, ContractEndRequest, Review } from '../types';
import { mockAuth } from './mockAuth'; // We need access to update user profiles

const CONTRACTS_KEY = 'ubuni_contracts_db';
const MESSAGES_KEY = 'ubuni_messages_db';
const NOTIFICATIONS_KEY = 'ubuni_notifications_db';

// Helper to delay response
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create notifications
const createNotification = (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', link?: string) => {
  const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  notifications.push({
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    title,
    message,
    type,
    read: false,
    date: new Date().toISOString(),
    link
  });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

// Seed data generator
const seedData = (userId: string) => {
  const existingContracts = localStorage.getItem(CONTRACTS_KEY);
  if (existingContracts) return;

  const contracts: Contract[] = [];
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

  const messages: Message[] = [];
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  const notifications: Notification[] = [];
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const mockContractService = {
  getContracts: async (userId: string): Promise<Contract[]> => {
    await delay(500);
    seedData(userId);
    const allContracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    return allContracts.filter((c: Contract) => c.creatorId === userId || c.clientId === userId);
  },

  getContractById: async (id: string): Promise<Contract | null> => {
    await delay(300);
    const allContracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    return allContracts.find((c: Contract) => c.id === id) || null;
  },

  createContract: async (
    clientId: string,
    clientName: string,
    clientAvatar: string | undefined,
    creatorId: string,
    creatorName: string,
    data: Partial<Contract>
  ): Promise<Contract> => {
    await delay(1000);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    
    const newContract: Contract = {
      id: `c-${Date.now()}`,
      clientId,
      clientName,
      clientAvatar,
      creatorId,
      creatorName,
      title: data.title || 'Untitled Project',
      description: data.description || '',
      status: ContractStatus.SENT,
      terms: data.terms as ContractTerms,
      expiryDate: data.expiryDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          action: 'created',
          actorName: clientName,
          actionBy: clientId,
          note: 'Contract drafted and sent'
        }
      ],
      isClientReviewed: false,
      isCreatorReviewed: false
    };

    contracts.push(newContract);
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    // Notify Creator
    createNotification(
      creatorId,
      'New Job Offer',
      `${clientName} has sent you a contract for "${newContract.title}".`,
      'success',
      `/creator/contracts/${newContract.id}`
    );

    return newContract;
  },

  updateContractStatus: async (contractId: string, status: ContractStatus, userId: string, userName: string, note?: string): Promise<Contract> => {
    await delay(600);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    
    if (index === -1) throw new Error('Contract not found');

    const updatedContract = { ...contracts[index], status, updatedAt: new Date().toISOString() };
    
    // Add history
    updatedContract.history.push({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      action: status.toLowerCase(),
      actorName: userName,
      actionBy: userId,
      note
    });

    contracts[index] = updatedContract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    // Notify the OTHER party
    const isCreatorAction = userId === updatedContract.creatorId;
    const targetUserId = isCreatorAction ? updatedContract.clientId : updatedContract.creatorId;
    
    if (status === ContractStatus.ACCEPTED) {
       createNotification(
         targetUserId,
         'Contract Accepted',
         `${userName} has accepted the contract for "${updatedContract.title}". Work can begin!`,
         'success',
         `/creator/contracts/${updatedContract.id}`
       );
    } else if (status === ContractStatus.DECLINED) {
       createNotification(
         targetUserId,
         'Contract Declined',
         `${userName} has declined the contract for "${updatedContract.title}".`,
         'error',
         `/creator/contracts/${updatedContract.id}`
       );
    }

    return updatedContract;
  },

  counterOffer: async (contractId: string, newTerms: ContractTerms, userId: string, userName: string): Promise<Contract> => {
    await delay(800);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    
    if (index === -1) throw new Error('Contract not found');

    const currentContract = contracts[index];

    const updatedContract = { 
      ...currentContract,
      previousTerms: currentContract.terms, // Save previous terms before update
      terms: newTerms, 
      status: ContractStatus.NEGOTIATING,
      updatedAt: new Date().toISOString() 
    };
    
    updatedContract.history.push({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      action: 'counter_offer',
      actorName: userName,
      actionBy: userId,
      note: 'Updated terms proposed'
    });

    contracts[index] = updatedContract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    // Notify the OTHER party
    const isCreatorAction = userId === updatedContract.creatorId;
    const targetUserId = isCreatorAction ? updatedContract.clientId : updatedContract.creatorId;

    createNotification(
       targetUserId,
       'Counter Offer Received',
       `${userName} has proposed new terms for "${updatedContract.title}".`,
       'warning',
       `/creator/contracts/${updatedContract.id}`
    );

    return updatedContract;
  },

  requestEndContract: async (contractId: string, userId: string, userName: string, reason: string, type: 'completion' | 'termination'): Promise<Contract> => {
    await delay(600);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    if (index === -1) throw new Error('Contract not found');

    const updatedContract = { ...contracts[index] };
    updatedContract.endRequest = {
      requesterId: userId,
      requesterName: userName,
      reason,
      type,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    contracts[index] = updatedContract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    // Notify the OTHER party
    const isCreatorAction = userId === updatedContract.creatorId;
    const targetUserId = isCreatorAction ? updatedContract.clientId : updatedContract.creatorId;

    createNotification(
       targetUserId,
       'End Contract Proposal',
       `${userName} has requested to end the contract "${updatedContract.title}" (${type}).`,
       'info',
       `/creator/contracts/${updatedContract.id}`
    );

    return updatedContract;
  },

  resolveEndContract: async (contractId: string, approved: boolean, userId: string, userName: string, rejectionReason?: string): Promise<Contract> => {
    await delay(600);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    if (index === -1) throw new Error('Contract not found');

    let updatedContract = { ...contracts[index] };
    const request = updatedContract.endRequest;

    if (!request) throw new Error("No end request found");

    // Notify the requester (who originally asked to end)
    const requesterId = request.requesterId;

    if (approved) {
      const newStatus = request.type === 'completion' ? ContractStatus.COMPLETED : ContractStatus.CANCELLED;
      updatedContract.status = newStatus;
      updatedContract.endRequest.status = 'approved';
      
      updatedContract.history.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: newStatus.toLowerCase(),
        actorName: userName,
        actionBy: userId,
        note: `Mutual agreement to end contract: ${request.reason}`
      });

      createNotification(
        requesterId,
        'End Request Approved',
        `${userName} accepted your request to end "${updatedContract.title}".`,
        'success',
        `/creator/contracts/${updatedContract.id}`
      );

    } else {
      updatedContract.endRequest.status = 'rejected';
      updatedContract.endRequest.rejectionReason = rejectionReason;
      
      updatedContract.history.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: 'end_request_rejected',
        actorName: userName,
        actionBy: userId,
        note: `End contract request rejected. Reason: ${rejectionReason || 'No reason provided'}`
      });

      createNotification(
        requesterId,
        'End Request Rejected',
        `${userName} declined your request to end "${updatedContract.title}".`,
        'error',
        `/creator/contracts/${updatedContract.id}`
      );
    }

    contracts[index] = updatedContract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
    return updatedContract;
  },

  leaveReview: async (contractId: string, reviewerId: string, rating: number, paymentRating?: number, comment?: string): Promise<Contract> => {
    await delay(800);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    if (index === -1) throw new Error('Contract not found');

    const contract = contracts[index];
    const isClientReviewer = contract.clientId === reviewerId;

    if (contract.status !== ContractStatus.COMPLETED) {
      throw new Error('Can only review completed contracts');
    }

    if (isClientReviewer) {
      if (contract.isClientReviewed) throw new Error('You have already reviewed this contract');
      contract.isClientReviewed = true;
    } else {
      if (contract.isCreatorReviewed) throw new Error('You have already reviewed this contract');
      contract.isCreatorReviewed = true;
    }

    contracts[index] = contract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    const targetUserId = isClientReviewer ? contract.creatorId : contract.clientId;
    const reviewerName = isClientReviewer ? contract.clientName : contract.creatorName;

    const review: Review = {
      id: `r-${Date.now()}`,
      reviewerId,
      reviewerName,
      rating,
      paymentRating, // Pass payment rating if present
      comment: comment || '',
      date: new Date().toISOString(),
      projectTitle: contract.title
    };

    await mockAuth.addUserReview(targetUserId, review);

    return contract;
  },

  getMessages: async (contractId: string): Promise<Message[]> => {
    await delay(300);
    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return allMessages.filter((m: Message) => m.contractId === contractId).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (contractId: string, senderId: string, senderName: string, content: string): Promise<Message> => {
    await delay(200);
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      contractId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    return newMessage;
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    // await delay(200); // Intentionally fast
    const allNotes = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    return allNotes.filter((n: Notification) => n.userId === userId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  markNotificationRead: async (notificationId: string) => {
    const notes = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const index = notes.findIndex((n: Notification) => n.id === notificationId);
    if (index !== -1) {
      notes[index].read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notes));
    }
  }
};