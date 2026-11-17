import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Sesion } from '../services/sesion';
import { tokenInterceptor } from './token-interceptor';
import { API_BASE_URL } from '../config/api';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;
  let sesion: Sesion;

  beforeEach(() => {
    sessionStorage.clear();
    // CORRECCIÓN: el spec original solo comprobaba que la función existiera; ahora se prueba
    // con un HttpClient real (con el interceptor registrado) y su versión de pruebas.
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(Sesion);
  });

  afterEach(() => {
    controlador.verify();
    sessionStorage.clear();
  });

  it('agrega el token a las peticiones a la API cuando hay sesión', () => {
    sesion.establecer({ rol: 'Soporte', token: 'demo-soporte', username: 'soporte' });
    http.get(`${API_BASE_URL}/tickets`).subscribe();
    const peticion = controlador.expectOne(`${API_BASE_URL}/tickets`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer demo-soporte');
    peticion.flush([]);
  });

  it('no agrega el encabezado sin sesión ni a otros orígenes', () => {
    http.get(`${API_BASE_URL}/tickets`).subscribe();
    expect(controlador.expectOne(`${API_BASE_URL}/tickets`).request.headers.has('Authorization')).toBe(false);

    sesion.establecer({ rol: 'Administrador', token: 'demo-administrador', username: 'administrador' });
    http.get('https://otro-sitio.com/datos').subscribe();
    expect(controlador.expectOne('https://otro-sitio.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 de la API cierra la sesión, va al login y relanza el error', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    sesion.establecer({ rol: 'Usuario', token: 'demo-usuario', username: 'usuario' });
    let estado = 0;
    http.get(`${API_BASE_URL}/tickets`).subscribe({ error: (e) => (estado = e.status) });
    controlador.expectOne(`${API_BASE_URL}/tickets`).flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(estado).toBe(401);
    expect(sesion.actual()).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  // AGREGADO: la API externa tiene rutas públicas (login) y protegidas (tickets, usuarios).
  it('no agrega el token a /auth/token ni a rutas ajenas del mismo origen, y un 401 del login no redirige', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    sesion.establecer({ rol: 'Usuario', token: 'demo-usuario', username: 'usuario' });

    http.post(`${API_BASE_URL}/auth/token`, {}).subscribe({ error: () => undefined });
    const login = controlador.expectOne(`${API_BASE_URL}/auth/token`);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush('credenciales', { status: 401, statusText: 'Unauthorized' });
    expect(navegar).not.toHaveBeenCalled();
    expect(sesion.actual()).not.toBeNull();

    http.get(`${API_BASE_URL}/otra-ruta`).subscribe();
    expect(controlador.expectOne(`${API_BASE_URL}/otra-ruta`).request.headers.has('Authorization')).toBe(false);
  });

  it('agrega el token a usuarios y a la consulta paginada de tickets', () => {
    sesion.establecer({ rol: 'Administrador', token: 'tok', username: 'adm' });
    http.get(`${API_BASE_URL}/usuarios`).subscribe();
    http.get(`${API_BASE_URL}/tickets/paginados`, { params: { page: 1 } }).subscribe();
    const peticiones = controlador.match(() => true);
    expect(peticiones.length).toBe(2);
    for (const r of peticiones) {
      expect(r.request.headers.get('Authorization')).toBe('Bearer tok');
    }
  });

  it('un error distinto de 401 no cierra la sesión', () => {
    sesion.establecer({ rol: 'Usuario', token: 'demo-usuario', username: 'usuario' });
    http.get(`${API_BASE_URL}/tickets`).subscribe({ error: () => undefined });
    controlador.expectOne(`${API_BASE_URL}/tickets`).flush('x', { status: 500, statusText: 'Error' });
    expect(sesion.actual()).not.toBeNull();
  });
});
