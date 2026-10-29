import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Ticket } from '../../../models/ticket';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KanbanColumna } from './kanban-columna';

describe('KanbanColumna', () => {
  let component: KanbanColumna;
  let fixture: ComponentFixture<KanbanColumna>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanColumna],
      // CORRECCIÓN: las tarjetas usan routerLink (app-id-ticket).
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanColumna);
    component = fixture.componentInstance;
    // CORRECCIÓN: los inputs required se asignan con setInput antes de detectar cambios.
    fixture.componentRef.setInput('titulo', 'Abiertos');
    fixture.componentRef.setInput('estado', 'Abierto');
    fixture.componentRef.setInput('tickets', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el mensaje vacío sin tickets', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay tickets');
  });

  // Simula el evento CDK para comprobar destino, cancelaciones y bloqueo de guardado.
  function soltar(estado: Ticket['estado'], mismaColumna = false, dentro = true) {
    const container = {};
    return {
      container,
      previousContainer: mismaColumna ? container : {},
      isPointerOverContainer: dentro,
      item: { data: { id: '1', estado } },
    } as CdkDragDrop<Ticket[], Ticket[], Ticket>;
  }

  it('emite el estado destino al arrastrar un ticket cerrado a una columna vacia', () => {
    const cambios: unknown[] = [];
    component.cambiarEstado.subscribe((evento) => cambios.push(evento));
    component.soltarTicket(soltar('Cerrado'));
    expect(cambios).toEqual([{ ticket: { id: '1', estado: 'Cerrado' }, nuevoEstado: 'Abierto' }]);
  });

  it('ignora movimientos internos, fuera de la columna o durante un guardado', () => {
    const cambios: unknown[] = [];
    component.cambiarEstado.subscribe((evento) => cambios.push(evento));
    component.soltarTicket(soltar('Cerrado', true));
    component.soltarTicket(soltar('Cerrado', false, false));
    component.soltarTicket(soltar('Abierto'));
    fixture.componentRef.setInput('actualizando', true);
    component.soltarTicket(soltar('Cerrado'));
    expect(cambios).toEqual([]);
  });
});
