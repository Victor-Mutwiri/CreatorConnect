
import { User, UserStatus, Contract, ContractStatus, Milestone } from '../types';

const USERS_KEY = 'ubuni_users_db';
const CONTRACTS_KEY = 'ubuni_contracts_db';
const NOTIFICATIONS_KEY = 'ubuni_notifications_db';

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for notifications
const createNotification = (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
  const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  notifications.push({
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    title,
    message,
    type,
    read: false,
    date: new Date().toISOString(),
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

  // 2. Update User Status
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

  // 3. Reset Verification
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
         verifiedPlatforms: [],
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

  // 4. Flag/Unflag User
  toggleFlagUser: async (userId: string, isFlagged: boolean, reason?: string): Promise<User | null> => {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    users[index].isFlagged = isFlagged;
    if (isFlagged) {
        users[index].flagReason = reason;
    } else {
        delete users[index].flagReason;
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password, ...safeUser } = users[index];
    return safeUser;
  },

  // 5. Force Logout
  forceLogout: async (userId: string): Promise<void> => {
     await delay(300);
     console.log(`[MockAdmin] Force logout signal sent for user ${userId}`);
     return;
  },

  // 6. Get Pending Creator Verifications
  getPendingVerifications: async (): Promise<User[]> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.filter((u: User) =>
        u.role === 'CREATOR' && u.profile?.verification?.status === 'pending'
    );
  },

  // 7. Verify Identity
  verifyIdentity: async (userId: string, approved: boolean, reason?: string): Promise<void> => {
    await delay(600);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);

    if (index === -1) return;

    const user = users[index];

    if (user.role === 'CREATOR' && user.profile) {
        user.profile.verification = {
            ...user.profile.verification,
            status: approved ? 'verified' : 'rejected',
            isIdentityVerified: approved,
            rejectionReason: reason || undefined
        };
        if (approved) {
             user.profile.verification.trustScore = Math.min(100, (user.profile.verification.trustScore || 0) + 30);
        }
    } else if (user.role === 'CLIENT' && user.clientProfile) {
        user.clientProfile.isVerified = approved;
        if (approved && user.clientProfile.stats) {
             user.clientProfile.stats.trustScore = Math.min(100, (user.clientProfile.stats.trustScore || 0) + 20);
        }
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const title = approved ? 'Identity Verified' : 'Verification Rejected';
    const msg = approved
        ? "Congratulations! Your identity has been verified. You now have the blue badge."
        : `Your verification request was rejected. Reason: ${reason}`;
    
    createNotification(userId, title, msg, approved ? 'success' : 'error');
  },

  // 8. Verify Social Platform
  verifySocialPlatform: async (userId: string, platform: string, approved: boolean): Promise<void> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);

    if (index === -1) return;
    const user = users[index];

    if (user.role === 'CREATOR' && user.profile?.verification) {
        let platforms = user.profile.verification.verifiedPlatforms || [];
        if (approved) {
            if (!platforms.includes(platform)) platforms.push(platform);
        } else {
            platforms = platforms.filter(p => p !== platform);
        }
        user.profile.verification.verifiedPlatforms = platforms;
        user.profile.verification.isSocialVerified = platforms.length > 0;
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    if (approved) {
         createNotification(userId, 'Social Media Verified', `Your ${platform} account has been verified.`, 'success');
    }
  },

  // 9. Get All Disputes (New Module)
  getAllDisputes: async (): Promise<any[]> => {
    await delay(600);
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const disputes: any[] = [];

    contracts.forEach((contract: Contract) => {
      // A. Milestone Disputes
      if (contract.terms.milestones) {
        contract.terms.milestones.forEach((ms: Milestone) => {
          if (ms.status === 'DISPUTED') {
            disputes.push({
              id: `disp-ms-${ms.id}`,
              type: 'MILESTONE',
              contractId: contract.id,
              contractTitle: contract.title,
              milestoneId: ms.id,
              title: `Milestone Dispute: ${ms.title}`,
              amount: ms.amount,
              parties: { client: contract.clientName, creator: contract.creatorName },
              reason: ms.disputeReason || 'No reason provided',
              date: contract.updatedAt, // Using last update as proxy for dispute date
              status: 'OPEN'
            });
          }
        });
      }

      // B. Fixed Contract Disputes (NEW)
      if (contract.terms.paymentType === 'FIXED' && contract.status === ContractStatus.DISPUTED) {
         disputes.push({
            id: `disp-contract-${contract.id}`,
            type: 'FIXED_CONTRACT',
            contractId: contract.id,
            contractTitle: contract.title,
            title: `Contract Dispute: ${contract.title}`,
            amount: contract.terms.amount,
            parties: { client: contract.clientName, creator: contract.creatorName },
            reason: contract.disputeReason || 'No reason provided',
            date: contract.updatedAt,
            status: 'OPEN'
         });
      }

      // C. Termination Requests
      if (contract.endRequest?.status === 'pending' && contract.endRequest.type === 'termination') {
         disputes.push({
            id: `disp-end-${contract.id}`,
            type: 'TERMINATION',
            contractId: contract.id,
            contractTitle: contract.title,
            title: `Termination Request`,
            amount: contract.terms.amount,
            parties: { client: contract.clientName, creator: contract.creatorName },
            reason: contract.endRequest.reason,
            requesterName: contract.endRequest.requesterName,
            date: contract.endRequest.createdAt,
            status: 'OPEN'
         });
      }
    });

    // Sort by Date (Oldest first)
    return disputes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // 10. Resolve Dispute
  resolveDispute: async (
      caseId: string, 
      resolution: 'FAVOR_CREATOR' | 'FAVOR_CLIENT' | 'FORCE_REVISION', 
      adminNote: string
  ): Promise<void> => {
      await delay(800);
      const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
      
      const contractIndex = contracts.findIndex((c: Contract) => {
          if (caseId.startsWith('disp-end-')) {
              return `disp-end-${c.id}` === caseId;
          } else if (caseId.startsWith('disp-contract-')) {
              return `disp-contract-${c.id}` === caseId;
          } else {
              return c.terms.milestones?.some(m => `disp-ms-${m.id}` === caseId);
          }
      });

      if (contractIndex === -1) throw new Error("Dispute not found");
      const contract = contracts[contractIndex];

      let msg = "";

      if (caseId.startsWith('disp-end-')) {
          // TERMINATION RESOLUTION
          if (resolution === 'FAVOR_CLIENT') {
              if (contract.endRequest?.requesterId === contract.clientId) {
                  contract.status = ContractStatus.CANCELLED;
                  contract.endRequest!.status = 'approved';
                  msg = "Admin approved termination (Favored Client).";
              } else {
                  contract.endRequest!.status = 'rejected';
                  contract.endRequest!.rejectionReason = "Admin Ruling: Request denied. Work must continue.";
                  msg = "Admin rejected termination (Favored Client).";
              }
          } else if (resolution === 'FAVOR_CREATOR') {
               if (contract.endRequest?.requesterId === contract.creatorId) {
                  contract.status = ContractStatus.CANCELLED;
                  contract.endRequest!.status = 'approved';
                  msg = "Admin approved termination (Favored Creator).";
               } else {
                  contract.endRequest!.status = 'rejected';
                  contract.endRequest!.rejectionReason = "Admin Ruling: Request denied.";
                  msg = "Admin rejected termination (Favored Creator).";
               }
          } else if (resolution === 'FORCE_REVISION') {
              contract.endRequest!.status = 'rejected';
              contract.endRequest!.rejectionReason = "Admin Ruling: Dispute requires revision/mediation.";
              msg = "Admin rejected termination. Revision ordered.";
          }
      } else if (caseId.startsWith('disp-contract-')) {
          // FIXED CONTRACT RESOLUTION (NEW)
          if (resolution === 'FAVOR_CREATOR') {
              contract.status = ContractStatus.COMPLETED; // Paid and Closed
              msg = "Admin resolved dispute: Payment Released to Creator.";
          } else if (resolution === 'FAVOR_CLIENT') {
              contract.status = ContractStatus.CANCELLED; 
              msg = "Admin resolved dispute: Contract Cancelled/Refunded.";
          } else if (resolution === 'FORCE_REVISION') {
              contract.status = ContractStatus.ACTIVE;
              msg = "Admin resolved dispute: Revision Ordered.";
              contract.revisionNotes = `Admin Order: ${adminNote}`;
          }
      } else {
          // MILESTONE RESOLUTION
          const mIndex = contract.terms.milestones!.findIndex((m: Milestone) => `disp-ms-${m.id}` === caseId);
          if (mIndex === -1) throw new Error("Milestone not found");
          const ms = contract.terms.milestones![mIndex];

          if (resolution === 'FAVOR_CREATOR') {
              ms.status = 'PAID'; 
              msg = "Admin resolved dispute: Payment Released to Creator.";
          } else if (resolution === 'FAVOR_CLIENT') {
              ms.status = 'CANCELLED'; 
              msg = "Admin resolved dispute: Milestone Cancelled/Refunded.";
          } else if (resolution === 'FORCE_REVISION') {
              ms.status = 'IN_PROGRESS';
              msg = "Admin resolved dispute: Revision Ordered.";
              ms.revisionNotes = `Admin Order: ${adminNote}`;
          }
      }

      // Add History
      contract.history.push({
          id: `h-admin-${Date.now()}`,
          date: new Date().toISOString(),
          action: 'admin_ruling',
          actorName: 'Ubuni Support',
          actionBy: 'admin',
          note: `${msg} Note: ${adminNote}`
      });

      contracts[contractIndex] = contract;
      localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));

      // Notify
      createNotification(contract.clientId, 'Dispute Update', `Admin Ruling on ${contract.title}: ${adminNote}`, 'info');
      createNotification(contract.creatorId, 'Dispute Update', `Admin Ruling on ${contract.title}: ${adminNote}`, 'info');
  }
};
