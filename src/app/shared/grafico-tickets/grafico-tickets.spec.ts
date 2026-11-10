import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoTickets, SerieTickets } from './grafico-tickets';

describe('GraficoTickets', () => {
  let component: GraficoTickets;
  let fixture: ComponentFixture<GraficoTickets>;

  const series: SerieTickets[] = [
    { etiqueta: 'Abiertos', cantidad: 3, color: '#2563eb' },
    { etiqueta: 'Cerrados', cantidad: 1, color: '#15803d' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoTickets],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoTickets);
    component = fixture.componentInstance;
    // CORRECCIÓN: titulo, tipo y series son inputs obligatorios; se entregan con setInput.
    fixture.componentRef.setInput('titulo', 'Tickets por estado');
    fixture.componentRef.setInput('tipo', 'bar');
    fixture.componentRef.setInput('series', series);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dibuja una barra con su cantidad por serie', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('rect').length).toBe(2);
    expect(el.querySelectorAll('svg text').length).toBe(2);
    expect(el.querySelectorAll('li').length).toBe(2);
  });

  it('calcula segmentos, total y porcentaje para el anillo', () => {
    fixture.componentRef.setInput('tipo', 'doughnut');
    fixture.detectChanges();
    expect(component.total()).toBe(4);
    expect(component.segmentos().map((s) => s.inicio)).toEqual([0, 75]);
    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(2);
    expect(component.porcentaje(3)).toContain('75');
  });

  // AGREGADO: gráfico de líneas.
  it('dibuja la línea con un punto por serie y posiciona los valores', () => {
    fixture.componentRef.setInput('tipo', 'line');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.punto').length).toBe(2);
    expect(el.querySelector('polyline')?.getAttribute('points')).toBe(`24,40 224,${156 - (1 / 3) * 116}`);
    // El máximo queda arriba (y=40); el menor, proporcionalmente más abajo.
    expect(component.puntos().map((p) => p.y)).toEqual([40, 156 - (1 / 3) * 116]);
    // En líneas no se dibuja la lista de categorías.
    expect(el.querySelector('ul')).toBeNull();
  });

  it('en la línea, el punto activo muestra su detalle', () => {
    fixture.componentRef.setInput('tipo', 'line');
    component.activa.set('Cerrados');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalle')?.textContent).toContain('Cerrados - 1 tickets');
  });

  it('muestra el detalle de la serie activa y atenúa las demás', () => {
    component.activa.set('Abiertos');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.detalle')?.textContent).toContain('Abiertos - 3 tickets');
    expect(el.querySelectorAll('g.atenuado').length).toBe(1);
  });
});
