import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../config/api';
import { Ticket } from '../../models/ticket';
import { Tickets } from './tickets';

// CORRECCIÓN: el spec probaba el filtrado en el navegador (dataSource.filteredData); ahora el
// filtrado y la paginación los hace la API, así que se comprueban las consultas que se envían.
describe('Tickets', () => {
  let component: Tickets;
  let fixture: ComponentFixture<Tickets>;
  let http: HttpTestingController;

  const base = { descripcion: 'd', prioridad: 'Baja', estado: 'Abierto' } as const;
  const tickets: Ticket[] = [
    { ...base, id: '1', asunto: 'Sin internet', fechaCreacion: '2026-01-10' },
    { ...base, id: '2', asunto: 'Impresora', estado: 'Cerrado', fechaCreacion: '2026-02-10' },
  ];

  const pagina = (results: Ticket[], count = results.length) => ({ count, next: null, previous: null, results });
  const consulta = () =>
    http.expectOne((r) => r.url === `${API_BASE_URL}/tickets/paginados`);

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Tickets],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Tickets);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should create', () => {
    consulta().flush(pagina([]));
    expect(component).toBeTruthy();
  });

  it('pide la primera página (page=1, page_size=5) sin filtros vacíos y muestra el total del servidor', () => {
    const peticion = consulta();
    expect(peticion.request.params.get('page')).toBe('1');
    expect(peticion.request.params.get('page_size')).toBe('5');
    expect(peticion.request.params.keys().sort()).toEqual(['page', 'page_size']);
    peticion.flush(pagina(tickets, 12));

    expect(component.dataSource.data.length).toBe(2);
    expect(component.total()).toBe(12);
    expect(component.cargando()).toBe(false);
  });

  it('al cambiar de página o de tamaño vuelve a consultar con page y page_size nuevos', () => {
    consulta().flush(pagina(tickets, 12));
    component.cambiarPagina({ pageIndex: 1, pageSize: 10, length: 12, previousPageIndex: 0 });
    const peticion = consulta();
    expect(peticion.request.params.get('page')).toBe('2');
    expect(peticion.request.params.get('page_size')).toBe('10');
    peticion.flush(pagina(tickets, 12));
  });

  it('un filtro se envía al servidor y reinicia a la primera página', () => {
    consulta().flush(pagina(tickets, 12));
    component.pagina.set(2);
    component.aplicarFiltroEstado('Cerrado');
    const peticion = consulta();
    expect(peticion.request.params.get('estado')).toBe('Cerrado');
    expect(peticion.request.params.get('page')).toBe('1');
    peticion.flush(pagina([tickets[1]]));
    expect(component.hayFiltros).toBe(true);
  });

  it('la búsqueda por texto espera 300 ms y envía una sola consulta', () => {
    vi.useFakeTimers();
    try {
      consulta().flush(pagina(tickets));
      component.aplicarBusqueda('int');
      component.aplicarBusqueda('inte');
      component.aplicarBusqueda('internet');
      vi.advanceTimersByTime(299);
      http.expectNone((r) => r.url.endsWith('/tickets/paginados'));
      vi.advanceTimersByTime(1);
      const peticion = consulta();
      expect(peticion.request.params.get('texto')).toBe('internet');
      peticion.flush(pagina([tickets[0]]));
    } finally {
      vi.useRealTimers();
    }
  });

  it('no rellena "Hasta" al elegir solo "Desde" y respeta el orden del rango', () => {
    consulta().flush(pagina(tickets));
    component.aplicarFechaDesde('2026-02-01');
    expect(component.filtros.fechaHasta).toBe('');
    const peticion = consulta();
    expect(peticion.request.params.get('fechaDesde')).toBe('2026-02-01');
    expect(peticion.request.params.has('fechaHasta')).toBe(false);
    peticion.flush(pagina([tickets[1]]));

    component.aplicarFechaHasta('2026-01-31');
    expect(component.filtros.fechaDesde).toBe('2026-01-31');
    consulta().flush(pagina([]));
  });

  it('si tras eliminar se vacía la última página, retrocede a la anterior', () => {
    consulta().flush(pagina(tickets, 6));
    component.cambiarPagina({ pageIndex: 1, pageSize: 5, length: 6, previousPageIndex: 0 });
    // El servidor responde una página vacía aunque aún hay 5 tickets en total.
    consulta().flush(pagina([], 5));
    const reintento = consulta();
    expect(reintento.request.params.get('page')).toBe('1');
    reintento.flush(pagina(tickets, 5));
    expect(component.pagina()).toBe(0);
  });

  it('muestra un error si la API falla', () => {
    consulta().flush('x', { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los tickets');
  });
});
