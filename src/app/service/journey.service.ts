import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
    });
  }

  bookJourney(journeyRequest: JourneyRequest): Observable<Journey> {
    return this.http.post<Journey>(`${this.apiUrl}/journeys`, journeyRequest, {
      headers: this.getHeaders()
    });
  }
} 