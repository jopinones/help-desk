import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IdTicket } from './id-ticket';

describe('IdTicket', () => {
  let component: IdTicket;
  let fixture: ComponentFixture<IdTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdTicket],
      // CORRECCIÓN: la plantilla usa routerLink, que necesita el router.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IdTicket);
    component = fixture.componentInstance;
    // CORRECCIÓN: `ticketId` es un input obligatorio; sin darle un valor no se puede crear.
    fixture.componentRef.setInput('ticketId', '12');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: muestra el id con "#" y enlaza al detalle del ticket.
  it('muestra #id y enlaza al detalle', () => {
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a');

    expect(enlace?.textContent?.trim()).toBe('#12');
    expect(enlace?.getAttribute('href')).toBe('/tickets/12');
  });
});
