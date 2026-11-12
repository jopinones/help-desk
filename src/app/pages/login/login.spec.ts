import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Sesion } from '../../services/sesion';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      // CORRECCIÓN: el componente navega con Router, que necesita provideRouter.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => sessionStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra un botón por rol y al elegir uno inicia la sesión y va al dashboard', () => {
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(botones.map((b) => b.textContent?.trim())).toEqual([
      'Entrar como Administrador',
      'Entrar como Soporte',
      'Entrar como Usuario',
    ]);

    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    botones[1].click();
    expect(TestBed.inject(Sesion).actual()?.rol).toBe('Soporte');
    expect(navegar).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
  });
});
