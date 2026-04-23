import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHousingComponent } from './create-housing-component';

describe('CreateHousingComponent', () => {
  let component: CreateHousingComponent;
  let fixture: ComponentFixture<CreateHousingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHousingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHousingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
