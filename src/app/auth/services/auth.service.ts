import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthStore } from '../store/auth.store';

export interface LoginRequest {
  email: string;
  password: string;
  'remember-me': boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          // Store token in localStorage or sessionStorage based on remember-me
          if (request['remember-me']) {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
          } else {
            sessionStorage.setItem('auth_token', response.token);
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }
          
          // Update auth state
          this.authStore.setAuthenticated(true);
          this.authStore.setUser(response.user);
        })
      );
  }

  logout(): void {
    // Clear storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    
    // Update auth state
    this.authStore.setAuthenticated(false);
    this.authStore.setUser(null);
  }

  isAuthenticated(): boolean {
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
} 