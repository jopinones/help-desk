import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ticket } from '../../models/ticket';

// AGREGADO: componente compartido que muestra el id de un ticket como "#id" y lo enlaza a su
// detalle. Antes la tabla de tickets lo escribía a mano con <a [routerLink]>#{{ ticket.id }}</a>.
@Component({
  // `imports` incluye RouterLink porque la plantilla usa [routerLink].
  imports: [RouterLink],
  selector: 'app-id-ticket',
  styleUrl: './id-ticket.scss',
  templateUrl: './id-ticket.html',
})
export class IdTicket {
  // Id del ticket (obligatorio). Se llama `ticketId` y no `id` para no chocar con el
  // atributo HTML global `id` del elemento <app-id-ticket>.
  ticketId = input.required<Ticket['id']>();
}
