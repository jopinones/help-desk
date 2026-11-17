import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api';
import { Sesion } from './sesion';

describe('Sesion', () => {
  let service: Sesion;

  beforeEach(() => {
    // AGREGADO: sessionStorage es global; se limpia para que un test no contamine al siguiente.
    sessionStorage.clear();
    // CORRECCIÓN: Sesion ahora consulta la API (HttpClient); se usa su versión de pruebas.
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Sesion);
  });

  afterEach(() => sessionStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.actual()).toBeNull();
  });

  it('inicia y cierra la sesión, y evalúa roles', () => {
    service.establecer({ rol: 'Soporte', token: 'demo-soporte', username: 'soporte' });
    expect(service.actual()).toEqual({ rol: 'Soporte', token: 'demo-soporte', username: 'soporte' });
    expect(service.tieneAlgunRol(['Soporte', 'Administrador'])).toBe(true);
    expect(service.tieneAlgunRol(['Administrador'])).toBe(false);
    service.cerrar();
    expect(service.actual()).toBeNull();
    expect(service.tieneAlgunRol(['Soporte'])).toBe(false);
  });

  // AGREGADO: inicio de sesión contra la API externa.
  it('iniciarSesion pide el token a /auth/token y deja la sesión activa y guardada', () => {
    let resultado: unknown;
    service.iniciarSesion('ana', 'secreta').subscribe((s) => (resultado = s));
    const peticion = TestBed.inject(HttpTestingController).expectOne(`${API_BASE_URL}/auth/token`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ username: 'ana', password: 'secreta' });
    peticion.flush({ rol: 'Soporte', token: 'abc', username: 'ana' });

    expect(resultado).toEqual({ rol: 'Soporte', token: 'abc', username: 'ana' });
    expect(service.actual()?.token).toBe('abc');
    expect(service.puedeGestionarTickets()).toBe(true);
    expect(sessionStorage.getItem('help-desk.sesion')).toContain('abc');
  });

  it('iniciarSesion rechaza una respuesta sin token o con rol desconocido', () => {
    const http = TestBed.inject(HttpTestingController);
    for (const cuerpo of [{ rol: 'Soporte', username: 'a' }, { rol: 'Root', token: 't', username: 'a' }]) {
      let fallo = false;
      service.iniciarSesion('a', 'b').subscribe({ error: () => (fallo = true) });
      http.expectOne(`${API_BASE_URL}/auth/token`).flush(cuerpo);
      expect(fallo).toBe(true);
      expect(service.actual()).toBeNull();
    }
  });

  it('el perfil Usuario no puede gestionar tickets', () => {
    service.establecer({ rol: 'Usuario', token: 't', username: 'u' });
    expect(service.puedeGestionarTickets()).toBe(false);
  });

  it('conserva la sesión al recargar y descarta datos inválidos', () => {
    service.establecer({ rol: 'Administrador', token: 'demo-administrador', username: 'administrador' });
    // Simula una recarga: un servicio nuevo lee lo guardado.
    TestBed.resetTestingModule();
    expect(TestBed.inject(Sesion).actual()?.rol).toBe('Administrador');

    sessionStorage.setItem('help-desk.sesion', JSON.stringify({ rol: 'Superusuario', token: 'x' }));
    TestBed.resetTestingModule();
    expect(TestBed.inject(Sesion).actual()).toBeNull();
  });
});
