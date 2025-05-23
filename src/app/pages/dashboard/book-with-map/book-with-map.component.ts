import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapService, Line, Station } from '../../../service/map.service';
import { JourneyService, JourneyRequest } from '../../../service/journey.service';
import { AuthService } from '../../../auth/services/auth.service';
import { catchError, finalize } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-book-with-map',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './book-with-map.component.html',
  styleUrl: './book-with-map.component.scss'
})
export class BookWithMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapService = inject(MapService);
  private journeyService = inject(JourneyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  // Form for booking
  bookingForm: FormGroup;
  
  // Map properties
  private map: L.Map | undefined;
  private stationMarkers: { [id: number]: L.Marker } = {}; 
  private linePolylines: { [id: number]: L.Polyline[] } = {};
  
  // Data properties
  lines: Line[] = [];
  visibleLines: Set<number> = new Set();
  lineColors: { id: number, code: string, color: string }[] = [];
  
  // Selection state
  selectedStartStation: Station | null = null;
  selectedEndStation: Station | null = null;
  selectedLine: Line | null = null;
  
  // UI state
  loading = false;
  bookingLoading = false;
  error = '';
  
  constructor() {
    // Initialize form
    this.bookingForm = this.fb.group({
      lineId: [''],
      startStationId: ['', Validators.required],
      endStationId: ['', Validators.required]
    });
    
    // Set up form value changes listeners
    this.bookingForm.get('lineId')?.valueChanges.subscribe(lineId => {
      if (lineId) {
        this.onLineSelectedFromForm(lineId);
      }
    });
  }
  
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
        this.displayAllLinesAndStations();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lines:', err);
        this.error = 'Failed to load transit lines';
        this.loading = false;
      }
    });
  }
  
  displayAllLinesAndStations(): void {
    if (!this.map) return;
    
    console.log('displayAllLinesAndStations called - preserving selections:', 
      this.selectedStartStation?.name, this.selectedEndStation?.name);
    
    // Store current selections before clearing
    const currentStartStation = this.selectedStartStation;
    const currentEndStation = this.selectedEndStation;
    
    // Clear any previous data
    this.clearMap();
    
    // A map to track which stations have been added
    const addedStations = new Set<number>();
    
    // Process each line
    this.lines.forEach((line, lineIndex) => {
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
              <button class="select-start-btn">Select as Start</button><br>
              <button class="select-end-btn">Select as End</button>
            `);
          
          // Add event listeners to the popup content after it's created
          marker.on('popupopen', () => {
            setTimeout(() => {
              const popup = marker.getPopup();
              if (popup && popup.isOpen()) {
                const container = popup.getElement();
                if (container) {
                  const startBtn = container.querySelector('.select-start-btn');
                  const endBtn = container.querySelector('.select-end-btn');
                  
                  if (startBtn) {
                    (startBtn as HTMLElement).addEventListener('click', () => {
                      // Direct call to handle Start station selection
                      this.setStartStation(station);
                      marker.closePopup();
                    });
                  }
                  
                  if (endBtn) {
                    (endBtn as HTMLElement).addEventListener('click', () => {
                      // Direct call to handle End station selection
                      this.setEndStation(station);
                      marker.closePopup();
                    });
                  }
                }
              }
            }, 10);
          });
          
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
    
    // Restore selections after redrawing the map
    this.selectedStartStation = currentStartStation;
    this.selectedEndStation = currentEndStation;
    
    // Make sure form values are consistent with our object selections
    if (this.selectedStartStation) {
      this.bookingForm.get('startStationId')?.setValue(this.selectedStartStation.id);
    }
    if (this.selectedEndStation) {
      this.bookingForm.get('endStationId')?.setValue(this.selectedEndStation.id);
    }
    
    // Update station markers to show selected status
    this.updateStationMarkers();
  }
  
  // New simpler methods to handle station selection
  setStartStation(station: Station): void {
    console.log('Setting start station:', station.name);
    this.selectedStartStation = station;
    this.bookingForm.get('startStationId')?.setValue(station.id);
    
    // Try to find a compatible line if end station is already selected
    if (this.selectedEndStation) {
      this.findCompatibleLine(this.selectedStartStation, this.selectedEndStation);
    }
    
    this.updateStationMarkers();
  }
  
  setEndStation(station: Station): void {
    console.log('Setting end station:', station.name);
    this.selectedEndStation = station;
    this.bookingForm.get('endStationId')?.setValue(station.id);
    
    // Try to find a compatible line if start station is already selected
    if (this.selectedStartStation) {
      this.findCompatibleLine(this.selectedStartStation, this.selectedEndStation);
    }
    
    this.updateStationMarkers();
  }
  
  // Find a line that contains both stations
  findCompatibleLine(startStation: Station, endStation: Station): boolean {
    console.log('Finding compatible line between', startStation.name, 'and', endStation.name);
    
    // Check if the stations are the same
    if (startStation.id === endStation.id) {
      this.snackBar.open('Start and end stations cannot be the same', 'Close', { duration: 3000 });
      return false;
    }
    
    // First attempt: find a single line containing both stations
    for (const line of this.lines) {
      const startIndex = line.stations.findIndex(s => s.id === startStation.id);
      const endIndex = line.stations.findIndex(s => s.id === endStation.id);
      
      // If both stations are on this line
      if (startIndex !== -1 && endIndex !== -1) {
        console.log('Found compatible line:', line.code);
        this.selectedLine = line;
        this.bookingForm.get('lineId')?.setValue(line.id);
        
        // Update map to show just this line, but don't clear selections
        this.visibleLines.clear();
        this.visibleLines.add(line.id);
        
        // Update the display without resetting stations
        this.updateStationVisibility();
        this.highlightSelectedRoute();
        
        // If stations are in reverse order, show a notification but allow it
        if (startIndex > endIndex) {
          this.snackBar.open('Note: Traveling in reverse direction on line ' + line.code, 'OK', { 
            duration: 3000 
          });
        }
        
        return true;
      }
    }
    
    // If we reach here, the stations are on different lines - that's okay with multi-line journey feature
    this.selectedLine = null;
    this.bookingForm.get('lineId')?.setValue('');
    
    // Show all lines to help visualize the potential route
    this.lines.forEach(line => this.visibleLines.add(line.id));
    this.updateStationVisibility();
    
    // No notification needed - the system handles multi-line journeys automatically
    
    return true; // Return true to allow the journey to be booked
  }
  
  // New helper method to update station visibility without reset
  private updateStationVisibility(): void {
    if (!this.map) return;
    
    // Update polyline visibility based on selected lines
    Object.entries(this.linePolylines).forEach(([lineId, polylines]) => {
      const visible = this.visibleLines.has(Number(lineId));
      polylines.forEach(line => {
        if (visible) {
          if (!this.map!.hasLayer(line)) this.map!.addLayer(line);
        } else {
          if (this.map!.hasLayer(line)) this.map!.removeLayer(line);
        }
      });
    });
    
    // Make sure all station markers remain on the map, even if their lines are hidden
    Object.entries(this.stationMarkers).forEach(([stationId, marker]) => {
      if (!this.map!.hasLayer(marker)) {
        this.map!.addLayer(marker);
      }
    });
    
    // Update the station markers to show their selection status
    this.updateStationMarkers();
  }
  
  toggleLineVisibility(lineId: number): void {
    if (this.visibleLines.has(lineId)) {
      this.visibleLines.delete(lineId);
    } else {
      this.visibleLines.add(lineId);
    }
    
    // Update line visibility without fully resetting the map
    this.updateStationVisibility();
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
  
  private updateStationMarkers(): void {
    // Update all markers based on selection state
    Object.entries(this.stationMarkers).forEach(([stationId, marker]) => {
      const id = parseInt(stationId);
      const station = this.findStationById(id);
      
      if (!station) return;
      
      // Create a custom icon to visually distinguish selected stations
      if (this.selectedStartStation && id === this.selectedStartStation.id) {
        marker.setIcon(L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #4CAF50; border-radius: 50%; width: 24px; height: 24px; border: 2px solid white;"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }));
        marker.setZIndexOffset(1000);
      } else if (this.selectedEndStation && id === this.selectedEndStation.id) {
        marker.setIcon(L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #F44336; border-radius: 50%; width: 24px; height: 24px; border: 2px solid white;"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }));
        marker.setZIndexOffset(1000);
      } else {
        // Reset to default marker
        marker.setIcon(L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        }));
        marker.setZIndexOffset(0);
      }
      
      // Update popup content
      let popupContent = `<b>${station.name}</b><br>`;
      
      if (this.selectedStartStation && id === this.selectedStartStation.id) {
        popupContent += `<strong style="color: #4CAF50;">Selected as START</strong><br>`;
        // Allow changing selection to END if start is already selected
        popupContent += `<button class="select-end-btn">Change to End</button><br>`;
        popupContent += `<button class="clear-selection-btn">Clear Selection</button>`;
      } else if (this.selectedEndStation && id === this.selectedEndStation.id) {
        popupContent += `<strong style="color: #F44336;">Selected as END</strong><br>`;
        // Allow changing selection to START if end is already selected
        popupContent += `<button class="select-start-btn">Change to Start</button><br>`;
        popupContent += `<button class="clear-selection-btn">Clear Selection</button>`;
      } else {
        popupContent += `<button class="select-start-btn">Select as Start</button><br>
                         <button class="select-end-btn">Select as End</button>`;
      }
      
      marker.setPopupContent(popupContent);
      
      // Re-attach event listeners
      marker.on('popupopen', () => {
        setTimeout(() => {
          const popup = marker.getPopup();
          if (popup && popup.isOpen()) {
            const container = popup.getElement();
            if (container) {
              const startBtn = container.querySelector('.select-start-btn');
              const endBtn = container.querySelector('.select-end-btn');
              const clearBtn = container.querySelector('.clear-selection-btn');
              
              if (startBtn) {
                (startBtn as HTMLElement).addEventListener('click', () => {
                  this.setStartStation(station);
                  marker.closePopup();
                });
              }
              
              if (endBtn) {
                (endBtn as HTMLElement).addEventListener('click', () => {
                  this.setEndStation(station);
                  marker.closePopup();
                });
              }
              
              if (clearBtn) {
                if (this.selectedStartStation && id === this.selectedStartStation.id) {
                  this.selectedStartStation = null;
                  this.bookingForm.get('startStationId')?.setValue('');
                }
                if (this.selectedEndStation && id === this.selectedEndStation.id) {
                  this.selectedEndStation = null;
                  this.bookingForm.get('endStationId')?.setValue('');
                }
                marker.closePopup();
                this.updateStationMarkers();
              }
            }
          }
        }, 10);
      });
    });
    
    // Update the route display
    this.highlightSelectedRoute();
  }
  
  private findStationById(id: number): Station | null {
    for (const line of this.lines) {
      const station = line.stations.find(s => s.id === id);
      if (station) return station;
    }
    return null;
  }
  
  private highlightSelectedRoute(): void {
    // Clear previous highlights first
    Object.values(this.linePolylines).forEach(polylines => {
      polylines.forEach(polyline => {
        polyline.setStyle({ weight: 5, opacity: 0.8 });
      });
    });
    
    // Skip route highlighting for multi-line journeys (when selectedLine is null)
    // But still ensure both stations remain selected
    if (this.selectedStartStation && this.selectedEndStation) {
      // If we have a selected line, highlight the route on that line
      if (this.selectedLine) {
        const lineId = this.selectedLine.id;
        const stations = this.selectedLine.stations;
        
        // Store IDs in local variables after null check to avoid TypeScript errors
        const startStationId = this.selectedStartStation.id;
        const endStationId = this.selectedEndStation.id;
        
        const startIndex = stations.findIndex(s => s.id === startStationId);
        const endIndex = stations.findIndex(s => s.id === endStationId);
        
        // Check if both stations are on this line
        if (startIndex !== -1 && endIndex !== -1) {
          // Forward journey (startIndex < endIndex)
          if (startIndex < endIndex) {
            for (let i = startIndex; i < endIndex; i++) {
              const currentStation = stations[i];
              const nextStation = stations[i + 1];
              this.highlightSegment(lineId, currentStation, nextStation);
            }
          } 
          // Reverse journey (startIndex > endIndex)
          else if (startIndex > endIndex) {
            for (let i = startIndex; i > endIndex; i--) {
              const currentStation = stations[i];
              const prevStation = stations[i - 1];
              this.highlightSegment(lineId, currentStation, prevStation);
            }
          }
        }
      }
      // For multi-line journeys, we don't highlight a specific route
      // but we ensure both stations remain selected visually
    }
  }
  
  // Helper method to highlight a segment between two stations
  private highlightSegment(lineId: number, stationA: Station, stationB: Station): void {
    const polyline = this.linePolylines[lineId]?.find(line => {
      const latLngs = line.getLatLngs() as L.LatLng[];
      const pointA = latLngs[0];
      const pointB = latLngs[1];
      
      // Check if the polyline connects the two stations (in either direction)
      return (
        (Math.abs(pointA.lat - stationA.latitude) < 0.0001 && 
         Math.abs(pointA.lng - stationA.longitude) < 0.0001 &&
         Math.abs(pointB.lat - stationB.latitude) < 0.0001 && 
         Math.abs(pointB.lng - stationB.longitude) < 0.0001) || 
        (Math.abs(pointB.lat - stationA.latitude) < 0.0001 && 
         Math.abs(pointB.lng - stationA.longitude) < 0.0001 &&
         Math.abs(pointA.lat - stationB.latitude) < 0.0001 && 
         Math.abs(pointA.lng - stationB.longitude) < 0.0001)
      );
    });
    
    if (polyline) {
      polyline.setStyle({ weight: 8, opacity: 1, color: '#FF4500' });
    }
  }
  
  onLineSelectedFromForm(lineId: number): void {
    this.selectedLine = this.lines.find(line => line.id === lineId) || null;
    
    // Update map to highlight the selected line
    if (this.selectedLine) {
      // Make only the selected line visible
      this.visibleLines.clear();
      this.visibleLines.add(this.selectedLine.id);
      
      // Use updateStationVisibility instead of displayAllLinesAndStations
      // to preserve selection state
      this.updateStationVisibility();
      
      // Zoom to the line's stations
      this.zoomToLine(this.selectedLine);
      
      // If we have both stations selected, highlight the route
      if (this.selectedStartStation && this.selectedEndStation) {
        this.highlightSelectedRoute();
      }
    }
  }
  
  private zoomToLine(line: Line): void {
    if (!this.map || line.stations.length === 0) return;
    
    const latLngs = line.stations.map(station => L.latLng(station.latitude, station.longitude));
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }
  
  private resetStationSelections(): void {
    console.log('Resetting station selections');
    this.selectedStartStation = null;
    this.selectedEndStation = null;
    this.bookingForm.get('startStationId')?.setValue('');
    this.bookingForm.get('endStationId')?.setValue('');
    
    // Use updateStationVisibility instead of displayAllLinesAndStations
    // This will update the visual state without redrawing the entire map
    this.updateStationMarkers();
  }
  
  bookJourney(): void {
    // Case: No selections made
    if (!this.selectedStartStation && !this.selectedEndStation) {
      this.snackBar.open('Please select start and end stations', 'Close', { duration: 3000 });
      return;
    }

    // Case: Only end station selected
    if (!this.selectedStartStation && this.selectedEndStation) {
      this.snackBar.open('Please select a start station', 'Close', { duration: 3000 });
      return;
    }

    // Case: Only start station selected
    if (this.selectedStartStation && !this.selectedEndStation) {
      this.snackBar.open('Please select an end station', 'Close', { duration: 3000 });
      return;
    }
    
    const startStationId = this.selectedStartStation?.id;
    const endStationId = this.selectedEndStation?.id;
    
    if (!startStationId || !endStationId) {
      this.snackBar.open('Please select both start and end stations', 'Close', { duration: 3000 });
      return;
    }
    
    // Create the journey request
    const journeyRequest: JourneyRequest = {
      startStationId: startStationId,
      endStationId: endStationId
    };
    
    // If a specific line is selected, include it in the request
    if (this.selectedLine) {
      journeyRequest.lineId = this.selectedLine.id;
    }
    
    this.error = '';
    this.bookingLoading = true;
    
    this.journeyService.bookJourney(journeyRequest)
      .pipe(
        finalize(() => {
          this.bookingLoading = false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error booking journey:', error);
          
          if (error.status === 401 || error.status === 403) {
            this.snackBar.open('Authentication failed. Please log in again.', 'Close', {
              duration: 5000
            });
            this.authService.logout();
            this.router.navigate(['/login']);
          } else if (error.status === 400) {
            const message = error.error?.message || error.error?.error || 'Invalid journey details. Please check and try again.';
            this.snackBar.open(message, 'Close', {
              duration: 5000
            });
          } else if (error.status === 0) {
            this.error = 'Could not connect to the server. Please check your connection and try again.';
          } else {
            this.error = `Failed to book journey: ${error.error?.message || error.error?.error || error.statusText || 'Unknown error'}`;
          }
          
          throw error;
        })
      )
      .subscribe({
        next: (journey) => {
          this.snackBar.open('Journey booked successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          // Reset the form and selections
          this.resetStationSelections();
          this.bookingForm.reset();
          
          // Redirect to user journeys page after a short delay
          setTimeout(() => {
            this.router.navigate(['/pages/dashboard/user-journeys']);
          }, 1000);
        },
        error: () => {} // Errors already handled in catchError
      });
  }
}
