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

  it('emite el cambio de estado y conserva el valor confirmado mientras guarda', () => {
    const cambios: unknown[] = [];
    component.cambiarEstado.subscribe((evento) => cambios.push(evento));
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'En proceso';
    select.dispatchEvent(new Event('change'));
    expect(cambios).toEqual([{ ticket: component.ticket(), nuevoEstado: 'En proceso' }]);
    expect(select.value).toBe('Abierto');
  });

  it('bloquea cambios durante el guardado y para tickets cerrados', () => {
    const cambios: unknown[] = [];
    component.cambiarEstado.subscribe((evento) => cambios.push(evento));
    fixture.componentRef.setInput('actualizando', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    component.seleccionEstado('En proceso');
    fixture.componentRef.setInput('actualizando', false);
    fixture.componentRef.setInput('ticket', { ...component.ticket(), estado: 'Cerrado' });
    fixture.detectChanges();
    component.seleccionEstado('Abierto');
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    expect(cambios).toEqual([]);
  });
});
