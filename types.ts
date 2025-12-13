// API Response structures derived from Swagger and usage context

// User/Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user?: User; 
}

// Site Type
export interface Site {
  siteId: string;
  name: string;
  timezone: string;
  country: string;
  city: string;
}

// Chart Data Types (Frontend formatted)
export interface ChartDataPoint {
  time: string; // Display time (e.g. "10:00")
  count?: number; // Total occupancy
  countFemale?: number;
  countMale?: number;
  timestamp?: number; // Raw timestamp for sorting if needed
}

// Analytics Request Payloads
export interface AnalyticsRequest {
  siteId: string;
  fromUtc: number; // epoch millis
  toUtc: number;   // epoch millis
}

export interface PaginationRequest extends AnalyticsRequest {
  pageNumber: number; // Changed from page
  pageSize: number;   // Changed from limit
}

// Entry/Exit Record from Backend (Matched to Swagger)
export interface EntryExitRecord {
  personId: string;
  personName: string;
  gender?: string;
  sex?: string;
  zoneId?: string;
  zoneName?: string;
  severity?: string;
  entryUtc: number;
  entryLocal?: string;
  exitUtc?: number;
  exitLocal?: string;
  dwellMinutes?: number;
}

// Real-time alert from socket
export interface Alert {
  id: string;
  personName: string;
  zoneName: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: number;
  type: 'entry' | 'exit';
}

// Mock Data Record (Frontend only)
export interface EntryRecord {
  id: string;
  name: string;
  sex: string;
  entryTime: string;
  exitTime: string;
  dwellTime: string;
  avatarUrl: string;
}

// Paginated Response Wrapper (Matched to Swagger)
export interface PaginatedResponse<T> {
  records: T[];
  totalRecords: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// Navigation View Types
export enum ViewState {
  OVERVIEW = 'overview',
  ENTRIES = 'entries',
}