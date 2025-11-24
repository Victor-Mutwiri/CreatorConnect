

import { Contract, ContractStatus, Message, Notification, ContractTerms, User, ContractEndRequest, Review } from '../types';
import { mockAuth } from './mockAuth'; // We need access to update user profiles

const CONTRACTS_KEY = 'ubuni_contracts_db';
const MESSAGES_KEY = 'ubuni_messages_db';
const NOTIFICATIONS_KEY = 'ubuni_notifications_db';

// Helper to delay response
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Seed data generator
const seedData = (userId: string) => {
  const existingContracts = localStorage.getItem(CONTRACTS_KEY);
  if (existingContracts) return;

  const contracts: Contract[] = [
  ];

  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

  // Seed Messages
  const messages: Message[] = [
  ];
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  // Seed Notifications
  const notifications: Notification[] = [
  ];
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

    // Send notification to creator
    const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    notifications.push({
      id: `n-${Date.now()}`,
      userId: creatorId,
      title: 'New Job Offer',
      message: `${clientName} has sent you a contract for "${newContract.title}".`,
      type: 'success',
      read: false,
      date: new Date().toISOString(),
      link: `/creator/contracts/${newContract.id}`
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

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
    return updatedContract;
  },

  counterOffer: async (contractId: string, newTerms: ContractTerms, userId: string, userName: string): Promise<Contract> => {
    await delay(800);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    
    if (index === -1) throw new Error('Contract not found');

    const updatedContract = { 
      ...contracts[index], 
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
    return updatedContract;
  },

  resolveEndContract: async (contractId: string, approved: boolean, userId: string, userName: string): Promise<Contract> => {
    await delay(600);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    if (index === -1) throw new Error('Contract not found');

    let updatedContract = { ...contracts[index] };
    const request = updatedContract.endRequest;

    if (!request) throw new Error("No end request found");

    if (approved) {
      // Set status based on the requested type
      const newStatus = request.type === 'completion' ? ContractStatus.COMPLETED : ContractStatus.CANCELLED;
      updatedContract.status = newStatus;
      updatedContract.endRequest.status = 'approved';
      
      // Add History
      updatedContract.history.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: newStatus.toLowerCase(),
        actorName: userName,
        actionBy: userId,
        note: `Mutual agreement to end contract: ${request.reason}`
      });
    } else {
      updatedContract.endRequest = undefined; // Clear the request if rejected
       // Add History
       updatedContract.history.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: 'end_request_rejected',
        actorName: userName,
        actionBy: userId,
        note: `End contract request rejected`
      });
    }

    contracts[index] = updatedContract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
    return updatedContract;
  },

  leaveReview: async (contractId: string, reviewerId: string, rating: number): Promise<Contract> => {
    await delay(800);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const index = contracts.findIndex((c: Contract) => c.id === contractId);
    if (index === -1) throw new Error('Contract not found');

    const contract = contracts[index];
    const isClient = contract.clientId === reviewerId;

    if (contract.status !== ContractStatus.COMPLETED) {
      throw new Error('Can only review completed contracts');
    }

    // Update contract review status
    if (isClient) {
      if (contract.isClientReviewed) throw new Error('You have already reviewed this contract');
      contract.isClientReviewed = true;
    } else {
      if (contract.isCreatorReviewed) throw new Error('You have already reviewed this contract');
      contract.isCreatorReviewed = true;
    }

    contracts[index] = contract;
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

    // Update the Profile of the person being reviewed
    const targetUserId = isClient ? contract.creatorId : contract.clientId;
    await mockAuth.addUserRating(targetUserId, rating);

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
    return allNotes.filter((n: Notification) => n.userId === userId);
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