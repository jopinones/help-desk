import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SinAcceso } from './sin-acceso';

describe('SinAcceso', () => {
  let component: SinAcceso;
  let fixture: ComponentFixture<SinAcceso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SinAcceso],
      // CORRECCIÓN: la plantilla usa routerLink, que necesita el router.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SinAcceso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Acceso restringido');
  });
});
