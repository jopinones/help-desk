import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Sesion } from '../services/sesion';
import { tokenInterceptor } from './token-interceptor';

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
    sesion.iniciarDemostracion('Soporte');
    http.get('http://localhost:3000/tickets').subscribe();
    const peticion = controlador.expectOne('http://localhost:3000/tickets');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer demo-soporte');
    peticion.flush([]);
  });

  it('no agrega el encabezado sin sesión ni a otros orígenes', () => {
    http.get('http://localhost:3000/tickets').subscribe();
    expect(controlador.expectOne('http://localhost:3000/tickets').request.headers.has('Authorization')).toBe(false);

    sesion.iniciarDemostracion('Administrador');
    http.get('https://otro-sitio.com/datos').subscribe();
    expect(controlador.expectOne('https://otro-sitio.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 de la API cierra la sesión, va al login y relanza el error', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    sesion.iniciarDemostracion('Usuario');
    let estado = 0;
    http.get('http://localhost:3000/tickets').subscribe({ error: (e) => (estado = e.status) });
    controlador.expectOne('http://localhost:3000/tickets').flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(estado).toBe(401);
    expect(sesion.actual()).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('un error distinto de 401 no cierra la sesión', () => {
    sesion.iniciarDemostracion('Usuario');
    http.get('http://localhost:3000/tickets').subscribe({ error: () => undefined });
    controlador.expectOne('http://localhost:3000/tickets').flush('x', { status: 500, statusText: 'Error' });
    expect(sesion.actual()).not.toBeNull();
  });
});
