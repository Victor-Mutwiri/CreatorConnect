

import { User, UserRole, AuthResponse, CreatorProfile, ClientType, ClientProfile } from '../types';

const USERS_KEY = 'ubuni_users_db';
const SESSION_KEY = 'ubuni_session';

// Simulating network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to seed creator data for search functionality
const seedCreators = (existingUsers: User[]): User[] => {
  if (existingUsers.some(u => u.role === UserRole.CREATOR && u.id.startsWith('c-seed'))) {
    return existingUsers;
  }

  const dummyCreators: User[] = [
    {
      id: 'c-seed-1',
      name: 'Sarah Kamau',
      email: 'sarah@example.com',
      role: UserRole.CREATOR,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      profile: {
        username: 'sarah_styles',
        displayName: 'Sarah Kamau',
        bio: 'Fashion and lifestyle content creator based in Nairobi. I help brands tell their stories through aesthetic visuals.',
        location: 'Nairobi, Kenya',
        categories: ['Fashion', 'Lifestyle', 'Beauty'],
        socials: { instagram: 'sarah_styles', tiktok: 'sarah.k' },
        socialStats: { totalFollowers: '45.2K', engagementRate: '5.2%' },
        portfolio: { images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80'], links: [] },
        experience: { years: '3-5', languages: ['English', 'Swahili'], skills: ['Photography', 'Styling'] },
        pricing: {
          model: 'range',
          currency: 'KES',
          minRate: 15000,
          maxRate: 50000,
          packages: []
        },
        verification: { isIdentityVerified: true, isSocialVerified: true, trustScore: 95 }
      }
    },
    {
      id: 'c-seed-2',
      name: 'David Ochieng',
      email: 'david@example.com',
      role: UserRole.CREATOR,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      profile: {
        username: 'tech_dave',
        displayName: 'Dave Tech',
        bio: 'Tech reviewer and gadget enthusiast. Unboxing the latest tech in Kenya.',
        location: 'Mombasa, Kenya',
        categories: ['Tech', 'Education', 'Gaming'],
        socials: { youtube: 'davetech', twitter: 'davetech' },
        socialStats: { totalFollowers: '120K', engagementRate: '3.8%' },
        portfolio: { images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80'], links: [] },
        experience: { years: '5+', languages: ['English'], skills: ['Video Editing', 'Scriptwriting'] },
        pricing: {
          model: 'fixed',
          currency: 'KES',
          startingAt: 30000,
          packages: []
        },
        verification: { isIdentityVerified: true, isSocialVerified: false, trustScore: 80 }
      }
    },
    {
      id: 'c-seed-3',
      name: 'Amani Wanjiku',
      email: 'amani@example.com',
      role: UserRole.CREATOR,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      profile: {
        username: 'amani_eats',
        displayName: 'Amani Wanjiku',
        bio: 'Exploring the best food spots in Nairobi. Food photographer and recipe developer.',
        location: 'Nairobi, Westlands',
        categories: ['Food', 'Lifestyle'],
        socials: { instagram: 'amani_eats' },
        socialStats: { totalFollowers: '28K', engagementRate: '6.5%' },
        portfolio: { images: ['https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=80'], links: [] },
        experience: { years: '1-3', languages: ['English', 'Swahili'], skills: ['Food Styling', 'Photography'] },
        pricing: {
          model: 'negotiable',
          currency: 'KES',
          packages: []
        },
        verification: { isIdentityVerified: false, isSocialVerified: true, trustScore: 60 }
      }
    }
  ];

  return [...existingUsers, ...dummyCreators];
};


export const mockAuth = {
  async signUp(email: string, password: string, name: string, role: UserRole): Promise<AuthResponse> {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const existingUser = users.find((u: any) => u.email === email);

    if (existingUser) {
      return { user: null, error: 'User already exists with this email.' };
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      emailVerified: false,
      onboardingCompleted: false
    };

    // Save to "DB"
    users.push({ ...newUser, password }); // In a real app, never store plain text passwords
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Set session
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await delay(800);

    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Seed creators if empty (just so the demo works better)
    if (users.length === 0 || !users.some((u: User) => u.role === UserRole.CREATOR && u.id.startsWith('c-seed'))) {
       users = seedCreators(users);
       localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

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
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Ensure seeds exist
    users = seedCreators(users);

    const user = users.find((u: User) => u.id === userId);
    
    if (!user) return null;
    
    // Return sanitized user (no password)
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async getClientProfile(userId: string): Promise<User | null> {
    await delay(400);
    // For demo purposes, if the ID is "client-1" or "client-2" (seeded in mockContract), 
    // we generate a fake profile if not in local storage.
    
    if (userId === 'client-1') {
      return {
        id: 'client-1',
        email: 'marketing@safaricom.co.ke',
        name: 'Safaricom PLC',
        role: UserRole.CLIENT,
        createdAt: new Date().toISOString(),
        avatarUrl: 'https://ui-avatars.com/api/?name=Safaricom&background=059b5a&color=fff',
        clientProfile: {
          clientType: ClientType.COMPANY,
          businessName: 'Safaricom PLC',
          location: 'Nairobi, Westlands',
          website: 'https://safaricom.co.ke',
          industry: 'Telecommunications',
          description: 'Safaricom is the leading telecommunications company in Kenya, providing a wide range of services including mobile voice, messaging, data, financial services and enterprise solutions.',
          budgetRange: 'KES 100k+',
          isVerified: true,
          stats: {
            contractsSent: 145,
            contractsCompleted: 132,
            hiringRate: '92%',
            reliabilityScore: 98,
            avgResponseTime: '4 hours'
          },
          reviews: [
            {
              id: 'r1',
              reviewerId: 'u1',
              reviewerName: 'Sarah K.',
              rating: 5,
              comment: 'Excellent to work with. Clear briefs and timely payments.',
              date: new Date(Date.now() - 1000000000).toISOString(),
              projectTitle: 'Chapa Dimba Campaign'
            },
            {
              id: 'r2',
              reviewerId: 'u2',
              reviewerName: 'Brian M.',
              rating: 4,
              comment: 'Great exposure, slight delay in initial approval but smooth sailing after.',
              date: new Date(Date.now() - 2000000000).toISOString(),
              projectTitle: '5G Launch'
            }
          ]
        }
      };
    }

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
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Seed if empty so dashboard looks good
    users = seedCreators(users);
    
    let creators = users.filter((u: User) => u.role === UserRole.CREATOR && u.profile);

    if (query) {
      const q = query.toLowerCase();
      creators = creators.filter((c: User) => 
        c.name.toLowerCase().includes(q) || 
        c.profile?.bio.toLowerCase().includes(q) ||
        c.profile?.categories.some(cat => cat.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      creators = creators.filter((c: User) => 
        c.profile?.categories.includes(category)
      );
    }

    // Sanitize
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