import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MapService, Line, Station } from '../../../service/map.service';
import { AuthService } from '../../../auth/services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './map.component.html'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapService = inject(MapService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private map: L.Map | undefined;
  private stationMarkers: { [id: number]: L.Marker } = {}; // Map of station ID to marker
  private linePolylines: { [id: number]: L.Polyline[] } = {}; // Map of line ID to polylines
  
  lines: Line[] = [];
  visibleLines: Set<number> = new Set(); // Track which lines are currently visible
  loading = false;
  error = '';
  
  // For the legend
  lineColors: { id: number, code: string, color: string }[] = [];

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadAllLines();
  }

  ngAfterViewInit(): void {
    if (this.authService.isAuthenticated()) {
      this.initMap();
    }
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

  private loadAllLines(): void {
    this.loading = true;
    this.mapService.getLines().subscribe({
      next: (lines) => {
        this.lines = lines;
        
        // Set up line colors for the legend
        this.lineColors = lines.map((line, index) => ({
          id: line.id,
          code: line.code,
          color: this.mapService.getLineColor(index)
        }));
        
        // Initially show all lines
        lines.forEach(line => this.visibleLines.add(line.id));
        
        // Display all lines and stations
        this.displayAllLinesAndStations(lines);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lines:', err);
        this.error = 'Failed to load transit lines';
        this.loading = false;
      }
    });
  }

  displayAllLinesAndStations(lines: Line[]): void {
    if (!this.map) return;
    
    // Clear any previous data
    this.clearMap();
    
    // A map to track which stations have been added
    const addedStations = new Set<number>();
    
    // Process each line
    lines.forEach((line, lineIndex) => {
      if (!this.visibleLines.has(line.id)) return;
      
      const color = this.mapService.getLineColor(lineIndex);
      this.linePolylines[line.id] = [];
      
      // Add stations for this line
      line.stations.forEach((station, stationIndex) => {
        // Only add the station marker if it hasn't been added yet
        if (!addedStations.has(station.id)) {
          const marker = L.marker([station.latitude, station.longitude])
            .addTo(this.map!)
            .bindPopup(`
              <b>${station.name}</b><br>
              Status: ${station.status}<br>
              Line: ${line.code}
            `);
          
          this.stationMarkers[station.id] = marker;
          addedStations.add(station.id);
        }
        
        // Add route line to the next station (if there is one)
        if (stationIndex < line.stations.length - 1) {
          const nextStation = line.stations[stationIndex + 1];
          const routeLine = L.polyline(
            [
              [station.latitude, station.longitude],
              [nextStation.latitude, nextStation.longitude]
            ],
            { 
              color: color,
              weight: 5,
              opacity: 0.8
            }
          ).addTo(this.map!);
          
          routeLine.bindTooltip(`${line.code}: ${station.name} → ${nextStation.name}`);
          this.linePolylines[line.id].push(routeLine);
        }
      });
    });
    
    // Fit map to show all markers
    if (Object.keys(this.stationMarkers).length > 0) {
      const allLatLngs: L.LatLng[] = [];
      Object.values(this.stationMarkers).forEach(marker => {
        allLatLngs.push(marker.getLatLng());
      });
      
      const bounds = L.latLngBounds(allLatLngs);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  toggleLineVisibility(lineId: number): void {
    if (this.visibleLines.has(lineId)) {
      this.visibleLines.delete(lineId);
    } else {
      this.visibleLines.add(lineId);
    }
    
    // Re-render map with updated line visibility
    this.displayAllLinesAndStations(this.lines);
  }

  clearMap(): void {
    // Clear station markers
    Object.values(this.stationMarkers).forEach(marker => {
      marker.remove();
    });
    this.stationMarkers = {};
    
    // Clear line polylines
    Object.values(this.linePolylines).forEach(lines => {
      lines.forEach(line => line.remove());
    });
    this.linePolylines = {};
  }
}
