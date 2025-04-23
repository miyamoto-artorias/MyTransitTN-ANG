import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

interface TrainRoute {
  id: number;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
}

@Component({
  selector: 'app-purchase-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './purchase-ticket.component.html',
  styleUrl: './purchase-ticket.component.scss'
})
export class PurchaseTicketComponent {
  // Mock data for cities
  cities = [
    'Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Gabes',
    'Kairouan', 'Gafsa', 'Monastir', 'Nabeul', 'Tozeur'
  ];

  // Mock data for train routes
  trainRoutes: TrainRoute[] = [
    {
      id: 1,
      departure: 'Tunis',
      arrival: 'Sousse',
      departureTime: '08:00',
      arrivalTime: '09:30',
      duration: '1h 30m',
      price: 15,
      availableSeats: 45
    },
    {
      id: 2,
      departure: 'Tunis',
      arrival: 'Sfax',
      departureTime: '10:00',
      arrivalTime: '12:30',
      duration: '2h 30m',
      price: 25,
      availableSeats: 30
    },
    {
      id: 3,
      departure: 'Sousse',
      arrival: 'Monastir',
      departureTime: '14:00',
      arrivalTime: '14:30',
      duration: '30m',
      price: 8,
      availableSeats: 60
    }
  ];

  // Form data
  selectedRoute: TrainRoute | null = null;
  departureCity: string = '';
  arrivalCity: string = '';
  travelDate: Date = new Date();
  passengerCount: number = 1;
  totalPrice: number = 0;

  // Calculate total price
  calculateTotal() {
    if (this.selectedRoute) {
      this.totalPrice = this.selectedRoute.price * this.passengerCount;
    }
  }

  // Filter routes based on selected cities
  get filteredRoutes(): TrainRoute[] {
    if (!this.departureCity || !this.arrivalCity) {
      return [];
    }
    return this.trainRoutes.filter(route => 
      route.departure === this.departureCity && 
      route.arrival === this.arrivalCity
    );
  }

  // Handle route selection
  onRouteSelect(route: TrainRoute) {
    this.selectedRoute = route;
    this.calculateTotal();
  }

  // Handle passenger count change
  onPassengerCountChange() {
    this.calculateTotal();
  }

  // Handle purchase
  purchaseTicket() {
    if (this.selectedRoute) {
      // Here you would typically call your backend service
      console.log('Purchasing ticket:', {
        route: this.selectedRoute,
        passengers: this.passengerCount,
        date: this.travelDate,
        totalPrice: this.totalPrice
      });
      alert('Ticket purchased successfully!');
    }
  }
}
