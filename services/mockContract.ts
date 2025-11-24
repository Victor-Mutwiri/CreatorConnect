

import { Contract, ContractStatus, Message, Notification, ContractTerms, User } from '../types';

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
    {
      id: 'c-101',
      clientId: 'client-1',
      clientName: 'Safaricom PLC',
      clientAvatar: 'https://ui-avatars.com/api/?name=Safaricom&background=059b5a&color=fff',
      creatorId: userId,
      title: 'Summer Campaign 2024',
      description: 'Influencer marketing campaign for the new data bundles rollout. Looking for energetic lifestyle content.',
      status: ContractStatus.SENT,
      terms: {
        amount: 45000,
        currency: 'KES',
        deposit: 15000,
        durationDays: 14,
        deliverables: [
          '2 Instagram Reels (30s)',
          '1 TikTok Video',
          '3 Instagram Stories with link'
        ],
        schedule: 'Week 1: Teaser stories. Week 2: Main reels and TikTok posts.',
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        revisionPolicy: '2 Revisions included'
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      history: [
        {
          id: 'h-1',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          action: 'created',
          actorName: 'Safaricom PLC',
          actionBy: 'client-1',
          note: 'Contract drafted'
        },
        {
          id: 'h-2',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          action: 'sent',
          actorName: 'Safaricom PLC',
          actionBy: 'client-1',
          note: 'Contract sent to creator'
        }
      ]
    },
    {
      id: 'c-102',
      clientId: 'client-2',
      clientName: 'Java House',
      clientAvatar: 'https://ui-avatars.com/api/?name=Java+House&background=ef4444&color=fff',
      creatorId: userId,
      title: 'New Menu Launch',
      description: 'Photography and social posts for our new breakfast menu items.',
      status: ContractStatus.ACTIVE,
      terms: {
        amount: 25000,
        currency: 'KES',
        durationDays: 7,
        deliverables: [
          '5 High-res Photos',
          '1 Instagram Post'
        ],
        schedule: 'Shoot on Monday, edit by Wednesday, post on Friday.',
        startDate: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      history: [
        { id: 'h-3', date: new Date(Date.now() - 86400000 * 10).toISOString(), action: 'sent', actorName: 'Java House', actionBy: 'client-2' },
        { id: 'h-4', date: new Date(Date.now() - 86400000 * 9).toISOString(), action: 'accepted', actorName: 'You', actionBy: userId },
        { id: 'h-5', date: new Date(Date.now() - 86400000 * 3).toISOString(), action: 'started', actorName: 'System', actionBy: 'system', note: 'Project marked as Active' }
      ]
    }
  ];

  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

  // Seed Messages
  const messages: Message[] = [
    {
      id: 'm-1',
      contractId: 'c-101',
      senderId: 'client-1',
      senderName: 'Safaricom PLC',
      content: "Hi there! We love your profile and think you'd be great for this campaign.",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'm-2',
      contractId: 'c-102',
      senderId: 'client-2',
      senderName: 'Java House',
      content: "Looking forward to working with you. The shoot is at the Valley Arcade branch.",
      timestamp: new Date(Date.now() - 86400000 * 9).toISOString()
    },
    {
      id: 'm-3',
      contractId: 'c-102',
      senderId: userId,
      senderName: 'Me',
      content: "Great! I'll be there at 9 AM sharp.",
      timestamp: new Date(Date.now() - 86400000 * 9 + 3600000).toISOString()
    }
  ];
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  // Seed Notifications
  const notifications: Notification[] = [
    {
      id: 'n-1',
      userId: userId,
      title: 'New Contract Offer',
      message: 'Safaricom PLC has sent you a contract offer for "Summer Campaign 2024".',
      type: 'success',
      read: false,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      link: '/creator/contracts/c-101'
    }
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
      ]
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