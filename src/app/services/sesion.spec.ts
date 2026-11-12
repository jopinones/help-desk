import { TestBed } from '@angular/core/testing';
import { Sesion } from './sesion';

describe('Sesion', () => {
  let service: Sesion;

  beforeEach(() => {
    // AGREGADO: sessionStorage es global; se limpia para que un test no contamine al siguiente.
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sesion);
  });

  afterEach(() => sessionStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.actual()).toBeNull();
  });

  it('inicia y cierra la sesión, y evalúa roles', () => {
    service.iniciarDemostracion('Soporte');
    expect(service.actual()).toEqual({ rol: 'Soporte', token: 'demo-soporte' });
    expect(service.tieneAlgunRol(['Soporte', 'Administrador'])).toBe(true);
    expect(service.tieneAlgunRol(['Administrador'])).toBe(false);
    service.cerrar();
    expect(service.actual()).toBeNull();
    expect(service.tieneAlgunRol(['Soporte'])).toBe(false);
  });

  it('conserva la sesión al recargar y descarta datos inválidos', () => {
    service.iniciarDemostracion('Administrador');
    // Simula una recarga: un servicio nuevo lee lo guardado.
    TestBed.resetTestingModule();
    expect(TestBed.inject(Sesion).actual()?.rol).toBe('Administrador');

    sessionStorage.setItem('help-desk.sesion', JSON.stringify({ rol: 'Superusuario', token: 'x' }));
    TestBed.resetTestingModule();
    expect(TestBed.inject(Sesion).actual()).toBeNull();
  });
});
