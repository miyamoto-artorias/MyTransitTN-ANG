import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'basic',
  },
  {
    path: 'basic',
    title: 'Basic Dashboard',
    loadComponent: () => import('./basic/basic.component').then(c => c.BasicComponent)
  },
  {
    path:'map',
    title: 'Map',
    loadComponent: () => import('./map/map.component').then(c => c.MapComponent)
  },
  {
    path:'book-journey',
    title: 'Book Journey',
    loadComponent: () => import('./book-journey/book-journey.component').then(c => c.BookJourneyComponent)
  },
  {
    path:'book-with-map',
    title: 'Book with Map',
    loadComponent: () => import('./book-with-map/book-with-map.component').then(c => c.BookWithMapComponent)
  }
,
  {
    path: 'journey-map',
    title: 'Journey Map',
    loadComponent: () => import('./journey-map/journey-map.component').then(c => c.JourneyMapComponent)
  },
  {
    path:'user-journeys',
    title: 'User Journeys',
    loadComponent: () => import('./user-journeys/user-journeys.component').then(c => c.UserJourneysComponent)
  },
  {path: 'purchase-history',
    title: 'Purchase History',    
    loadComponent: () => import('./purchase-history/purchase-history.component').then(c => c.PurchaseHistoryComponent)},  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
