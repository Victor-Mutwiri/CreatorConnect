import { User, UserRole, AuthResponse, CreatorProfile, ClientType, ClientProfile, Contract, ContractStatus, Review } from '../types';

const USERS_KEY = 'ubuni_users_db';
const SESSION_KEY = 'ubuni_session';
const CONTRACTS_KEY = 'ubuni_contracts_db';

// Simulating network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuth = {
  async signUp(email: string, password: string, name: string, role: UserRole): Promise<AuthResponse> {
    await delay(800);
    const normalizedEmail = email.toLowerCase();
    
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
      verification: { isIdentityVerified: false, isSocialVerified: false, trustScore: 0 },
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    } : undefined;

    const initialClientProfile: Partial<ClientProfile> = role === UserRole.CLIENT ? {
      clientType: ClientType.INDIVIDUAL,
      businessName: name,
      location: 'Kenya',
      description: 'New client account.',
      stats: { contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', reliabilityScore: 0, avgResponseTime: '-' },
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    } : undefined;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name,
      role,
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

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await delay(800);
    const normalizedEmail = email.toLowerCase();

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === normalizedEmail && u.password === password);

    if (!user) {
      return { user: null, error: 'Invalid email or password.' };
    }

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
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);

    if (userIndex === -1) return null;

    // Deep merge profile if it exists in updates
    let updatedUser = { ...users[userIndex], ...updates };
    
    if (updates.profile) {
       updatedUser.profile = { ...(users[userIndex].profile || {}), ...updates.profile };
    }
    
    if (updates.clientProfile) {
       updatedUser.clientProfile = { ...(users[userIndex].clientProfile || {}), ...updates.clientProfile };
    }

    users[userIndex] = updatedUser;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update session if it's the current user
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession.id === userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
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

    // If Client, Calculate Payment Reliability Score
    if (user.role === UserRole.CLIENT && user.clientProfile) {
       const reviewsWithPayment = profileToUpdate.reviews.filter((r: Review) => r.paymentRating !== undefined);
       if (reviewsWithPayment.length > 0) {
          const sumPayment = reviewsWithPayment.reduce((acc: number, r: Review) => acc + (r.paymentRating || 0), 0);
          const avgPayment = sumPayment / reviewsWithPayment.length;
          // Convert 5 star to 100% score
          if (!user.clientProfile.stats) {
             user.clientProfile.stats = { 
               contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', 
               reliabilityScore: 0, avgResponseTime: '-' 
             };
          }
          user.clientProfile.stats.reliabilityScore = Math.round((avgPayment / 5) * 100);
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
    
    // STRICTLY filter only users with CREATOR role
    let creators = users.filter((u: User) => u.role === UserRole.CREATOR);

    if (query) {
      const q = query.toLowerCase();
      creators = creators.filter((c: User) => 
        c.name.toLowerCase().includes(q) || 
        c.profile?.bio?.toLowerCase().includes(q) ||
        c.profile?.categories?.some(cat => cat.toLowerCase().includes(q))
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
    await delay(300);
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

    // Update Session
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession.id === clientId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(client));
    }

    return client;
  }
};