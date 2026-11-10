import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;

  const base = { descripcion: 'd', fechaCreacion: '2026-01-01' } as const;
  const tickets = [
    { ...base, id: '1', asunto: 'a', estado: 'Abierto', prioridad: 'Alta' },
    { ...base, id: '2', asunto: 'b', estado: 'Cerrado', prioridad: 'Alta' },
    { ...base, id: '3', asunto: 'c', estado: 'En proceso', prioridad: 'Baja' },
    { ...base, id: '4', asunto: 'd', estado: 'Cerrado', prioridad: 'Media' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      // CORRECCIÓN: el dashboard consulta la API; se usa HttpClient en su versión de pruebas.
      // Ya no usa routerLink, así que no necesita provideRouter.
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calcula el resumen y alimenta los gráficos con los datos de la API', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush(tickets);
    fixture.detectChanges();
    expect(component.resumen()).toEqual({ total: 4, abiertos: 1, enProceso: 1, cerrados: 2, altaPendientes: 1 });
    expect(component.serieEstados().map((s) => s.cantidad)).toEqual([1, 1, 2]);
    expect(component.serieCierre().map((s) => s.cantidad)).toEqual([2, 2]);
    expect(fixture.nativeElement.querySelectorAll('app-grafico-tickets').length).toBe(4); // CAMBIO: 2 → 3 (por prioridad) → 4 (creados por día).
  });

  it('el filtro de prioridad actualiza indicadores y gráficos', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush(tickets);
    component.cambiarPrioridad('Alta');
    fixture.detectChanges();
    expect(component.resumen().total).toBe(2);
    expect(component.serieEstados().map((s) => s.cantidad)).toEqual([1, 0, 1]);
  });

  // AGREGADO: gráfico "Tickets pendientes por prioridad".
  it('cuenta los pendientes por prioridad y responde al filtro', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush([
      ...tickets,
      { ...base, id: '5', asunto: 'e', estado: 'En proceso', prioridad: 'Alta' },
    ]);
    // Pendientes: Alta (Abierto + En proceso) = 2, Baja (En proceso) = 1, Media (solo cerrado) = 0.
    expect(component.seriePendientesPrioridad()).toEqual([
      { etiqueta: 'Baja', cantidad: 1, color: '#15803d' },
      { etiqueta: 'Media', cantidad: 0, color: '#a16207' },
      { etiqueta: 'Alta', cantidad: 2, color: '#b91c1c' },
    ]);
    component.cambiarPrioridad('Alta');
    expect(component.seriePendientesPrioridad().map((s) => s.cantidad)).toEqual([0, 0, 2]);
    fixture.detectChanges();
    const titulos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('app-grafico-tickets h3'));
    expect(titulos.map((t) => t.textContent)).toContain('Tickets pendientes por prioridad');
  });

  // AGREGADO: gráfico de líneas "Tickets creados por día".
  it('los puntos de tickets por día suman el total y se actualizan con el filtro de prioridad', () => {
    const fecha = (id: string, fechaCreacion: string, prioridad: string) =>
      ({ ...base, id, asunto: id, estado: 'Abierto', prioridad, fechaCreacion });
    http.expectOne((r) => r.url.endsWith('/tickets')).flush([
      fecha('1', '2026-10-01', 'Alta'),
      fecha('2', '2026-10-01T09:30:00', 'Baja'),
      fecha('3', '2026-10-04', 'Alta'),
      fecha('4', '2026-10-04', 'Media'),
      fecha('5', '2026-10-04', 'Alta'),
    ]);
    const suma = () => component.serieCreadosPorDia().reduce((s, p) => s + p.cantidad, 0);
    const puntosDibujados = () => fixture.nativeElement.querySelectorAll('app-grafico-tickets .punto').length;

    // Todas las prioridades: del 01 al 04 hay 4 días (02 y 03 en 0) y suman los 5 tickets.
    fixture.detectChanges();
    expect(component.serieCreadosPorDia().map((p) => p.cantidad)).toEqual([2, 0, 0, 3]);
    expect(component.serieCreadosPorDia()[0].etiqueta).toBe('01-10-2026');
    expect(suma()).toBe(component.resumen().total);
    expect(puntosDibujados()).toBe(4);

    // Prioridad Alta: 3 tickets (1 el día 01 y 2 el día 04).
    component.cambiarPrioridad('Alta');
    fixture.detectChanges();
    expect(component.serieCreadosPorDia().map((p) => p.cantidad)).toEqual([1, 0, 0, 2]);
    expect(suma()).toBe(3);
    expect(suma()).toBe(component.resumen().total);
    expect(puntosDibujados()).toBe(4);

    // Prioridad Media: un solo día, un punto.
    component.cambiarPrioridad('Media');
    fixture.detectChanges();
    expect(component.serieCreadosPorDia().map((p) => p.cantidad)).toEqual([1]);
    expect(suma()).toBe(component.resumen().total);
    expect(puntosDibujados()).toBe(1);

    // Prioridad Baja: el ticket del día 01 (con hora en la fecha); también suma el total.
    component.cambiarPrioridad('Baja');
    expect(component.serieCreadosPorDia().map((p) => p.cantidad)).toEqual([1]);
    expect(suma()).toBe(component.resumen().total);
  });

  it('sin tickets en la selección no muestra los gráficos', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-grafico-tickets').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No hay tickets registrados');
  });

  it('muestra un error si la API falla', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush('x', { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los indicadores');
  });
});
