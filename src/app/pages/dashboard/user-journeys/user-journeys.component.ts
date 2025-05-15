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
    DatePipe
  ],
  templateUrl: './user-journeys.component.html'
})
export class UserJourneysComponent implements OnInit {
  private journeyService = inject(JourneyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  journeys: Journey[] = [];
  filteredJourneys: Journey[] = [];
  displayedColumns: string[] = ['id', 'line', 'startStation', 'endStation', 'startTime', 'endTime', 'status', 'distance', 'fare', 'actions'];
  loading = false;
  error = '';
  
  // Filter flags
  showPlanned = true;
  showInProgress = true;
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
      if (journey.status === 'IN_PROGRESS' && !this.showInProgress) return false;
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
      case 'inProgress':
        this.showInProgress = !this.showInProgress;
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
        case 'line': return this.compare(a.line.code, b.line.code, isAsc);
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
      case 'IN_PROGRESS': return 'accent';
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
}
