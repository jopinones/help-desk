import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Sesion } from '../services/sesion';
import { requiereRoles, sesionGuard } from './acceso-guard';

// CORRECCIÓN: el spec importaba `accesoGuard`, que no existe (los guards se llaman sesionGuard
// y requiereRoles); por eso no compilaba. Ahora prueba los dos guards reales.
describe('guards de acceso', () => {
  const ejecutar = (guard: CanActivateFn) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  const url = (resultado: unknown) => TestBed.inject(Router).serializeUrl(resultado as UrlTree);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => sessionStorage.clear());

  it('sesionGuard envía al login sin sesión y deja pasar con sesión', () => {
    expect(url(ejecutar(sesionGuard))).toBe('/login');
    TestBed.inject(Sesion).iniciarDemostracion('Usuario');
    expect(ejecutar(sesionGuard)).toBe(true);
  });

  it('requiereRoles: login sin sesión, sin-acceso con otro rol y paso con el rol correcto', () => {
    const guard = requiereRoles('Administrador');
    expect(url(ejecutar(guard))).toBe('/login');

    const sesion = TestBed.inject(Sesion);
    sesion.iniciarDemostracion('Usuario');
    expect(url(ejecutar(guard))).toBe('/sin-acceso');

    sesion.iniciarDemostracion('Administrador');
    expect(ejecutar(guard)).toBe(true);
  });
});
