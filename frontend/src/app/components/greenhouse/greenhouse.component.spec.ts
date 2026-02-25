import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreenhouseComponent } from './greenhouse.component';

describe('GreenhouseComponent', () => {
  let component: GreenhouseComponent;
  let fixture: ComponentFixture<GreenhouseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreenhouseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GreenhouseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
