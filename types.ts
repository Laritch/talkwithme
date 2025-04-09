// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'expert' | 'admin';
  profilePicture?: string;
  createdAt: string;
}

export interface Client extends User {
  role: 'client';
  bookings: string[]; // Array of session IDs
  paymentMethods: string[];
  preferredExperts: string[];
  notifications: boolean;
}

export interface Expert extends User {
  role: 'expert';
  specialty: string;
  bio: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  sessions: string[]; // Array of session IDs
  availability: Availability[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  languages: string[];
  expertise: string[];
  education: string[];
  certifications: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Session types
export interface Session {
  id: string;
  expertId: string;
  clientId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  type: 'video' | 'chat' | 'in-person';
  scheduledTime: string;
  endTime?: string;
  durationMinutes: number;
  topic: string;
  notes?: string;
  price: number;
  discountApplied?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  feedbackId?: string;
}

// Availability for experts
export interface Availability {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  isAvailable: boolean;
}

// Review types
export interface Review {
  id: string;
  sessionId: string;
  expertId: string;
  clientId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  isPublic: boolean;
}

// Payment types
export interface Payment {
  id: string;
  sessionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  method: 'credit_card' | 'bank_transfer' | 'wallet';
  transactionId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sessionId?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'session_reminder' | 'payment_received' | 'message_received' | 'session_canceled' | 'review_received';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Platform statistics
export interface PlatformStats {
  totalUsers: number;
  totalExperts: number;
  totalClients: number;
  totalSessions: number;
  totalRevenue: number;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
}

// Expert marketplace filters
export interface ExpertFilter {
  specialty?: string[];
  price?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  availability?: {
    day?: string;
    time?: string;
  };
  language?: string[];
}
