
import { User, UserStatus, AdminDispute, Contract } from '../types';

const USERS_KEY = 'ubuni_users_db';
const CONTRACTS_KEY = 'ubuni_contracts_db';
const NOTIFICATIONS_KEY = 'ubuni_notifications_db';

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Format Time Ago
const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

// Helper to create notifications (duplicated from mockContract to avoid circular dep issues in mock setup)
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

export const mockAdminService = {
  
  // 1. Get All Users (Creators & Clients)
  getAllUsers: async (): Promise<User[]> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.map(({ password, ...u }: any) => {
        if (!u.status) u.status = 'active';
        return u;
    });
  },

  // 2. Update User Status (Ban/Suspend/Activate)
  updateUserStatus: async (userId: string, status: UserStatus): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    users[index].status = status;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = users[index];
    return safeUser;
  },

  // 3. Reset Social/Identity Verification
  resetVerification: async (userId: string): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    const user = users[index];
    
    if (user.profile) {
       user.profile.verification = {
         status: 'unverified',
         isIdentityVerified: false,
         isSocialVerified: false,
         trustScore: Math.max(0, (user.profile.verification?.trustScore || 20) - 20)
       };
    }
    
    if (user.clientProfile) {
       user.clientProfile.isVerified = false;
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // 4. Verify User Identity
  verifyUser: async (userId: string): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    const user = users[index];
    
    if (user.profile) {
       user.profile.verification = {
         ...user.profile.verification,
         status: 'verified',
         isIdentityVerified: true,
         trustScore: 85 
       };
    }
    
    if (user.clientProfile) {
       user.clientProfile.isVerified = true;
       if (!user.clientProfile.stats) {
          user.clientProfile.stats = { contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', reliabilityScore: 0, avgResponseTime: '-', disputesWon: 0, disputesLost: 0, trustScore: 20 };
       }
       user.clientProfile.stats.trustScore = Math.min(100, (user.clientProfile.stats.trustScore || 0) + 20);
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // 5. Reject Verification
  rejectVerification: async (userId: string): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    const user = users[index];
    
    if (user.profile) {
       user.profile.verification = {
         ...user.profile.verification,
         status: 'rejected',
         isIdentityVerified: false
       };
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // 6. Flag/Unflag User
  toggleFlagUser: async (userId: string, isFlagged: boolean, reason?: string): Promise<User | null> => {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    users[index].isFlagged = isFlagged;
    if (reason) users[index].flagReason = reason;
    else delete users[index].flagReason;

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = users[index];
    return safeUser;
  },

  // 7. Force Logout
  forceLogout: async (userId: string): Promise<void> => {
    await delay(200);
    console.log(`Force logout triggered for ${userId}`);
  },

  // 8. Get Active Disputes (New)
  getActiveDisputes: async (): Promise<AdminDispute[]> => {
    await delay(500);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const disputes: AdminDispute[] = [];

    contracts.forEach((c: Contract) => {
      // Check active milestone disputes
      if (c.terms.milestones) {
        c.terms.milestones.forEach((m) => {
          if (m.status === 'DISPUTED') {
            // Find when it was disputed from history
            const historyItem = c.history.slice().reverse().find(h => h.action === 'milestone_update' && h.note?.includes('DISPUTED'));
            const date = historyItem ? historyItem.date : c.updatedAt;
            
            disputes.push({
              id: m.id,
              contractId: c.id,
              contractTitle: c.title,
              creatorId: c.creatorId,
              creatorName: c.creatorName || 'Unknown',
              clientId: c.clientId,
              clientName: c.clientName || 'Unknown',
              reason: m.disputeReason || 'No reason provided',
              type: 'MILESTONE',
              status: 'OPEN',
              createdAt: date,
              startedAtAgo: timeAgo(date)
            });
          }
        });
      }

      // Check active end request termination disputes
      if (c.endRequest && c.endRequest.status === 'pending' && c.endRequest.type === 'termination') {
         disputes.push({
            id: `end-${c.id}`,
            contractId: c.id,
            contractTitle: c.title,
            creatorId: c.creatorId,
            creatorName: c.creatorName || 'Unknown',
            clientId: c.clientId,
            clientName: c.clientName || 'Unknown',
            reason: c.endRequest.reason,
            type: 'TERMINATION',
            status: 'OPEN',
            createdAt: c.endRequest.createdAt,
            startedAtAgo: timeAgo(c.endRequest.createdAt)
         });
      }
    });

    return disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // 9. Resolve Dispute with Repercussions (New)
  resolveDispute: async (
    disputeId: string, 
    contractId: string, 
    targetUserId: string, 
    action: 'WARNING' | 'WATCHLIST' | 'SUSPEND' | 'BAN' | 'CLEAR',
    adminNote: string
  ): Promise<void> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    
    // A. Apply User Repercussions
    const userIndex = users.findIndex((u: User) => u.id === targetUserId);
    if (userIndex !== -1) {
      if (action === 'WATCHLIST') {
        users[userIndex].isWatchlisted = true;
      } else if (action === 'SUSPEND') {
        users[userIndex].status = 'suspended';
      } else if (action === 'BAN') {
        users[userIndex].status = 'banned';
      }
      // If CLEAR or WARNING, we might unflag or just notify, preserving status
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // B. Update Contract Status (Force Resolve)
    const contractIndex = contracts.findIndex((c: Contract) => c.id === contractId);
    if (contractIndex !== -1) {
      const contract = contracts[contractIndex];
      
      // If Milestone Dispute
      if (contract.terms.milestones) {
        const mIndex = contract.terms.milestones.findIndex((m: any) => m.id === disputeId);
        if (mIndex !== -1) {
           // For simplicity, Admin resolution usually cancels the milestone or forces it paid.
           // Here we default to CANCELLED to close the dispute loop visually in this mock
           contract.terms.milestones[mIndex].status = 'CANCELLED';
           contract.terms.milestones[mIndex].disputeReason = `Resolved by Admin: ${adminNote}`;
        }
      }

      // If Termination Dispute
      if (disputeId.startsWith('end-') && contract.endRequest) {
         contract.endRequest.status = 'approved'; // Force approve end
         contract.status = 'CANCELLED'; // Terminated
      }

      contract.history.push({
        id: `adm-res-${Date.now()}`,
        date: new Date().toISOString(),
        action: 'admin_resolution',
        actorName: 'Ubuni Support',
        note: `Dispute resolved by Admin. Action: ${action}. Note: ${adminNote}`
      });

      contracts[contractIndex] = contract;
      localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
    }

    // C. Send Notification to User
    let title = 'Dispute Resolved';
    let msg = `The dispute on contract #${contractId} has been resolved by support.`;
    let type: any = 'info';

    if (action === 'WARNING') {
      title = 'Official Warning';
      msg = `You have received a formal warning regarding the dispute on contract #${contractId}. Reason: ${adminNote}`;
      type = 'warning';
    } else if (action === 'WATCHLIST') {
      title = 'Account Flagged';
      msg = `Your account has been placed on a watchlist due to recent dispute activity. Reason: ${adminNote}`;
      type = 'warning';
    } else if (action === 'SUSPEND') {
      title = 'Account Suspended';
      msg = `Your account has been suspended following a dispute review. Reason: ${adminNote}`;
      type = 'error';
    } else if (action === 'BAN') {
      title = 'Account Banned';
      msg = `Your account has been permanently banned. Reason: ${adminNote}`;
      type = 'error';
    }

    createNotification(targetUserId, title, msg, type);
  }
};
