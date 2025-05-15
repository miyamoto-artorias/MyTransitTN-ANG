import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneyMapComponent } from './journey-map.component';

describe('JourneyMapComponent', () => {
  let component: JourneyMapComponent;
  let fixture: ComponentFixture<JourneyMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JourneyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
