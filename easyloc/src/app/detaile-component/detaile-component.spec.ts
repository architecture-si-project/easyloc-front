import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetaileComponent } from './detaile-component';

describe('DetaileComponent', () => {
  let component: DetaileComponent;
  let fixture: ComponentFixture<DetaileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetaileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DetaileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
