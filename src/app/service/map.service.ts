import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface Line {
  id: number;
  code: string;
  fareMultiplier: number;
  stations: Station[];
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = 'http://localhost:8080/api';
  private openRouteServiceUrl = 'https://api.openrouteservice.org/v2/directions';
  private openRouteServiceKey = '5b3ce3597851110001cf62488cfbac96b2354dadab8b5a771a47e425';

  constructor(private http: HttpClient) {}

  getLines(): Observable<Line[]> {
    return this.http.get<Line[]>(`${this.apiUrl}/lines`);
  }

  getLine(id: number): Observable<Line> {
    return this.http.get<Line>(`${this.apiUrl}/lines/${id}`);
  }

  // Get route between two stations using OpenRouteService
  getRoute(start: Station, end: Station): Observable<any> {
    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude]
      ],
      format: 'geojson',
      profile: 'driving-car',
      preference: 'shortest'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.openRouteServiceKey
    });

    return this.http.post(`${this.openRouteServiceUrl}/driving-car`, body, { headers });
  }

  // Get all routes for a line (connects all stations in order)
  getLineRoutes(line: Line): Observable<any[]> {
    if (line.stations.length < 2) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const routeRequests = [];
    for (let i = 0; i < line.stations.length - 1; i++) {
      const start = line.stations[i];
      const end = line.stations[i + 1];
      routeRequests.push(this.getRoute(start, end));
    }

    return forkJoin(routeRequests);
  }
}
