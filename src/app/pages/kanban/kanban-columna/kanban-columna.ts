import { Component, input, output } from '@angular/core';
import { Ticket } from '../../../models/ticket';
import { TarjetaTicket } from '../../tarjeta-ticket/tarjeta-ticket';

@Component({
  imports: [TarjetaTicket],
  selector: 'app-kanban-columna',
  styleUrl: './kanban-columna.scss',
  templateUrl: './kanban-columna.html',
})
export class KanbanColumna {
  titulo = input.required<string>();
  // Propaga el bloqueo de guardado a las tarjetas.
  actualizando = input(false);
  tickets = input.required<Ticket[]>();

  cambiarEstado = output<{
    ticket: Ticket;
    nuevoEstado: Ticket['estado'];
  }>();
}
