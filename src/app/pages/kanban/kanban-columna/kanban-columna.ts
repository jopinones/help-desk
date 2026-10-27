import { Component, input } from '@angular/core';
import { Ticket } from '../../../models/ticket';
import { TarjetaTicket } from '../../tarjeta-ticket/tarjeta-ticket';

@Component({
  imports: [
    TarjetaTicket
  ],
  selector: 'app-kanban-columna',
  styleUrl: './kanban-columna.scss',
  templateUrl: './kanban-columna.html',
})
export class KanbanColumna {
  titulo = input.required<string>();
  // CAMBIO: se eliminó el input `estado`: nadie lo usaba (el padre ya filtra por estado) y
  // al ser required obligaba a pasarlo sin necesidad.
  // CORRECCIÓN: el input se llamaba `ticket` (singular) pero la plantilla usa tickets();
  // renombrado para que coincida con la lista que recibe.
  tickets = input.required<Ticket[]>();
}
