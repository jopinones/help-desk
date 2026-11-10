import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaIndicador } from './tarjeta-indicador';

describe('TarjetaIndicador', () => {
  let component: TarjetaIndicador;
  let fixture: ComponentFixture<TarjetaIndicador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaIndicador],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaIndicador);
    component = fixture.componentInstance;
    // CORRECCIÓN: titulo y valor son inputs obligatorios; se entregan con setInput.
    fixture.componentRef.setInput('titulo', 'Total de tickets');
    fixture.componentRef.setInput('valor', 12);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra título, valor y unidad, y aplica la variante', () => {
    fixture.componentRef.setInput('unidad', '%');
    fixture.componentRef.setInput('variante', 'verde');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Total de tickets');
    expect(el.querySelector('strong')?.textContent).toBe('12');
    expect(el.querySelector('.indicador-unidad')?.textContent).toBe('%');
    expect(el.querySelector('.indicador')?.classList).toContain('verde');
  });
});
