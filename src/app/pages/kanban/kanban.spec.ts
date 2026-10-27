import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Kanban } from './kanban';

describe('Kanban', () => {
  let component: Kanban;
  let fixture: ComponentFixture<Kanban>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kanban],
      // CORRECCIÓN: el servicio usa HttpClient y las tarjetas routerLink; sin estos
      // providers el spec fallaba (NG0201).
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Kanban);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filtra los tickets por estado', () => {
    const base = { asunto: 'a', descripcion: 'd', prioridad: 'Baja', fechaCreacion: '2026-01-01' } as const;
    component.tickets.set([
      { ...base, id: '1', estado: 'Abierto' },
      { ...base, id: '2', estado: 'Cerrado' },
    ]);
    expect(component.ticketsPorEstado('Abierto').map((t) => t.id)).toEqual(['1']);
  });

  it('ordena los tickets de cada columna por fecha, el más reciente primero', () => {
    const base = { asunto: 'a', descripcion: 'd', prioridad: 'Baja', estado: 'Abierto' } as const;
    component.tickets.set([
      { ...base, id: '1', fechaCreacion: '2026-01-01' },
      { ...base, id: '2', fechaCreacion: '2026-03-01' },
      { ...base, id: '3', fechaCreacion: '2026-02-01' },
    ]);
    expect(component.ticketsPorEstado('Abierto').map((t) => t.id)).toEqual(['2', '3', '1']);
  });

  it('muestra "No hay tickets registrados" y no el tablero si la lista está vacía', () => {
    component.cargando.set(false);
    component.tickets.set([]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No hay tickets registrados');
    expect(el.querySelector('.tablero')).toBeNull();
  });
});
