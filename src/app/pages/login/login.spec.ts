import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { API_BASE_URL } from '../../config/api';
import { Sesion } from '../../services/sesion';
import { Login } from './login';

// CORRECCIÓN: el spec seguía probando el login anterior (un botón por perfil de demostración);
// el login actual pide usuario y contraseña a la API externa.
describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      // El componente navega (Router) y la sesión consulta la API (HttpClient de pruebas).
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => sessionStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no consulta la API si faltan usuario o contraseña', () => {
    component.username = '  ';
    component.password = '';
    component.entrar();
    http.expectNone(`${API_BASE_URL}/auth/token`);
  });

  it('con credenciales correctas inicia la sesión y va al dashboard', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.username = ' ana ';
    component.password = 'secreta';
    component.entrar();

    const peticion = http.expectOne(`${API_BASE_URL}/auth/token`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ username: 'ana', password: 'secreta' });
    peticion.flush({ rol: 'Soporte', token: 'abc', username: 'ana' });

    expect(TestBed.inject(Sesion).actual()?.rol).toBe('Soporte');
    expect(component.password).toBe('');
    expect(navegar).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
    expect(component.enviando()).toBe(false);
  });

  it('muestra un mensaje según el error de la API y no inicia sesión', () => {
    const casos: [number, string][] = [
      [401, 'Revisa el usuario y la contraseña.'],
      [403, 'El servidor rechazó el acceso de esta cuenta.'],
      [429, 'Demasiados intentos. Espera un momento.'],
      [500, 'La API no pudo iniciar la sesión.'],
    ];

    for (const [status, mensaje] of casos) {
      component.username = 'ana';
      component.password = 'x';
      component.entrar();
      http.expectOne(`${API_BASE_URL}/auth/token`).flush('error', { status, statusText: 'Error' });
      expect(component.mensajeError()).toBe(mensaje);
    }
    expect(TestBed.inject(Sesion).actual()).toBeNull();
  });

  it('rechaza una respuesta con un rol desconocido', () => {
    component.username = 'ana';
    component.password = 'x';
    component.entrar();
    http.expectOne(`${API_BASE_URL}/auth/token`).flush({ rol: 'Superusuario', token: 'abc', username: 'ana' });
    expect(TestBed.inject(Sesion).actual()).toBeNull();
    expect(component.mensajeError()).not.toBe('');
  });
});
