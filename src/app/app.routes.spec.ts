import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptor/token-interceptor';
import { Rol, Sesion } from './services/sesion';

// AGREGADO: pruebas de permisos sobre las rutas reales de tickets, con los tres perfiles.
// Se navega con el router (navegación interna), sin recargar la página.
describe('Permisos de tickets en las rutas', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  async function iniciar(rol: Rol) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(Sesion).iniciarDemostracion(rol);
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  }

  afterEach(() => sessionStorage.clear());

  const formularios = ['/tickets/nuevo', '/tickets/editar/1'];

  for (const rol of ['Soporte', 'Administrador'] as const) {
    it(`${rol} puede abrir los formularios de crear y editar`, async () => {
      await iniciar(rol);
      for (const url of formularios) {
        await harness.navigateByUrl(url);
        expect(TestBed.inject(Router).url).toBe(url);
      }
    });
  }

  it('Usuario es rechazado en ambos formularios y va a /sin-acceso', async () => {
    await iniciar('Usuario');
    for (const url of formularios) {
      await harness.navigateByUrl('/tickets');
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe('/sin-acceso');
      expect(harness.routeNativeElement?.textContent).toContain('Acceso restringido');
    }
  });

  it('Usuario conserva el acceso al listado y al detalle', async () => {
    await iniciar('Usuario');
    await harness.navigateByUrl('/tickets');
    expect(TestBed.inject(Router).url).toBe('/tickets');
    await harness.navigateByUrl('/tickets/1');
    expect(TestBed.inject(Router).url).toBe('/tickets/1');
  });

  it('listado y detalle: Nuevo ticket y Editar solo aparecen para Soporte/Administrador', async () => {
    const ticket = { id: '1', asunto: 'A', descripcion: 'd', estado: 'Abierto', prioridad: 'Baja', fechaCreacion: '2026-01-01' };
    const resultados: Record<string, { nuevo: boolean; editarListado: boolean; editarDetalle: boolean; eliminar: boolean }> = {};

    for (const rol of ['Usuario', 'Soporte', 'Administrador'] as const) {
      TestBed.resetTestingModule();
      await iniciar(rol);

      const listado = await harness.navigateByUrl('/tickets');
      http.match((r) => r.url.endsWith('/tickets')).forEach((r) => r.flush([ticket]));
      harness.detectChanges();
      const el: HTMLElement = harness.routeNativeElement!;
      const nuevo = !!el.querySelector('a[href="/tickets/nuevo"]');
      const editarListado = !!el.querySelector('[aria-label="Editar ticket"]');
      const eliminar = !!el.querySelector('[aria-label="Eliminar ticket"]');
      void listado;

      await harness.navigateByUrl('/tickets/1');
      http.match((r) => r.url.endsWith('/tickets/1')).forEach((r) => r.flush(ticket));
      harness.detectChanges();
      const editarDetalle = !!harness.routeNativeElement!.querySelector('a[href="/tickets/editar/1"]');

      resultados[rol] = { nuevo, editarListado, editarDetalle, eliminar };
    }

    expect(resultados['Usuario']).toEqual({ nuevo: false, editarListado: false, editarDetalle: false, eliminar: false });
    expect(resultados['Soporte']).toEqual({ nuevo: true, editarListado: true, editarDetalle: true, eliminar: true });
    expect(resultados['Administrador']).toEqual({ nuevo: true, editarListado: true, editarDetalle: true, eliminar: true });
  });

  it('Soporte: al crear un ticket, POST /tickets lleva Authorization: Bearer demo-soporte', async () => {
    await iniciar('Soporte');
    await harness.navigateByUrl('/tickets/nuevo');
    const { TicketService } = await import('./services/ticket');
    TestBed.inject(TicketService)
      .crearTicket({ asunto: 'Prueba', descripcion: 'd', estado: 'Abierto', prioridad: 'Baja', fechaCreacion: '2026-01-01' })
      .subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url === 'http://localhost:3000/tickets');
    expect(post.request.headers.get('Authorization')).toBe('Bearer demo-soporte');
    post.flush({});
  });
});
