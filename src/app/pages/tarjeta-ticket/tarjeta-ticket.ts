import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Ticket } from '../../models/ticket';
// AGREGADO: componentes compartidos para mostrar el id (enlace al detalle) y la prioridad.
import { IdTicket } from '../../shared/id-ticket/id-ticket';
import { PrioridadTicket } from '../../shared/prioridad-ticket/prioridad-ticket';

@Component({
  // CORRECCIÓN: `imports` estaba vacío, pero la plantilla usa el pipe date y los componentes
  // compartidos. <mat-card> (que tampoco estaba importado) se reemplazó por un <article>
  // con estilos propios, que usa los mismos tokens --hd-* que el resto de la app.
  imports: [DatePipe, IdTicket, PrioridadTicket],
  selector: 'app-tarjeta-ticket',
  styleUrl: './tarjeta-ticket.scss',
  templateUrl: './tarjeta-ticket.html',
})
export class TarjetaTicket {
  // CORRECCIÓN: la plantilla llamaba a ticket() pero la clase no tenía ese input; la
  // columna le pasaba [ticket] y la compilación fallaba.
  ticket = input.required<Ticket>();
}
