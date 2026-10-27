import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrioridadTicket } from './prioridad-ticket';

describe('PrioridadTicket', () => {
  let component: PrioridadTicket;
  let fixture: ComponentFixture<PrioridadTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrioridadTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(PrioridadTicket);
    component = fixture.componentInstance;
    // CORRECCIÓN: `prioridad` es un input obligatorio; sin darle un valor el componente no se puede crear.
    fixture.componentRef.setInput('prioridad', 'Alta');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: comprueba que se muestra el texto de la prioridad recibida.
  it('muestra la prioridad recibida', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Alta');
  });
});
