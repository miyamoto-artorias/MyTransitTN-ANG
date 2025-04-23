import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'purchase-ticket',
    title: 'Purchase Ticket',
    loadComponent: () => import('./purchase-ticket/purchase-ticket.component').then(c => c.PurchaseTicketComponent)
  },
  {
    path: 'purchase-history',
    title: 'Purchase History',
    loadComponent: () => import('./purchase-ticket/purchase-ticket.component/').then(c => c.PurchaseTicketComponent)
  },
  {
    path: '',
    redirectTo: 'purchase-ticket',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TicketdRoutingModule { }
