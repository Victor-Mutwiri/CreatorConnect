
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

  // 3. Reset Social/Identity Verification
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

  // 5. Force Logout (Mock)
  // In a real app, this would invalidate refresh tokens.
  // Here, we can't touch the client's localStorage directly from another browser instance.
  // We rely on the status check in `mockAuth.getSession` or `ProtectedRoute` to eventually catch it.
  forceLogout: async (userId: string): Promise<void> => {
     await delay(300);
     console.log(`[MockAdmin] Force logout signal sent for user ${userId}`);
     return;
  }
};
