import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Line } from './map.service';
import { AuthService } from '../auth/services/auth.service';

export interface Station {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Journey {
  id: number;
  startStation: Station;
  endStation: Station;
  startTime: string;
  endTime: string | null;
  status: 'PLANNED' | 'PURCHASED' | 'COMPLETED' | 'CANCELLED';
  distanceKm: number;
  fare: number;
  line: Line;
  user: User;
  error: string | null;
}

export interface JourneyRequest {
  startStationId: number;
  endStationId: number;
  lineId: number;
}

export interface ApiError {
  error: string;
  path?: string;
  status?: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JourneyService {
  private apiUrl = 'http://localhost:8080/api';
  private authService = inject(AuthService);

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Auth token when building headers:', token ? 'exists' : 'missing');
    if (token) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      console.log('Request headers:', headers.keys());
      return headers;
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getUserJourneys(): Observable<Journey[]> {
    return this.http.get<Journey[]>(`${this.apiUrl}/journeys`, {
      headers: this.getHeaders()
    }).pipe(
      tap(journeys => console.log('Fetched journeys:', journeys.length)),
      catchError(this.handleError('getUserJourneys'))
    );
  }

  bookJourney(journeyRequest: JourneyRequest): Observable<Journey> {
    console.log('Booking journey with request:', journeyRequest);
    return this.http.post<Journey>(`${this.apiUrl}/journeys`, journeyRequest, {
      headers: this.getHeaders()
    }).pipe(
      tap(journey => console.log('Journey booked successfully, ID:', journey.id)),
      catchError(this.handleError('bookJourney'))
    );
  }

  startJourney(journeyId: number): Observable<Journey> {
    return this.http.put<Journey>(`${this.apiUrl}/journeys/${journeyId}/start`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(journey => console.log('Journey started, ID:', journey.id)),
      catchError(this.handleError('startJourney'))
    );
  }

  completeJourney(journeyId: number): Observable<Journey> {
    return this.http.put<Journey>(`${this.apiUrl}/journeys/${journeyId}/complete`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(journey => console.log('Journey completed, ID:', journey.id)),
      catchError(this.handleError('completeJourney'))
    );
  }

  cancelJourney(journeyId: number): Observable<Journey> {
    return this.http.put<Journey>(`${this.apiUrl}/journeys/${journeyId}/cancel`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(journey => console.log('Journey cancelled, ID:', journey.id)),
      catchError(this.handleError('cancelJourney'))
    );
  }

  payForJourney(journeyId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/journey/${journeyId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Journey payment successful:', response)),
      catchError(this.handleError('payForJourney'))
    );
  }

  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'An error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (typeof error.error === 'object' && error.error !== null) {
          // Try to extract the error message from the response
          if (error.error.error) {
            // Direct error message from server
            errorMessage = error.error.error;
          } else if (error.error.message) {
            // Some APIs use message field
            errorMessage = error.error.message;
          } else {
            // Fallback
            errorMessage = `Server returned code ${error.status}`;
          }
          console.error('API Error details:', error.error);
        } else if (typeof error.error === 'string') {
          // Sometimes error comes as a string
          try {
            // Try to parse it as JSON
            const parsed = JSON.parse(error.error);
            errorMessage = parsed.error || parsed.message || `Server error: ${error.error}`;
          } catch (e) {
            // If it's not valid JSON, use the string directly
            errorMessage = error.error || `Server returned code ${error.status}`;
          }
        } else {
          errorMessage = `Server returned code ${error.status}, message: ${error.message}`;
        }
        
        // Log request details for debugging
        console.error('Request that caused the error:', {
          url: error.url,
          headers: error.headers,
          status: error.status,
          statusText: error.statusText
        });
      }

      // Let the app keep running by returning an error Observable
      return throwError(() => new Error(errorMessage));
    };
  }
} 