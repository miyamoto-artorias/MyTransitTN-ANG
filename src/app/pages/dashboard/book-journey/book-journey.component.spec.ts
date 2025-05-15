import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookJourneyComponent } from './book-journey.component';

describe('BookJourneyComponent', () => {
  let component: BookJourneyComponent;
  let fixture: ComponentFixture<BookJourneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookJourneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookJourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
