import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookWithMapComponent } from './book-with-map.component';

describe('BookWithMapComponent', () => {
  let component: BookWithMapComponent;
  let fixture: ComponentFixture<BookWithMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookWithMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookWithMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
