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
    path: 'journey-map',
    title: 'Journey Map',
    loadComponent: () => import('./journey-map/journey-map.component').then(c => c.JourneyMapComponent)
  },
  {path: 'calender',
    title: 'Calender Dashboard',
    loadComponent: () => import('./calender/calender.component').then(c => c.CalenderComponent)},
  {path: 'purchase-history',
    title: 'Purchase History',    
    loadComponent: () => import('./purchase-history/purchase-history.component').then(c => c.PurchaseHistoryComponent)},  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
