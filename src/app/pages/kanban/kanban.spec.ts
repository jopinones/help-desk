import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
    const base = {
      asunto: 'a',
      descripcion: 'd',
      prioridad: 'Baja',
      fechaCreacion: '2026-01-01',
    } as const;
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

  it('evita guardados simultáneos y conserva el estado si falla la petición', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/tickets').flush([]);
    const ticket = {
      id: '1',
      asunto: 'a',
      descripcion: 'd',
      prioridad: 'Baja',
      estado: 'Abierto',
      fechaCreacion: '2026-01-01',
    } as const;
    component.tickets.set([ticket]);
    component.actualizarEstado(ticket, 'En proceso');
    component.actualizarEstado({ ...ticket, id: '2' }, 'Cerrado');
    const peticion = http.expectOne('http://localhost:3000/tickets/1');
    expect(peticion.request.body.estado).toBe('En proceso');
    http.expectNone('http://localhost:3000/tickets/2');
    peticion.flush({}, { status: 500, statusText: 'Error' });
    expect(component.actualizandoID()).toBeNull();
    expect(component.tickets()[0].estado).toBe('Abierto');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No fue posible cambiar el estado',
    );
    http.verify();
  });

  it('actualiza la columna cuando el servidor confirma el guardado', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:3000/tickets').flush([]);
    const ticket = {
      id: '1',
      asunto: 'a',
      descripcion: 'd',
      prioridad: 'Baja',
      estado: 'Abierto',
      fechaCreacion: '2026-01-01',
    } as const;
    component.tickets.set([ticket]);
    component.actualizarEstado(ticket, 'En proceso');
    http.expectOne('http://localhost:3000/tickets/1').flush({ ...ticket, estado: 'En proceso' });
    expect(component.ticketsPorEstado('Abierto')).toEqual([]);
    expect(component.ticketsPorEstado('En proceso').length).toBe(1);
    expect(component.actualizandoID()).toBeNull();
    http.verify();
  });

  it('persiste las transiciones en ambos sentidos entre todos los estados', () => {
    const http = TestBed.inject(HttpTestingController);
    const ticket = {
      id: '1',
      asunto: 'a',
      descripcion: 'd',
      prioridad: 'Baja',
      estado: 'Abierto',
      fechaCreacion: '2026-01-01',
    } as const;
    http.expectOne('http://localhost:3000/tickets').flush([ticket]);
    const destinos = [
      'En proceso',
      'Cerrado',
      'En proceso',
      'Abierto',
      'Cerrado',
      'Abierto',
    ] as const;
    for (const estado of destinos) {
      component.actualizarEstado(component.tickets()[0], estado);
      const peticion = http.expectOne('http://localhost:3000/tickets/1');
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body.estado).toBe(estado);
      peticion.flush({ ...ticket, estado });
      expect(component.ticketsPorEstado(estado).map((ticket) => ticket.id)).toEqual(['1']);
    }
    http.verify();
  });

  // AGREGADO: pruebas de los filtros.
  it('combina los filtros y limpiarFiltros los restablece', () => {
    const base = { descripcion: 'd', fechaCreacion: '2026-01-01' } as const;
    component.tickets.set([
      { ...base, id: '1', asunto: 'Red caída', prioridad: 'Alta', estado: 'Abierto' },
      { ...base, id: '2', asunto: 'Impresora', prioridad: 'Baja', estado: 'Abierto' },
    ]);
    component.actualizarBusqueda('red');
    component.actualizarPrioridadSeleccionada('Alta');
    expect(component.ticketsFiltrados().map((t) => t.id)).toEqual(['1']);
    component.limpiarFiltros();
    expect(component.ticketsFiltrados().length).toBe(2);
    expect(component.textoBusqueda()).toBe('');
  });

  it('avisa cuando los filtros no encuentran tickets', () => {
    const base = { descripcion: 'd', fechaCreacion: '2026-01-01', prioridad: 'Baja', estado: 'Abierto' } as const;
    component.cargando.set(false);
    component.tickets.set([{ ...base, id: '1', asunto: 'a' }]);
    component.actualizarBusqueda('zzz');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ningún ticket coincide');
    expect(fixture.nativeElement.querySelector('.tablero')).toBeNull();
  });

  // AGREGADO: filtro por rango de fechas (extremos inclusivos).
  it('filtra por rango Desde - Hasta incluyendo ambos extremos y se limpia', () => {
    const base = { asunto: 'a', descripcion: 'd', prioridad: 'Baja', estado: 'Abierto' } as const;
    component.tickets.set([
      { ...base, id: '1', fechaCreacion: '2026-01-10' },
      { ...base, id: '2', fechaCreacion: '2026-02-10' },
      { ...base, id: '3', fechaCreacion: '2026-03-10' },
    ]);
    component.fechaDesde.set(new Date(2026, 1, 10));
    component.fechaHasta.set(new Date(2026, 2, 10));
    expect(component.ticketsFiltrados().map((t) => t.id)).toEqual(['2', '3']);
    component.fechaHasta.set(null);
    component.fechaDesde.set(new Date(2026, 2, 1));
    expect(component.ticketsFiltrados().map((t) => t.id)).toEqual(['3']);
    component.limpiarFiltros();
    expect(component.ticketsFiltrados().length).toBe(3);
  });
});
