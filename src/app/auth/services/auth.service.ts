import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { jwtDecode } from 'jwt-decode';

export interface LoginRequest {
  email: string;
  password: string;
  'remember-me': boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface JwtPayload {
  sub: string; // username/email
  exp: number;
  iat: number;
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
          } else {
            sessionStorage.setItem('auth_token', response.token);
          }
          
          // Decode the JWT to get user information
          try {
            const decodedToken = jwtDecode<JwtPayload>(response.token);
            const email = decodedToken.sub;
            
            // Store basic user info
            const userInfo = {
              email: email,
              // Other user properties would need to be fetched from a user endpoint
              // or included in the JWT payload by the backend
            };
            
            if (request['remember-me']) {
              localStorage.setItem('user', JSON.stringify(userInfo));
            } else {
              sessionStorage.setItem('user', JSON.stringify(userInfo));
            }
            
            // Update auth state
            this.authStore.setAuthenticated(true);
            this.authStore.setUser(userInfo);
          } catch (error) {
            console.error('Error decoding JWT token', error);
          }
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
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token has expired
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error('Error validating token', error);
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
} 