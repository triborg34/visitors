export type Role = 'ADMIN' | 'EMPLOYEE';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type RequestType =
  | 'PRICE_INQUIRY'
  | 'CATALOG'
  | 'TECHNICAL_CONSULTATION'
  | 'PARTNERSHIP'
  | 'OTHER';
export type Priority = 'HOT' | 'WARM' | 'NORMAL';
export type FollowUpStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATION' | 'FINALIZED' | 'REJECTED';
export type Platform = 'BALE' | 'EITAA' | 'WHATSAPP' | 'TELEGRAM' | 'NONE';
export type ExhibitionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
export type MessageStatus =
  | 'NOT_REQUESTED'
  | 'PREPARED'
  | 'OPENED'
  | 'CONFIRMED_SENT'
  | 'API_SENT'
  | 'FAILED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  activeExhibitionId?: string | null;
  activeExhibition?: { id: string; name: string } | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  registeredVisits?: number;
}

export interface Exhibition {
  id: string;
  name: string;
  location?: string | null;
  startDate: string;
  endDate: string;
  description?: string | null;
  status: ExhibitionStatus;
  visitCount?: number;
  createdAt?: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  gender: Gender;
  company?: string | null;
  mobile: string;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  visits?: Visit[];
}

export interface Visit {
  id: string;
  visitorId: string;
  exhibition: { id: string; name: string };
  employee: { id: string; fullName: string };
  assignedEmployee?: { id: string; fullName: string } | null;
  requestType: RequestType;
  priority: Priority;
  followUpStatus: FollowUpStatus;
  sendThankYou: boolean;
  preferredPlatform?: Platform | null;
  marketingConsent: boolean;
  notes?: string | null;
  createdAt: string;
  followUps?: FollowUp[];
  messageLogs?: MessageLog[];
}

export interface VisitListItem {
  id: string;
  visitorId: string;
  fullName: string;
  gender: Gender;
  company?: string | null;
  mobile: string;
  exhibition: { id: string; name: string };
  employee: { id: string; fullName: string };
  assignedEmployee?: { id: string; fullName: string } | null;
  requestType: RequestType;
  priority: Priority;
  followUpStatus: FollowUpStatus;
  sendThankYou: boolean;
  preferredPlatform?: Platform | null;
  marketingConsent: boolean;
  notes?: string | null;
  createdAt: string;
  followUpCount: number;
  messageCount: number;
}

export interface FollowUp {
  id: string;
  visitId: string;
  status: FollowUpStatus;
  note?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  assignedEmployeeId?: string | null;
  assignedEmployee?: { id: string; fullName: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  createdAt: string;
  visit?: {
    id: string;
    followUpStatus: FollowUpStatus;
    priority: Priority;
    visitor: { id: string; fullName: string; mobile: string; company?: string | null };
    exhibition: { id: string; name: string };
  };
}

export interface MessageTemplate {
  id: string;
  key: string;
  title: string;
  body: string;
  platform?: Platform | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface MessageLog {
  id: string;
  visitId: string;
  visitorId: string;
  platform: Platform;
  templateKey?: string | null;
  body: string;
  status: MessageStatus;
  error?: string | null;
  createdAt: string;
  createdBy?: { id: string; fullName: string } | null;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  catalogUrl?: string | null;
  defaultPlatform: Platform;
  updatedAt?: string;
}

export type MessagingConnectionStatus = 'UNTESTED' | 'CONNECTED' | 'FAILED' | 'DISABLED';

export interface MessagingConnection {
  id: string | null;
  platform: string;
  info: { name: string; docsUrl: string; guideUrl: string };
  status: MessagingConnectionStatus;
  apiToken: string | null;
  botId: string | null;
  note?: string | null;
  linkTemplate?: string | null;
  testedAt?: string | null;
}

export interface DuplicateInfo {
  exists: boolean;
  visitorId?: string;
  fullName?: string;
  company?: string;
  mobile?: string;
  firstRegisteredAt?: string;
  totalVisits?: number;
  lastVisit?: {
    id: string;
    exhibitionName: string;
    employeeName: string;
    createdAt: string;
    followUpStatus: FollowUpStatus;
  };
}

export interface Stats {
  totalVisits: number;
  uniqueVisitors: number;
  todayCount: number;
  hotLeads: number;
  awaitingFollowUp: number;
  consentGranted: number;
  consentRate: number;
  byExhibition: Array<{ id: string; name: string; count: number }>;
  byEmployee: Array<{ id: string; name: string; count: number }>;
  byRequestType: Array<{ key: RequestType; count: number }>;
  byPriority: Array<{ key: Priority; count: number }>;
  byFollowUpStatus: Array<{ key: FollowUpStatus; count: number }>;
  byPlatform: Array<{ key: Platform; name: string; count: number }>;
  messageStatus: Array<{ key: MessageStatus; count: number }>;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PageMeta;
  message?: string;
}
