import { User, UserRole, AuthResponse, CreatorProfile, ClientType, ClientProfile } from '../types';

const USERS_KEY = 'ubuni_users_db';
const SESSION_KEY = 'ubuni_session';

// Simulating network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuth = {
  async signUp(email: string, password: string, name: string, role: UserRole): Promise<AuthResponse> {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const existingUser = users.find((u: any) => u.email === email);

    if (existingUser) {
      return { user: null, error: 'User already exists with this email.' };
    }

    // Initialize basic profile structures so they appear in search immediately
    const initialCreatorProfile: Partial<CreatorProfile> = role === UserRole.CREATOR ? {
      displayName: name,
      username: email.split('@')[0],
      bio: 'New creator on Ubuni.',
      location: 'Kenya',
      categories: [],
      socials: {},
      portfolio: { images: [], links: [] },
      experience: { years: '0', languages: ['English'], skills: [] },
      pricing: { model: 'negotiable', currency: 'KES', packages: [] },
      verification: { isIdentityVerified: false, isSocialVerified: false, trustScore: 0 }
    } : undefined;

    const initialClientProfile: Partial<ClientProfile> = role === UserRole.CLIENT ? {
      clientType: ClientType.INDIVIDUAL,
      businessName: name,
      location: 'Kenya',
      description: 'New client account.',
      stats: { contractsSent: 0, contractsCompleted: 0, hiringRate: '0%', reliabilityScore: 0, avgResponseTime: '-' }
    } : undefined;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      emailVerified: false,
      onboardingCompleted: false,
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

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

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

  async getCreatorProfile(userId: string): Promise<User | null> {
    await delay(400);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.id === userId);
    
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

  async deleteAccount(userId: string): Promise<void> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUsers = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    
    const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (currentSession && currentSession.id === userId) {
      localStorage.removeItem(SESSION_KEY);
    }
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