import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserJourneysComponent } from './user-journeys.component';

describe('UserJourneysComponent', () => {
  let component: UserJourneysComponent;
  let fixture: ComponentFixture<UserJourneysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserJourneysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserJourneysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
