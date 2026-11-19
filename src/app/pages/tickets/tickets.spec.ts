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

  // AGREGADO: vista rápida de tickets críticos.
  const botonCriticos = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.boton-criticos')!;

  it('"Ver tickets críticos" aplica Abierto + Alta con una sola consulta y conserva texto, fechas y tamaño', () => {
    consulta().flush(pagina(tickets, 30));
    component.cambiarPagina({ pageIndex: 2, pageSize: 10, length: 30, previousPageIndex: 0 });
    consulta().flush(pagina(tickets, 30));
    component.filtros.texto = 'red';
    component.filtros.fechaDesde = '2026-01-01';
    component.filtros.fechaHasta = '2026-03-01';
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Ver tickets críticos');

    botonCriticos().click();
    fixture.detectChanges();

    // Una única petición: si hubiera dos (una por filtro), expectOne fallaría.
    const peticion = consulta();
    const params = peticion.request.params;
    expect(params.get('estado')).toBe('Abierto');
    expect(params.get('prioridad')).toBe('Alta');
    expect(params.get('page')).toBe('1');
    expect(params.get('page_size')).toBe('10');
    expect(params.get('texto')).toBe('red');
    expect(params.get('fechaDesde')).toBe('2026-01-01');
    expect(params.get('fechaHasta')).toBe('2026-03-01');
    peticion.flush(pagina([tickets[0]], 1));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Quitar filtros críticos');
    expect(botonCriticos().getAttribute('aria-pressed')).toBe('true');
  });

  it('"Quitar filtros críticos" limpia solo Estado y Prioridad y vuelve a la primera página', () => {
    consulta().flush(pagina(tickets, 30));
    component.filtros.texto = 'red';
    component.filtros.fechaDesde = '2026-01-01';
    component.aplicarFiltroEstado('Abierto');
    consulta().flush(pagina(tickets, 30));
    component.aplicarFiltroPrioridad('Alta');
    consulta().flush(pagina(tickets, 30));
    component.cambiarPagina({ pageIndex: 3, pageSize: 20, length: 30, previousPageIndex: 0 });
    consulta().flush(pagina(tickets, 30));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Quitar filtros críticos');

    botonCriticos().click();

    const peticion = consulta();
    const params = peticion.request.params;
    expect(params.has('estado')).toBe(false);
    expect(params.has('prioridad')).toBe(false);
    expect(params.get('page')).toBe('1');
    expect(params.get('page_size')).toBe('20');
    expect(params.get('texto')).toBe('red');
    expect(params.get('fechaDesde')).toBe('2026-01-01');
    peticion.flush(pagina(tickets, 30));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Ver tickets críticos');
  });

  it('el texto del botón sigue a los filtros: Abierto + Alta manual lo activa y cambiar uno lo desactiva', () => {
    consulta().flush(pagina(tickets));
    component.aplicarFiltroEstado('Abierto');
    consulta().flush(pagina(tickets));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Ver tickets críticos');

    component.aplicarFiltroPrioridad('Alta');
    consulta().flush(pagina(tickets));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Quitar filtros críticos');

    component.aplicarFiltroPrioridad('Media');
    consulta().flush(pagina(tickets));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Ver tickets críticos');

    component.aplicarFiltroPrioridad('Alta');
    consulta().flush(pagina(tickets));
    component.aplicarFiltroEstado('En proceso');
    consulta().flush(pagina(tickets));
    fixture.detectChanges();
    expect(botonCriticos().textContent?.trim()).toBe('Ver tickets críticos');
  });

  it('desde otro estado y prioridad, "Ver tickets críticos" los reemplaza por Abierto + Alta', () => {
    consulta().flush(pagina(tickets));
    component.aplicarFiltroEstado('Cerrado');
    consulta().flush(pagina(tickets));
    component.aplicarFiltroPrioridad('Baja');
    consulta().flush(pagina(tickets));
    component.alternarFiltrosCriticos();
    const params = consulta().request.params;
    expect(params.get('estado')).toBe('Abierto');
    expect(params.get('prioridad')).toBe('Alta');
  });

  // AGREGADO: bloque "En esta página" (contadores por estado de las filas visibles).
  const contadores = () => {
    const el = fixture.nativeElement as HTMLElement;
    const valor = (estado: string) => Number(el.querySelector(`dd[data-estado="${estado}"]`)?.textContent);
    return [valor('Abierto'), valor('En proceso'), valor('Cerrado')];
  };
  const filasTabla = () => (fixture.nativeElement as HTMLElement).querySelectorAll('tr.mat-mdc-row:not(.sin-resultados)').length;
  const suma = (valores: number[]) => valores.reduce((a, b) => a + b, 0);
  const ticket = (id: string, estado: Ticket['estado']): Ticket => ({ ...base, id, asunto: `T${id}`, estado, fechaCreacion: '2026-01-10' });

  it('los contadores de "En esta página" suman las filas de la tabla al cambiar de página y al filtrar por estado', () => {
    consulta().flush(pagina([ticket('1', 'Abierto'), ticket('2', 'Abierto'), ticket('3', 'Cerrado')], 8));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('En esta página');
    expect(contadores()).toEqual([2, 0, 1]);
    expect(suma(contadores())).toBe(filasTabla());

    // Cambio de página: otra lista, otros contadores, siempre igual a las filas.
    component.cambiarPagina({ pageIndex: 1, pageSize: 5, length: 8, previousPageIndex: 0 });
    consulta().flush(pagina([ticket('4', 'En proceso'), ticket('5', 'En proceso'), ticket('6', 'Cerrado'), ticket('7', 'Abierto'), ticket('8', 'En proceso')], 8));
    fixture.detectChanges();
    expect(contadores()).toEqual([1, 3, 1]);
    expect(suma(contadores())).toBe(filasTabla());
    expect(filasTabla()).toBe(5);

    // Filtro por estado: la página llega solo con Cerrados; los demás estados muestran 0.
    component.aplicarFiltroEstado('Cerrado');
    consulta().flush(pagina([ticket('3', 'Cerrado'), ticket('6', 'Cerrado')], 2));
    fixture.detectChanges();
    expect(contadores()).toEqual([0, 0, 2]);
    expect(suma(contadores())).toBe(filasTabla());
    expect(filasTabla()).toBe(2);
  });

  it('al cambiar el tamaño de página los contadores se recalculan y sin tickets todos muestran 0', () => {
    consulta().flush(pagina([ticket('1', 'Abierto'), ticket('2', 'Cerrado')], 12));
    fixture.detectChanges();
    component.cambiarPagina({ pageIndex: 0, pageSize: 10, length: 12, previousPageIndex: 0 });
    consulta().flush(pagina(Array.from({ length: 10 }, (_, i) => ticket(String(i), i % 2 ? 'Abierto' : 'En proceso')), 12));
    fixture.detectChanges();
    expect(contadores()).toEqual([5, 5, 0]);
    expect(suma(contadores())).toBe(filasTabla());

    component.aplicarFiltroEstado('Cerrado');
    consulta().flush(pagina([], 0));
    fixture.detectChanges();
    expect(contadores()).toEqual([0, 0, 0]);
    expect(filasTabla()).toBe(0);
  });

  it('muestra un error si la API falla', () => {
    consulta().flush('x', { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los tickets');
  });
});
