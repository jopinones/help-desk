import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api';
import { TicketService } from './ticket';

describe('TicketService', () => {
  let service: TicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // AGREGADO: los servicios usan la URL de la API externa (config/api.ts), no localhost.
  it('usa la URL base de la API externa en cada operación', () => {
    service.obtenerTickets().subscribe();
    service.obtenerTicket('7').subscribe();
    service.eliminarTicket('7').subscribe();
    const urls = http.match(() => true).map((r) => `${r.request.method} ${r.request.url}`);
    expect(urls).toEqual([
      `GET ${API_BASE_URL}/tickets`,
      `GET ${API_BASE_URL}/tickets/7`,
      `DELETE ${API_BASE_URL}/tickets/7`,
    ]);
  });

  it('obtenerTicketsPaginados envía page, page_size y solo los filtros con valor', () => {
    service
      .obtenerTicketsPaginados(3, 10, { texto: ' red ', estado: '', prioridad: 'Alta', fechaDesde: '', fechaHasta: '2026-03-01' })
      .subscribe();
    const peticion = http.expectOne((r) => r.url === `${API_BASE_URL}/tickets/paginados`);
    const params = peticion.request.params;
    expect(params.get('page')).toBe('3');
    expect(params.get('page_size')).toBe('10');
    expect(params.get('texto')).toBe('red');
    expect(params.get('prioridad')).toBe('Alta');
    expect(params.get('fechaHasta')).toBe('2026-03-01');
    expect(params.has('estado')).toBe(false);
    expect(params.has('fechaDesde')).toBe(false);
    peticion.flush({ count: 0, next: null, previous: null, results: [] });
  });
});
