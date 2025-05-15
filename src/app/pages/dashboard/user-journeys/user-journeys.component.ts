import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { JourneyService, Journey } from '../../../service/journey.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-journeys',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatExpansionModule,
    DatePipe
  ],
  templateUrl: './user-journeys.component.html'
})
export class UserJourneysComponent implements OnInit {
  private journeyService = inject(JourneyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  journeys: Journey[] = [];
  filteredJourneys: Journey[] = [];
  displayedColumns: string[] = ['id', 'line', 'startStation', 'endStation', 'startTime', 'endTime', 'status', 'distance', 'fare', 'actions'];
  loading = false;
  error = '';
  
  // Filter flags
  showPlanned = true;
  showPurchased = true;
  showCompleted = true;
  showCancelled = true;

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadJourneys();
  }
  
  loadJourneys(): void {
    this.loading = true;
    this.journeyService.getUserJourneys().subscribe({
      next: (journeys) => {
        this.journeys = journeys;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading journeys:', err);
        this.error = 'Failed to load journey data. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  applyFilters(): void {
    this.filteredJourneys = this.journeys.filter(journey => {
      if (journey.status === 'PLANNED' && !this.showPlanned) return false;
      if (journey.status === 'PURCHASED' && !this.showPurchased) return false;
      if (journey.status === 'COMPLETED' && !this.showCompleted) return false;
      if (journey.status === 'CANCELLED' && !this.showCancelled) return false;
      return true;
    });
  }
  
  toggleFilter(filter: string): void {
    switch (filter) {
      case 'planned':
        this.showPlanned = !this.showPlanned;
        break;
      case 'purchased':
        this.showPurchased = !this.showPurchased;
        break;
      case 'completed':
        this.showCompleted = !this.showCompleted;
        break;
      case 'cancelled':
        this.showCancelled = !this.showCancelled;
        break;
    }
    this.applyFilters();
  }
  
  sortData(sort: Sort): void {
    const data = [...this.filteredJourneys];
    
    if (!sort.active || sort.direction === '') {
      this.filteredJourneys = data;
      return;
    }
    
    this.filteredJourneys = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'id': return this.compare(a.id, b.id, isAsc);
        case 'line': 
          // Handle multi-line journeys for sorting
          if (a.isMultiLineJourney && !b.isMultiLineJourney) return isAsc ? 1 : -1;
          if (!a.isMultiLineJourney && b.isMultiLineJourney) return isAsc ? -1 : 1;
          if (a.isMultiLineJourney && b.isMultiLineJourney) return 0;
          // Otherwise compare line codes
          return this.compare(a.primaryLine?.code || '', b.primaryLine?.code || '', isAsc);
        case 'startStation': return this.compare(a.startStation.name, b.startStation.name, isAsc);
        case 'endStation': return this.compare(a.endStation.name, b.endStation.name, isAsc);
        case 'startTime': return this.compare(new Date(a.startTime).getTime(), new Date(b.startTime).getTime(), isAsc);
        case 'endTime': 
          // Handle null end times (put them at the end if ascending, start if descending)
          if (a.endTime === null && b.endTime === null) return 0;
          if (a.endTime === null) return isAsc ? 1 : -1;
          if (b.endTime === null) return isAsc ? -1 : 1;
          return this.compare(new Date(a.endTime).getTime(), new Date(b.endTime).getTime(), isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        case 'distance': return this.compare(a.distanceKm, b.distanceKm, isAsc);
        case 'fare': return this.compare(a.fare, b.fare, isAsc);
        default: return 0;
      }
    });
  }
  
  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'PLANNED': return 'primary';
      case 'PURCHASED': return 'accent';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'warn';
      default: return '';
    }
  }
  
  refreshJourneys(): void {
    this.loadJourneys();
  }
  
  trackByFn(index: number, item: Journey): number {
    return item.id;
  }

  // New methods for journey actions
  payForJourney(journey: Journey): void {
    // First check if we need to display a specific warning about balance
    this.loading = true;
    
    // Get the current user's balance (This could be from a UserService if available)
    // For now, let's just proceed with the confirmation

    // Confirm payment with user
    const lineInfo = journey.isMultiLineJourney ? 'Multiple Lines' : journey.primaryLine?.code || 'N/A';
    
    if (confirm(`Are you sure you want to pay ${journey.fare.toFixed(2)} TND for this journey?\n\nJourney details:\nFrom: ${journey.startStation.name}\nTo: ${journey.endStation.name}\nLine: ${lineInfo}`)) {
      this.journeyService.payForJourney(journey.id).subscribe({
        next: (response) => {
          this.snackBar.open('Payment successful! Your journey is now purchased.', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.refreshJourneys();
        },
        error: (error) => {
          console.error('Payment error:', error);
          
          // Enhanced error message handling
          let errorMsg = error.message;
          
          // Check for specific error cases
          if (errorMsg.includes('Insufficient balance')) {
            errorMsg = 'You don\'t have enough balance to pay for this journey. Please top up your account.';
          } else if (errorMsg.includes('already been paid')) {
            errorMsg = 'This journey has already been paid for. Refreshing your journey list...';
            setTimeout(() => this.refreshJourneys(), 1500);
          }
          
          this.snackBar.open(`Payment failed: ${errorMsg}`, 'Close', { 
            duration: 5000, 
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  cancelJourney(journey: Journey): void {
    if (confirm('Are you sure you want to cancel this journey?')) {
      this.loading = true;
      
      this.journeyService.cancelJourney(journey.id).subscribe({
        next: (updatedJourney) => {
          this.snackBar.open('Journey cancelled successfully', 'Close', { duration: 3000 });
          this.refreshJourneys();
        },
        error: (error) => {
          console.error('Cancel error:', error);
          this.snackBar.open(`Failed to cancel journey: ${error.message}`, 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }

  completeJourney(journey: Journey): void {
    if (confirm('Are you sure you want to mark this journey as completed?')) {
      this.loading = true;
      
      this.journeyService.completeJourney(journey.id).subscribe({
        next: (updatedJourney) => {
          this.snackBar.open('Journey marked as completed', 'Close', { duration: 3000 });
          this.refreshJourneys();
        },
        error: (error) => {
          console.error('Complete error:', error);
          this.snackBar.open(`Failed to complete journey: ${error.message}`, 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }
}
