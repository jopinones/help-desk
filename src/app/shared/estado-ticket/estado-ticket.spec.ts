import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoTicket } from './estado-ticket';

describe('EstadoTicket', () => {
  let component: EstadoTicket;
  let fixture: ComponentFixture<EstadoTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoTicket);
    component = fixture.componentInstance;
    // CORRECCIÓN: `estado` es un input obligatorio; sin darle un valor el componente no se puede crear.
    fixture.componentRef.setInput('estado', 'Abierto');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: comprueba que se muestra el texto del estado recibido.
  it('muestra el estado recibido', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Abierto');
  });
});
