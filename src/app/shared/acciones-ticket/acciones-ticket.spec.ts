import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccionesTicket } from './acciones-ticket';
import { Ticket } from '../../models/ticket';

const ticketBase: Ticket = {
  id: '1',
  asunto: 'Problema de acceso',
  descripcion: 'No puedo ingresar',
  estado: 'Abierto',
  prioridad: 'Alta',
  fechaCreacion: '2026-10-01',
};

describe('AccionesTicket', () => {
  let component: AccionesTicket;
  let fixture: ComponentFixture<AccionesTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesTicket],
      // CORRECCIÓN: la plantilla usa routerLink, que necesita el router.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionesTicket);
    component = fixture.componentInstance;
    // CORRECCIÓN: `ticket` es un input obligatorio; sin darle un valor no se puede crear.
    fixture.componentRef.setInput('ticket', ticketBase);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: Editar queda habilitado en un ticket abierto y deshabilitado en uno cerrado.
  it('deshabilita Editar si el ticket está cerrado', async () => {
    const editar = () =>
      (fixture.nativeElement as HTMLElement).querySelector('a[aria-label="Editar ticket"]');

    expect(editar()?.getAttribute('aria-disabled')).not.toBe('true');

    fixture.componentRef.setInput('ticket', { ...ticketBase, estado: 'Cerrado' });
    await fixture.whenStable();

    expect(editar()?.getAttribute('aria-disabled')).toBe('true');
  });

  // AGREGADO: al pulsar Eliminar se avisa al padre con el ticket.
  it('emite eliminar con el ticket', () => {
    const emitidos: Ticket[] = [];
    component.eliminar.subscribe((t) => emitidos.push(t));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.eliminar')
      ?.click();

    expect(emitidos).toEqual([ticketBase]);
  });
});
