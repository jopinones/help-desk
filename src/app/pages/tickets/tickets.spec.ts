import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Ticket } from '../../models/ticket';
import { Tickets } from './tickets';

describe('Tickets', () => {
  let component: Tickets;
  let fixture: ComponentFixture<Tickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tickets],
      // CORRECCIÓN: faltaban el router y HttpClient; se usa la versión de pruebas para no llamar a la API real.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Tickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: pruebas de los filtros.
  const base = { descripcion: 'd', prioridad: 'Baja', estado: 'Abierto' } as const;
  const tickets: Ticket[] = [
    { ...base, id: '1', asunto: 'Sin internet', fechaCreacion: '2026-01-10' },
    { ...base, id: '2', asunto: 'Impresora', estado: 'Cerrado', fechaCreacion: '2026-02-10' },
  ];

  it('filtra por texto y por estado', () => {
    component.dataSource.data = tickets;
    component.aplicarBusqueda('internet');
    expect(component.dataSource.filteredData.map((t) => t.id)).toEqual(['1']);
    component.limpiarFiltros();
    component.aplicarFiltroEstado('Cerrado');
    expect(component.dataSource.filteredData.map((t) => t.id)).toEqual(['2']);
  });

  it('no rellena "Hasta" al elegir solo "Desde"', () => {
    component.aplicarFechaDesde('2026-02-01');
    expect(component.filtros.fechaHasta).toBe('');
    component.dataSource.data = tickets;
    expect(component.dataSource.filteredData.map((t) => t.id)).toEqual(['2']);
  });

  it('mantiene coherente el rango cuando Desde supera a Hasta', () => {
    component.aplicarFechaHasta('2026-01-31');
    component.aplicarFechaDesde('2026-03-01');
    expect(component.filtros.fechaHasta).toBe('2026-03-01');
  });
});
