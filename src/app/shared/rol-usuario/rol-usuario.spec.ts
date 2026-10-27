import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolUsuario } from './rol-usuario';

describe('RolUsuario', () => {
  let component: RolUsuario;
  let fixture: ComponentFixture<RolUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(RolUsuario);
    component = fixture.componentInstance;
    // CORRECCIÓN: `rol` es un input obligatorio; sin darle un valor no se puede crear.
    fixture.componentRef.setInput('rol', 'Soporte');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: muestra el texto del rol y aplica la clase de color que corresponde.
  it('muestra el rol y su clase de color', () => {
    const etiqueta = (fixture.nativeElement as HTMLElement).querySelector('.rol');

    expect(etiqueta?.textContent?.trim()).toBe('Soporte');
    expect(etiqueta?.classList.contains('soporte')).toBe(true);
    expect(etiqueta?.classList.contains('administrador')).toBe(false);
  });
});
