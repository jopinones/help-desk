import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { Sesion } from './services/sesion';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // CORRECCIÓN: el menú usa routerLink y router-outlet, que necesitan el router.
      providers: [provideRouter([])],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // AGREGADO: el menú muestra solo lo que cada rol puede abrir (igual que los guards).
  it('muestra en el menú solo los enlaces permitidos para el rol', async () => {
    sessionStorage.clear();
    const fixture = TestBed.createComponent(App);
    const sesion = TestBed.inject(Sesion);
    const enlaces = () =>
      Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mat-nav-list a')).map(
        (a) => a.getAttribute('href') ?? a.textContent?.trim(),
      );

    sesion.iniciarDemostracion('Usuario');
    await fixture.whenStable();
    expect(enlaces()).not.toContain('/kanban');
    expect(enlaces()).not.toContain('/usuarios');
    expect(enlaces()).toContain('/acerca-de');

    sesion.iniciarDemostracion('Soporte');
    await fixture.whenStable();
    expect(enlaces()).toContain('/kanban');
    expect(enlaces()).not.toContain('/reportes');

    sesion.iniciarDemostracion('Administrador');
    await fixture.whenStable();
    expect(enlaces()).toEqual(expect.arrayContaining(['/kanban', '/reportes', '/usuarios']));
    sessionStorage.clear();
  });

  // CORRECCIÓN: la prueba buscaba un <h1> 'Hello, help-desk' de la plantilla original;
  // ahora el título está en la barra superior.
  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.toolbar')?.textContent).toContain('Sistema Help Desk');
  });
});
