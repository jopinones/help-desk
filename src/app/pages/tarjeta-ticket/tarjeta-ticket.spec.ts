import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaTicket } from './tarjeta-ticket';

describe('TarjetaTicket', () => {
  let component: TarjetaTicket;
  let fixture: ComponentFixture<TarjetaTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaTicket],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaTicket);
    component = fixture.componentInstance;
    // CORRECCIÓN: el input `ticket` es obligatorio; se entrega con setInput.
    fixture.componentRef.setInput('ticket', {
      id: '1',
      asunto: 'Sin internet',
      descripcion: 'No hay conexión',
      estado: 'Abierto',
      prioridad: 'Alta',
      fechaCreacion: '2026-01-05',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el asunto y el id', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Sin internet');
    expect(texto).toContain('#1');
  });
});
