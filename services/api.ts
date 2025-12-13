import { AnalyticsRequest, AuthResponse, CreateUserRequest, CreateUserResponse, PaginatedResponse, PaginationRequest, Site } from "../types";

const BASE_URL = 'https://hiring-dev.internal.kloudspot.com/api';

// Core API Service
// Handling all the authenticated requests and error logic here.
class ApiService {
  private token: string | null = null;

  constructor() {
    // Checking if we already have a token in storage
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Generic request handler to avoid repeating fetch logic
  private async request<T>(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Attaching token if user is logged in
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        // If 401, token is probably dead. Logout user.
        if (response.status === 401) {
          this.clearToken();
          window.location.reload();
          throw new Error('Session expired. Please login again.');
        }

        // Sometimes API returns error in different formats, handling that here
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && (errorData.message || errorData.errorMessage)) {
                errorMessage = errorData.message || errorData.errorMessage;
            }
        } catch (e) {
            // response was not json, ignoring
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // Just throwing it up so components can handle UI states
      throw error;
    }
  }

  // --- Auth ---

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', 'POST', { email, password });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  // --- Sites ---

  async getSites(): Promise<Site[]> {
    return this.request<Site[]>('/sites', 'GET');
  }

  // Triggering the simulation on backend
  async startSimulation(): Promise<any> {
    return this.request('/sim/start', 'GET');
  }

  // --- Analytics ---

  async getFootfall(payload: AnalyticsRequest): Promise<{ footfall: number }> {
    return this.request('/analytics/footfall', 'POST', payload);
  }

  async getDwellTime(payload: AnalyticsRequest): Promise<{ avgDwellMinutes: number }> {
    return this.request('/analytics/dwell', 'POST', payload);
  }

  async getOccupancyTrends(payload: AnalyticsRequest): Promise<any[]> {
    return this.request('/analytics/occupancy', 'POST', payload);
  }

  async getDemographics(payload: AnalyticsRequest): Promise<any[]> {
    return this.request('/analytics/demographics', 'POST', payload);
  }

  async getEntries(payload: PaginationRequest): Promise<PaginatedResponse<any>> {
    return this.request('/analytics/entry-exit', 'POST', payload);
  }

  // --- User Management ---

  async createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
    return this.request('/user/create', 'POST', payload);
  }
}

export const api = new ApiService();