import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Line } from './map.service';

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

  constructor(private http: HttpClient) { }

  getUserJourneys(): Observable<Journey[]> {
    return this.http.get<Journey[]>(`${this.apiUrl}/journeys`);
  }

  bookJourney(journeyRequest: JourneyRequest): Observable<Journey> {
    return this.http.post<Journey>(`${this.apiUrl}/journeys`, journeyRequest);
  }
} 