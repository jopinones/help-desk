import { Component, input } from '@angular/core';
import { Ticket } from '../../models/ticket';

@Component({
  imports: [],
  selector: 'app-prioridad-ticket',
  // CORRECCIÓN: apuntaba a './prioridad-ticket.css', pero el archivo es .scss; el build fallaba al usarlo.
  styleUrl: './prioridad-ticket.scss',
  templateUrl: './prioridad-ticket.html',
})
export class PrioridadTicket {
  prioridad = input.required<Ticket['prioridad']>();
}
