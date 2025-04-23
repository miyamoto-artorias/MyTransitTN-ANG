import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseTicketComponent } from './purchase-ticket.component';

describe('PurchaseTicketComponent', () => {
  let component: PurchaseTicketComponent;
  let fixture: ComponentFixture<PurchaseTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseTicketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
