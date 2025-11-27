
import React from 'react';

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
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export type UserStatus = 'active' | 'suspended' | 'banned';

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
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1-5
  paymentRating?: number; // 1-5, specific for clients
  comment?: string; // Optional now
  date: string;
  projectTitle?: string;
}

export interface MpesaDetails {
  type: 'personal' | 'till' | 'paybill';
  number: string; // Phone number or Till/Paybill number
  name?: string; // Account Name
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CryptoDetails {
  walletAddress: string;
  network: string; // e.g. USDT (TRC20), BTC, ETH
}

export interface PaymentMethods {
  mpesa?: MpesaDetails;
  bank?: BankDetails;
  crypto?: CryptoDetails;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  categories: string[];
  
  // Private Legal Details for KYC
  legalName?: string;
  dob?: string;
  mpesaNumber?: string;
  
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
    status: VerificationStatus; // New strict status
    rejectionReason?: string;
    isIdentityVerified: boolean; // Legacy boolean, kept for UI compatibility, derived from status
    isSocialVerified: boolean;
    verifiedPlatforms?: string[]; // List of specific platforms verified e.g., ['instagram', 'twitter']
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

  paymentMethods?: PaymentMethods;

  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
}

// --- Client Types ---

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL', // Small sellers, Solo entrepreneurs, Students
  BUSINESS = 'BUSINESS',     // Small business owners, Online shops, Startups
  COMPANY = 'COMPANY'        // Registered companies, Media houses, NGOs
}

export interface ClientStats {
  contractsSent: number;
  contractsCompleted: number;
  hiringRate: string; // e.g. "85%"
  reliabilityScore: number; // 0-100 (Payment reliability based on reviews)
  avgResponseTime: string; // e.g. "2 hours"
  disputesWon: number; // New
  disputesLost: number; // New
  trustScore: number; // 0-100 (Calculated aggregate)
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
  stats?: ClientStats;
  reviews?: Review[];
  savedCreatorIds?: string[]; // IDs of favorite creators
  averageRating?: number;
  totalReviews?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus; // 'active', 'suspended', 'banned'
  isFlagged?: boolean; // For admin review
  flagReason?: string;
  avatarUrl?: string;
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  onboardingCompleted?: boolean;
  hasSignedLegalAgreement?: boolean; // New field for fraud warning signature
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
  UNDER_REVIEW = 'UNDER_REVIEW', // Fixed contract work submitted
  PAYMENT_VERIFY = 'PAYMENT_VERIFY', // Fixed contract payment sent
  DISPUTED = 'DISPUTED', // Fixed contract disputed
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DECLINED = 'DECLINED'
}

export type ContractPaymentType = 'FIXED' | 'MILESTONE';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'PAYMENT_VERIFY' | 'PAID' | 'DISPUTED' | 'CANCELLED';

export interface MilestoneSubmission {
  type: 'link' | 'file';
  content: string; // URL or File Name
  note?: string;
  date: string;
}

export interface MilestonePaymentProof {
  content: string; // URL or text reference to image
  method: string; // e.g. M-Pesa
  date: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: MilestoneStatus;
  
  // Trust & Verification Fields
  submission?: MilestoneSubmission;
  paymentProof?: MilestonePaymentProof;
  revisionNotes?: string;
  disputeReason?: string;
  
  // Mutual Dispute Resolution
  disputeResolution?: {
    requestedBy: string; // User ID
    requestedByName: string;
    type: 'RESUME_WORK' | 'RETRY_PAYMENT'; // RESUME -> IN_PROGRESS, RETRY -> PAYMENT_VERIFY
    message: string;
  };
}

export interface ContractTerms {
  paymentType: ContractPaymentType;
  amount: number; // Total Contract Value
  currency: string;
  durationDays: number;
  deliverables: string[];
  milestones?: Milestone[]; // Only if paymentType is MILESTONE
  schedule: string; // General description or notes
  startDate: string;
  revisionPolicy?: string; // e.g., "2 Revisions", "Unlimited"
  
  // Deprecated fields kept optional for backward compatibility if needed, but logic removed
  deposit?: number; 
  
  // Previous terms for negotiation tracking
  previousTerms?: ContractTerms;
}

export interface ContractHistoryItem {
  id: string;
  date: string;
  action: string; // 'created', 'sent', 'counter_offer', 'accepted', etc.
  actorName: string;
  actionBy?: string; // User ID of the actor
  note?: string;
  attachment?: string; // For proofs
}

export interface ContractEndRequest {
  requesterId: string;
  requesterName: string;
  type: 'completion' | 'termination'; // Completion = happy path, Termination = cancel
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string; // Reason why the other party rejected the end request
  createdAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  description: string;
  status: ContractStatus;
  terms: ContractTerms;
  previousTerms?: ContractTerms; // Stores terms prior to the current counter-offer
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  history: ContractHistoryItem[];
  endRequest?: ContractEndRequest; // New field for mutual agreement
  
  // Review Status
  isClientReviewed?: boolean; // Has the client reviewed the creator?
  isCreatorReviewed?: boolean; // Has the creator reviewed the client?

  // Fixed Contract Specific State
  submission?: MilestoneSubmission;
  paymentProof?: MilestonePaymentProof;
  revisionNotes?: string;
  disputeReason?: string;
  disputeResolution?: {
    requestedBy: string;
    requestedByName: string;
    type: 'RESUME_WORK' | 'RETRY_PAYMENT';
    message: string;
  };
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
