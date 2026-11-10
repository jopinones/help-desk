import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      // CORRECCIÓN: la plantilla usa routerLink (router) y ahora el componente consulta la API
      // (HttpClient, en su versión de pruebas para no llamar al servidor real).
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  const base = { descripcion: 'd', fechaCreacion: '2026-01-01' } as const;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calcula los indicadores con los datos de la API', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush([
      { ...base, id: '1', asunto: 'a', estado: 'Abierto', prioridad: 'Alta' },
      { ...base, id: '2', asunto: 'b', estado: 'Cerrado', prioridad: 'Alta' },
      { ...base, id: '3', asunto: 'c', estado: 'En proceso', prioridad: 'Baja' },
      { ...base, id: '4', asunto: 'd', estado: 'Cerrado', prioridad: 'Media' },
    ]);
    http.expectOne((r) => r.url.endsWith('/usuarios')).flush([
      { id: '1', nombre: 'A', email: 'a@a.cl', rol: 'Agente', estado: 'Vigente', fechaCreacion: '2026-01-01' },
      { id: '2', nombre: 'B', email: 'b@a.cl', rol: 'Agente', estado: 'Bloqueado', fechaCreacion: '2026-01-01' },
      { id: '3', nombre: 'C', email: 'c@a.cl', rol: 'Agente', estado: 'Eliminado', fechaCreacion: '2026-01-01' },
    ]);
    const valor = (titulo: string) => component.indicadores().find((i) => i.titulo === titulo)?.valor;
    expect(valor('Total de tickets')).toBe(4);
    expect(valor('Abiertos')).toBe(1);
    expect(valor('En proceso')).toBe(1);
    expect(valor('Cerrados')).toBe(2);
    expect(valor('Prioridad alta')).toBe(1);
    expect(valor('Tasa de cierre')).toBe(50);
    expect(valor('Usuarios vigentes')).toBe(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-tarjeta-indicador').length).toBe(7);
  });

  it('muestra un error si la API falla', () => {
    http.expectOne((r) => r.url.endsWith('/tickets')).flush('x', { status: 500, statusText: 'Error' });
    http.match((r) => r.url.endsWith('/usuarios'));
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los indicadores');
  });
});
