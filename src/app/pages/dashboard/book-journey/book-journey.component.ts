import { Component, OnInit, inject } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapService, Line, Station } from '../../../service/map.service';
import { JourneyService, JourneyRequest } from '../../../service/journey.service';
import { AuthService } from '../../../auth/services/auth.service';
import { catchError, finalize } from 'rxjs';

@Component({
  selector: 'app-book-journey',
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
    ReactiveFormsModule
  ],
  templateUrl: './book-journey.component.html'
})
export class BookJourneyComponent implements OnInit {
  private mapService = inject(MapService);
  private journeyService = inject(JourneyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  bookingForm: FormGroup;
  lines: Line[] = [];
  stations: Station[] = [];
  startStations: Station[] = [];
  endStations: Station[] = [];
  loading = false;
  linesLoading = false;
  bookingLoading = false;
  error = '';
  
  constructor() {
    this.bookingForm = this.fb.group({
      lineId: ['', Validators.required],
      startStationId: [{ value: '', disabled: true }, Validators.required],
      endStationId: [{ value: '', disabled: true }, Validators.required]
    });
    
    // Listen for line changes to update stations
    this.bookingForm.get('lineId')?.valueChanges.subscribe(lineId => {
      this.bookingForm.get('startStationId')?.setValue('');
      this.bookingForm.get('endStationId')?.setValue('');
      
      if (lineId) {
        this.updateStationsForLine(lineId);
        this.bookingForm.get('startStationId')?.enable();
      } else {
        this.startStations = [];
        this.endStations = [];
        this.bookingForm.get('startStationId')?.disable();
        this.bookingForm.get('endStationId')?.disable();
      }
    });
    
    // Listen for start station changes to update end stations
    this.bookingForm.get('startStationId')?.valueChanges.subscribe(startStationId => {
      this.bookingForm.get('endStationId')?.setValue('');
      
      if (startStationId) {
        this.updateEndStations(startStationId);
        this.bookingForm.get('endStationId')?.enable();
      } else {
        this.endStations = [];
        this.bookingForm.get('endStationId')?.disable();
      }
    });
  }

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Debug - check if token exists and print it
    const token = this.authService.getToken();
    console.log('Token exists:', !!token);
    if (token) {
      // Check token expiration if possible by examining payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        if (payload.exp) {
          const expiryDate = new Date(payload.exp * 1000);
          console.log('Token expires:', expiryDate);
          console.log('Token expired:', expiryDate < new Date());
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    this.loadLines();
  }
  
  loadLines(): void {
    this.linesLoading = true;
    this.mapService.getLines().subscribe({
      next: (lines) => {
        this.lines = lines;
        this.linesLoading = false;
      },
      error: (err) => {
        console.error('Error loading lines:', err);
        this.error = 'Failed to load transit lines';
        this.linesLoading = false;
      }
    });
  }
  
  updateStationsForLine(lineId: number): void {
    const selectedLine = this.lines.find(line => line.id === lineId);
    if (selectedLine) {
      this.startStations = [...selectedLine.stations];
    } else {
      this.startStations = [];
    }
  }
  
  updateEndStations(startStationId: number): void {
    const lineId = this.bookingForm.get('lineId')?.value;
    const selectedLine = this.lines.find(line => line.id === lineId);
    
    if (selectedLine) {
      // Find the index of the start station
      const startIndex = selectedLine.stations.findIndex(station => station.id === startStationId);
      
      if (startIndex !== -1 && startIndex < selectedLine.stations.length - 1) {
        // Get all stations after the start station
        this.endStations = selectedLine.stations.slice(startIndex + 1);
      } else {
        this.endStations = [];
      }
    }
  }
  
  bookJourney(): void {
    if (this.bookingForm.invalid) {
      return;
    }
    
    const startStationId = this.bookingForm.get('startStationId')?.value;
    const endStationId = this.bookingForm.get('endStationId')?.value;
    const lineId = this.bookingForm.get('lineId')?.value;
    
    // Validate values before sending
    if (!startStationId || !endStationId || !lineId) {
      this.snackBar.open('Please complete all journey details before booking', 'Close', {
        duration: 5000
      });
      return;
    }
    
    const journeyRequest: JourneyRequest = {
      startStationId: Number(startStationId),
      endStationId: Number(endStationId),
      lineId: Number(lineId)
    };
    
    console.log('Sending journey request:', journeyRequest);
    
    this.error = '';
    this.bookingLoading = true;
    
    this.journeyService.bookJourney(journeyRequest)
      .pipe(
        finalize(() => {
          this.bookingLoading = false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error booking journey:', error);
          console.error('Error details:', error.error);
          
          // More detailed error handling
          if (error.status === 401 || error.status === 403) {
            this.snackBar.open('Authentication failed. Please log in again.', 'Close', {
              duration: 5000
            });
            this.authService.logout();
            this.router.navigate(['/login']);
          } else if (error.status === 400) {
            const message = error.error?.message || 'Invalid journey details. Please check and try again.';
            this.snackBar.open(message, 'Close', {
              duration: 5000
            });
          } else if (error.status === 0) {
            this.error = 'Could not connect to the server. Please check your connection and try again.';
          } else {
            this.error = `Failed to book journey: ${error.error?.message || error.statusText || 'Unknown error'}`;
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
          
          // Reset the form
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
