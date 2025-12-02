
import { User, UserRole, AuthResponse, CreatorProfile, ClientType, ClientProfile, Contract, ContractStatus, Review, ClientStats } from '../types';

const USERS_KEY = 'ubuni_users_db';
const SESSION_KEY = 'ubuni_session';
const CONTRACTS_KEY = 'ubuni_contracts_db';

// Simulating network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Calculate Trust Score for Client
const calculateClientTrustScore = (profile: ClientProfile): number => {
  let score = 0;

  // 1. Identity Verification (20 pts)
  if (profile.isVerified) {
    score += 20;
  }

  // 2. Ratings & Reliability (30 pts)
  // Based on Average Rating (Max 15) and Payment Reliability (Max 15)
  if (profile.averageRating) {
    score += (profile.averageRating / 5) * 15;
  }
  if (profile.stats?.reliabilityScore) {
    score += (profile.stats.reliabilityScore / 100) * 15;
  }

  // 3. Payment/Work History (30 pts)
  const completed = profile.stats?.contractsCompleted || 0;
  if (completed >= 1) score += 10;
  if (completed >= 5) score += 10;
  if (completed >= 10) score += 10;

  // 4. Dispute History (20 pts)
  // Start with 20, deduct 10 for every lost dispute
  let disputeScore = 20;
  const lost = profile.stats?.disputesLost || 0;
  disputeScore -= (lost * 10);
  if (disputeScore < 0) disputeScore = 0;
  score += disputeScore;

  return Math.round(score);
};

