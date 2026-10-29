import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Ticket } from '../../../models/ticket';
import { TarjetaTicket } from '../../tarjeta-ticket/tarjeta-ticket';

@Component({
  imports: [TarjetaTicket, CdkDrag, CdkDragHandle, CdkDropList],
  selector: 'app-kanban-columna',
  styleUrl: './kanban-columna.scss',
  templateUrl: './kanban-columna.html',
})
export class KanbanColumna {
  estado = input.required<Ticket['estado']>();
  titulo = input.required<string>();
  // Propaga el bloqueo de guardado a las tarjetas.
  actualizando = input(false);
  tickets = input.required<Ticket[]>();

  cambiarEstado = output<{
    ticket: Ticket;
    nuevoEstado: Ticket['estado'];
  }>();
  soltarTicket(evento: CdkDragDrop<Ticket[], Ticket[], Ticket>): void {
    if (
      this.actualizando() ||
      !evento.isPointerOverContainer ||
      evento.previousContainer === evento.container
    ) {
      return;
    }
    // El padre persiste el estado; no mutamos los arrays filtrados de las columnas.
    // Si falla el servidor, la tarjeta permanece en su columna original.
    const ticket = evento.item.data;
    if (ticket.estado !== this.estado()) {
      this.cambiarEstado.emit({ ticket, nuevoEstado: this.estado() });
    }
  }
}
