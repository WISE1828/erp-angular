import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeItemComponent } from './fee-item.component';

describe('FeeItemComponent', () => {
  let component: FeeItemComponent;
  let fixture: ComponentFixture<FeeItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeeItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeeItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
