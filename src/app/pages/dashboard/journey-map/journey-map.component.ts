import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MapService, Line, Station } from '../../../service/map.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-journey-map',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './journey-map.component.html'
})
export class JourneyMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapService = inject(MapService);
  private map: L.Map | undefined;
  private stationMarkers: L.Marker[] = [];
  private routeLines: L.Polyline[] = [];
  
  lines: Line[] = [];
  selectedLineId: number | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadLines();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Create Leaflet map
    this.map = L.map('map').setView([36.8065, 10.1815], 12); // Default: Tunis, Tunisia

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadLines(): void {
    this.loading = true;
    this.mapService.getLines().subscribe({
      next: (lines) => {
        this.lines = lines;
        this.loading = false;
        
        if (lines.length > 0 && !this.selectedLineId) {
          this.selectLine(lines[0].id);
        }
      },
      error: (err) => {
        console.error('Error loading lines:', err);
        this.error = 'Failed to load transit lines';
        this.loading = false;
      }
    });
  }

  selectLine(lineId: number): void {
    this.selectedLineId = lineId;
    this.clearMap();
    this.loadLineDetails(lineId);
  }

  private loadLineDetails(lineId: number): void {
    this.loading = true;
    this.mapService.getLine(lineId).subscribe({
      next: (line) => {
        this.displayStations(line.stations);
        this.calculateAndDrawRoutes(line);
        this.loading = false;
        
        // Center and zoom map to fit all stations
        if (line.stations.length > 0 && this.map) {
          const bounds = this.createBoundsForStations(line.stations);
          this.map.fitBounds(bounds, { padding: [30, 30] });
        }
      },
      error: (err) => {
        console.error('Error loading line details:', err);
        this.error = 'Failed to load line details';
        this.loading = false;
      }
    });
  }

  private displayStations(stations: Station[]): void {
    // Clear existing markers
    this.clearStationMarkers();
    
    if (!this.map) return;
    
    // Add markers for each station
    stations.forEach((station, index) => {
      const marker = L.marker([station.latitude, station.longitude])
        .addTo(this.map!)
        .bindPopup(`<b>${station.name}</b><br>Status: ${station.status}`);
      
      this.stationMarkers.push(marker);
    });
  }

  private calculateAndDrawRoutes(line: Line): void {
    // Clear existing route lines
    this.clearRouteLines();
    
    if (line.stations.length < 2 || !this.map) return;
    
    // Simple straight line connections between stations
    for (let i = 0; i < line.stations.length - 1; i++) {
      const start = line.stations[i];
      const end = line.stations[i + 1];
      
      const routeLine = L.polyline([
        [start.latitude, start.longitude],
        [end.latitude, end.longitude]
      ], { color: 'blue', weight: 3 }).addTo(this.map);
      
      this.routeLines.push(routeLine);
    }
    
    // For more sophisticated routing with actual roads, uncomment the following:
    /*
    this.mapService.getLineRoutes(line).subscribe({
      next: (routeResponses) => {
        routeResponses.forEach(response => {
          if (response.features && response.features.length > 0) {
            const geometry = response.features[0].geometry;
            if (geometry.type === 'LineString') {
              // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
              const latLngs = geometry.coordinates.map((coord: [number, number]) => {
                return [coord[1], coord[0]];
              });
              
              const routeLine = L.polyline(latLngs, { color: 'blue', weight: 3 }).addTo(this.map!);
              this.routeLines.push(routeLine);
            }
          }
        });
      },
      error: (err) => {
        console.error('Error getting routes:', err);
      }
    });
    */
  }

  private createBoundsForStations(stations: Station[]): L.LatLngBounds {
    const latLngs = stations.map(station => L.latLng(station.latitude, station.longitude));
    return L.latLngBounds(latLngs);
  }

  private clearStationMarkers(): void {
    this.stationMarkers.forEach(marker => {
      marker.remove();
    });
    this.stationMarkers = [];
  }

  private clearRouteLines(): void {
    this.routeLines.forEach(line => {
      line.remove();
    });
    this.routeLines = [];
  }

  private clearMap(): void {
    this.clearStationMarkers();
    this.clearRouteLines();
    this.error = '';
  }
}