export const mockAuth = {
  async signUp(email: string, password: string, name: string, role: UserRole): Promise<AuthResponse> {
    await delay(800);
    const normalizedEmail = email.toLowerCase();
    
    // Admin check - prevent signup as admin
    if (role === UserRole.ADMIN) {
      return { user: null, error: "Unauthorized role." };
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const existingUser = users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      const existingRole = existingUser.role === UserRole.CLIENT ? 'Client' : 'Creator';
      return { 
        user: null, 
        error: `This email is already registered as a ${existingRole}. You cannot create a ${role === UserRole.CLIENT ? 'Client' : 'Creator'} account with the same email.` 
      };
    }

    // Initialize basic profile structures so they appear in search immediately
    const initialCreatorProfile: Partial<CreatorProfile> = role === UserRole.CREATOR ? {
      displayName: name,
      username: normalizedEmail.split('@')[0],
      bio: 'New creator on Ubuni.',
      location: 'Kenya',
      categories: [],
      socials: {},
      portfolio: { images: [], links: [] },
      experience: { years: '0', languages: ['English'], skills: [] },
      pricing: { model: 'negotiable', currency: 'KES', packages: [] },
      // Initialize with 'unverified' status
      verification: { 
        status: 'unverified',
        isIdentityVerified: false, 
        isSocialVerified: false, 
        verifiedPlatforms: [],
        pendingSocials: [],
        trustScore: 0 
      },
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    } : undefined;

    const initialClientProfile: Partial<ClientProfile> = role === UserRole.CLIENT ? {
      clientType: ClientType.INDIVIDUAL,
      businessName: name,
      location: 'Kenya',
      description: 'New client account.',
      isVerified: false,
      verificationStatus: 'unverified',
      stats: { 
        contractsSent: 0, 
        contractsCompleted: 0, 
        hiringRate: '0%', 
        reliabilityScore: 0, 
        avgResponseTime: '-',
        disputesWon: 0,
        disputesLost: 0,
        trustScore: 20 // Base score for no disputes
      },
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    } : undefined;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name,
      role,
      status: 'active', // Default status
      isFlagged: false,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      emailVerified: false,
      onboardingCompleted: false,
      hasSignedLegalAgreement: false, // Default to false
      profile: initialCreatorProfile as CreatorProfile,
      clientProfile: initialClientProfile as ClientProfile
    };

    // Save to "DB"
    users.push({ ...newUser, password }); 
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Set session
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    // NEW: Welcome Notification
    // Manually pushing to DB to avoid circular dependency with mockContract
    const notifications = JSON.parse(localStorage.getItem('ubuni_notifications_db') || '[]');
    notifications.push({
      id: `n-${Date.now()}-welcome`,
      userId: newUser.id,
      title: 'Welcome to Ubuni Connect! 🚀',
      message: `Hi ${name.split(' ')[0]}, we're thrilled to have you. Complete your profile to start exploring.`,
      type: 'success',
      read: false,
      date: new Date().toISOString(),
      link: role === UserRole.CREATOR ? '/creator/settings' : '/client/settings'
    });
    localStorage.setItem('ubuni_notifications_db', JSON.stringify(notifications));

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await delay(800);
    const normalizedEmail = email.toLowerCase();

    // --- HARDCODED ADMIN BACKDOOR ---
    if (normalizedEmail === 'super@ubuni.co.ke' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-super-id',
        email: 'super@ubuni.co.ke',
        name: 'Super Admin',
        role: UserRole.ADMIN,
        status: 'active',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        phoneVerified: true,
        onboardingCompleted: true,
        hasSignedLegalAgreement: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      return { user: adminUser, error: null };
    }
    // --------------------------------

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === normalizedEmail && u.password === password);

    if (!user) {
      return { user: null, error: 'Invalid email or password.' };
    }

    // NOTE: Suspended/Banned users allowed to login to see their dashboard status.
    
    // Remove password from session object
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));

    return { user: userWithoutPassword, error: null };
  },

  async signOut(): Promise<void> {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<User | null> {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    await delay(600);
    
    // Check if Admin session (mock)
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession.role === UserRole.ADMIN) {
       return currentSession; // No profile updates for admin mock
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);

    if (userIndex === -1) return null;

    // Deep merge profile if it exists in updates
    let updatedUser = { ...users[userIndex], ...updates };
    
    if (updates.profile) {
       updatedUser.profile = { ...(users[userIndex].profile || {}), ...updates.profile };
       // Sync boolean property for backward compatibility if verification status updates
       if (updates.profile.verification?.status) {
         updatedUser.profile.verification.isIdentityVerified = updates.profile.verification.status === 'verified';
       }
    }
    
    if (updates.clientProfile) {
       updatedUser.clientProfile = { ...(users[userIndex].clientProfile || {}), ...updates.clientProfile };
       
       // Sync boolean property for backward compatibility if verification status updates
       if (updates.clientProfile.verificationStatus) {
         updatedUser.clientProfile.isVerified = updates.clientProfile.verificationStatus === 'verified';
       }

       // Recalculate Trust Score if client profile updated
       if (updatedUser.role === UserRole.CLIENT) {
         if (!updatedUser.clientProfile.stats) {
           updatedUser.clientProfile.stats = { contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', reliabilityScore: 0, avgResponseTime: '-', disputesWon: 0, disputesLost: 0, trustScore: 20 };
         }
         updatedUser.clientProfile.stats.trustScore = calculateClientTrustScore(updatedUser.clientProfile);
       }
    }

    users[userIndex] = updatedUser;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update session if it's the current user
    if (currentSession.id === userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  async requestSocialVerification(userId: string, platform: string): Promise<User | null> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) return null;
    
    const user = users[userIndex];
    if (!user.profile) return null; // Should be a creator

    // Ensure structure exists
    if (!user.profile.verification) {
        user.profile.verification = { status: 'unverified', isIdentityVerified: false, isSocialVerified: false, trustScore: 0, pendingSocials: [], verifiedPlatforms: [] };
    }
    if (!user.profile.verification.pendingSocials) user.profile.verification.pendingSocials = [];

    // Add to pending if not already there and not verified
    if (!user.profile.verification.pendingSocials.includes(platform) && 
        !user.profile.verification.verifiedPlatforms?.includes(platform)) {
        user.profile.verification.pendingSocials.push(platform);
    }

    users[userIndex] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update Session
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession.id === userId) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    return user;
  },

  async signLegalAgreement(userId: string): Promise<User | null> {
    await delay(500);
    return this.updateUserProfile(userId, { hasSignedLegalAgreement: true });
  },

  async addUserReview(userId: string, review: Review): Promise<void> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) return;
    
    const user = users[userIndex];
    let profileToUpdate = user.role === UserRole.CREATOR ? user.profile : user.clientProfile;
    
    if (!profileToUpdate) return; // Should not happen

    // Add review to list
    if (!profileToUpdate.reviews) profileToUpdate.reviews = [];
    profileToUpdate.reviews.unshift(review); // Add to top

    // Recalculate Average Rating
    const totalReviews = profileToUpdate.reviews.length;
    const sumRatings = profileToUpdate.reviews.reduce((acc: number, r: Review) => acc + r.rating, 0);
    profileToUpdate.averageRating = parseFloat((sumRatings / totalReviews).toFixed(1));
    profileToUpdate.totalReviews = totalReviews;

    // If Client, Calculate Payment Reliability Score and Trust Score
    if (user.role === UserRole.CLIENT && user.clientProfile) {
       const reviewsWithPayment = profileToUpdate.reviews.filter((r: Review) => r.paymentRating !== undefined);
       if (reviewsWithPayment.length > 0) {
          const sumPayment = reviewsWithPayment.reduce((acc: number, r: Review) => acc + (r.paymentRating || 0), 0);
          const avgPayment = sumPayment / reviewsWithPayment.length;
          // Convert 5 star to 100% score
          if (!user.clientProfile.stats) {
             user.clientProfile.stats = { 
               contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', 
               reliabilityScore: 0, avgResponseTime: '-', disputesWon: 0, disputesLost: 0, trustScore: 20
             };
          }
          user.clientProfile.stats.reliabilityScore = Math.round((avgPayment / 5) * 100);
          
          // Recalc Trust Score
          user.clientProfile.stats.trustScore = calculateClientTrustScore(user.clientProfile);
       }
    }

    users[userIndex] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  async getCreatorProfile(userId: string): Promise<User | null> {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) return null;
    
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    // Case insensitive match
    const user = users.find((u: User) => u.profile?.username?.toLowerCase() === username.toLowerCase());
    
    if (!user) return null;
    
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async getClientProfile(userId: string): Promise<User | null> {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) return null;

    // Recalculate stats on the fly to ensure freshness if needed (mock specific)
    if (user.role === UserRole.CLIENT && user.clientProfile) {
       if (!user.clientProfile.stats) {
         user.clientProfile.stats = { 
           contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', 
           reliabilityScore: 0, avgResponseTime: '-', disputesWon: 0, disputesLost: 0, trustScore: 20 
         };
       }
       user.clientProfile.stats.trustScore = calculateClientTrustScore(user.clientProfile);
    }
    
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    await delay(500);

    // Check for active contracts
    const contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY) || '[]');
    const hasActiveContracts = contracts.some((c: Contract) => 
      (c.clientId === userId || c.creatorId === userId) && 
      [ContractStatus.ACTIVE, ContractStatus.ACCEPTED, ContractStatus.SENT, ContractStatus.NEGOTIATING].includes(c.status)
    );

    if (hasActiveContracts) {
      return { 
        success: false, 
        error: "Cannot delete account while you have active or ongoing contracts. Please complete or cancel them first." 
      };
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUsers = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession && currentSession.id === userId) {
      localStorage.removeItem(SESSION_KEY);
    }

    return { success: true };
  },

  async searchCreators(query?: string, category?: string): Promise<User[]> {
    await delay(600);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // STRICTLY filter only users with CREATOR role AND active status (Not banned/suspended)
    let creators = users.filter((u: User) => u.role === UserRole.CREATOR && u.status !== 'banned' && u.status !== 'suspended');

    // Filter creators who are VERIFIED
    creators = creators.filter((c: User) => c.profile?.verification?.status === 'verified');

    if (query) {
      const q = query.toLowerCase();
      creators = creators.filter((c: User) => 
        c.name.toLowerCase().includes(q) || 
        c.profile?.bio?.toLowerCase().includes(q) ||
        c.profile?.categories?.some(cat => cat.toLowerCase().includes(q)) ||
        // Also search in skills
        c.profile?.experience?.skills?.some(skill => skill.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      creators = creators.filter((c: User) => 
        c.profile?.categories?.includes(category)
      );
    }

    return creators.map(({ password, ...u }: any) => u);
  },

  async toggleSavedCreator(clientId: string, creatorId: string): Promise<User | null> {
    // await delay(100); // Fast toggle
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const clientIndex = users.findIndex((u: User) => u.id === clientId);

    if (clientIndex === -1) return null;

    const client = users[clientIndex];
    if (!client.clientProfile) client.clientProfile = {};
    
    const saved = client.clientProfile.savedCreatorIds || [];
    const isSaved = saved.includes(creatorId);
    
    if (isSaved) {
      client.clientProfile.savedCreatorIds = saved.filter((id: string) => id !== creatorId);
    } else {
      client.clientProfile.savedCreatorIds = [...saved, creatorId];
    }

    users[clientIndex] = client;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update Session Immediately to reflect in UI
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession.id === clientId) {
      // Merge updates
      currentSession.clientProfile = { ...currentSession.clientProfile, savedCreatorIds: client.clientProfile.savedCreatorIds };
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
    }

    return client;
  }
};
