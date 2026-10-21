import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TicketDetalle } from './ticket-detalle';

describe('TicketDetalle', () => {
  let component: TicketDetalle;
  let fixture: ComponentFixture<TicketDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetalle],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
