
import { User, UserRole, AuthResponse, CreatorProfile } from '../types';

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
    
    // Return sanitized user (no password)
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
  }
};