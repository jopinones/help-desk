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
    fixture.componentRef.setInput('tickets', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el mensaje vacío sin tickets', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay tickets');
  });
});
