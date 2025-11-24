

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

export enum UserRole {
  CREATOR = 'CREATOR',
  CLIENT = 'CLIENT'
}

export interface ServicePackage {
  id: string;
  title: string;
  description: string;
  price: number;
  deliveryTimeDays: number;
  features: string[];
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  categories: string[];
  
  socials: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    facebook?: string;
  };
  
  socialStats?: {
    totalFollowers: string;
    engagementRate: string;
    avgViews?: string;
  };

  portfolio: {
    images: string[];
    links: string[];
  };
  
  experience: {
    years: string;
    languages: string[];
    skills: string[];
  };

  verification?: {
    isIdentityVerified: boolean;
    isSocialVerified: boolean;
    trustScore: number; // 0-100
    bioCode?: string; // The code they need to put in bio
  };

  pricing?: {
    model: 'fixed' | 'range' | 'negotiable';
    currency: string;
    minRate?: number;
    maxRate?: number;
    startingAt?: number;
    packages: ServicePackage[];
  };

  reviews?: Review[];
}

// --- Client Types ---

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL', // Small sellers, Solo entrepreneurs, Students
  BUSINESS = 'BUSINESS',     // Small business owners, Online shops, Startups
  COMPANY = 'COMPANY'        // Registered companies, Media houses, NGOs
}

export interface ClientProfile {
  clientType: ClientType;
  businessName?: string; // Optional for Individuals
  website?: string;
  location?: string;
  description: string;
  industry?: string;
  budgetRange?: string; // e.g., "KES 10k - 50k"
  isVerified?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  onboardingCompleted?: boolean;
  profile?: CreatorProfile; // Stores creator-specific data
  clientProfile?: ClientProfile; // Stores client-specific data
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

// --- Contract & Communication Types ---

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT', // Client sent to creator
  NEGOTIATING = 'NEGOTIATING', // Counter-offer made
  ACCEPTED = 'ACCEPTED', // Both agreed
  ACTIVE = 'ACTIVE', // Work in progress
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DECLINED = 'DECLINED'
}

export interface ContractTerms {
  amount: number;
  currency: string;
  durationDays: number;
  deliverables: string[];
  schedule: string; // Description of milestones
  startDate: string;
}

export interface ContractHistoryItem {
  id: string;
  date: string;
  action: string; // 'created', 'sent', 'counter_offer', 'accepted', etc.
  actorName: string;
  note?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  creatorId: string;
  title: string;
  description: string;
  status: ContractStatus;
  terms: ContractTerms;
  createdAt: string;
  updatedAt: string;
  history: ContractHistoryItem[];
}

export interface Message {
  id: string;
  contractId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; url: string }[];
  isSystemMessage?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  link?: string;
}

export interface DashboardStats {
  activeContracts: number;
  pendingOffers: number;
  totalEarnings: number;
  profileViews: number;
  completionPercentage: number;
}