
import { User, UserStatus } from '../types';

const USERS_KEY = 'ubuni_users_db';

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAdminService = {
  
  // 1. Get All Users (Creators & Clients)
  getAllUsers: async (): Promise<User[]> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    // Filter out Admins from the list view if desired, but typically Admins can see everyone
    // Returning safe user objects (no passwords)
    return users.map(({ password, ...u }: any) => {
        // Ensure default status if missing
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
    
    // If banning/suspending, we should technically force logout token invalidation in real backend.
    // In mock, we can't easily clear their specific session from here, 
    // but the auth check in App.tsx / mockAuth.signIn handles the gatekeeping.

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = users[index];
    return safeUser;
  },

  // 3. Reset Social/Identity Verification (Back to unverified)
  resetVerification: async (userId: string): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    const user = users[index];
    
    // Reset Creator Profile Verification
    if (user.profile) {
       user.profile.verification = {
         status: 'unverified',
         isIdentityVerified: false,
         isSocialVerified: false,
         trustScore: Math.max(0, (user.profile.verification?.trustScore || 20) - 20)
       };
    }
    
    // Reset Client Verification
    if (user.clientProfile) {
       user.clientProfile.isVerified = false;
       // Recalculate stats if needed, but mockAuth usually handles this on retrieval
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // 4. Verify User Identity (Admin Action - Approve)
  verifyUser: async (userId: string): Promise<User | null> => {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    
    if (index === -1) return null;

    const user = users[index];
    
    // Creator Verification
    if (user.profile) {
       user.profile.verification = {
         ...user.profile.verification,
         status: 'verified',
         isIdentityVerified: true,
         trustScore: 85 // Boost trust score for verified creators
       };
    }
    
    // Client Verification
    if (user.clientProfile) {
       user.clientProfile.isVerified = true;
       // Boost client trust score
       if (!user.clientProfile.stats) {
          user.clientProfile.stats = { contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', reliabilityScore: 0, avgResponseTime: '-', disputesWon: 0, disputesLost: 0, trustScore: 20 };
       }
       // Simple calc: base + 20 for verification
       user.clientProfile.stats.trustScore = Math.min(100, (user.clientProfile.stats.trustScore || 0) + 20);
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // 5. Reject Verification (Admin Action - Reject)
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

  // 7. Force Logout (Mock Implementation)
  forceLogout: async (userId: string): Promise<void> => {
    // In a real app, this would invalidate tokens on the server.
    // For local storage mock, we can't access the user's browser, but we can flag the user session.
    // We'll rely on the app checking user status on load/route change.
    await delay(200);
    console.log(`Force logout triggered for ${userId}`);
  }
};
