
import { User, UserStatus } from '../types';

const USERS_KEY = 'ubuni_users_db';
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
         verifiedPlatforms: [],
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

  // 7. Verify Identity (Creator/Client)
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
        // Boost trust score if verified
        if (approved) {
             user.profile.verification.trustScore = Math.min(100, (user.profile.verification.trustScore || 0) + 30);
        }
    } else if (user.role === 'CLIENT' && user.clientProfile) {
        user.clientProfile.isVerified = approved;
         // Boost trust score if verified
        if (approved && user.clientProfile.stats) {
             user.clientProfile.stats.trustScore = Math.min(100, (user.clientProfile.stats.trustScore || 0) + 20);
        }
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Notify
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
        // Update global boolean if at least one is verified
        user.profile.verification.isSocialVerified = platforms.length > 0;
    }

    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Notify
    if (approved) {
         createNotification(userId, 'Social Media Verified', `Your ${platform} account has been verified.`, 'success');
    }
  }
};
