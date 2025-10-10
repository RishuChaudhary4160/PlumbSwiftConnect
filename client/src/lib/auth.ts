import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'plumber' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    // Load auth state from localStorage on initialization
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedToken && savedUser) {
      try {
        this.token = savedToken;
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        this.clearAuth();
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data: AuthResponse = await response.json();
      
      this.setAuth(data.user, data.token);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'user' | 'plumber' | 'admin';
    address?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data: AuthResponse = await response.json();
      
      this.setAuth(data.user, data.token);
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.clearAuth();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.token;
  }

  private setAuth(user: User, token: string): void {
    this.currentUser = user;
    this.token = token;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.currentUser = null;
    this.token = null;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export const authService = new AuthService();

// Interceptor to add auth headers to requests
const originalApiRequest = apiRequest;
export async function authenticatedApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = authService.getToken();
  
  const response = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}
