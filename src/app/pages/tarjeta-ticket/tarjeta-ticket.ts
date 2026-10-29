import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Ticket } from '../../models/ticket';
import { IdTicket } from '../../shared/id-ticket/id-ticket';
import { PrioridadTicket } from '../../shared/prioridad-ticket/prioridad-ticket';
import { MatCardModule } from '@angular/material/card';

@Component({
  imports: [DatePipe, IdTicket, PrioridadTicket, MatCardModule],
  selector: 'app-tarjeta-ticket',
  styleUrl: './tarjeta-ticket.scss',
  templateUrl: './tarjeta-ticket.html',
})
export class TarjetaTicket {
  ticket = input.required<Ticket>();
  actualizando = input(false);
  cambiarEstado = output<{ ticket: Ticket; nuevoEstado: Ticket['estado'] }>();
  readonly estados: Ticket['estado'][] = ['Abierto', 'En proceso', 'Cerrado'];

  seleccionEstado(nuevoEstado: string): void {
    // El selector ofrece las mismas transiciones reversibles que el arrastre del tablero.
    if (this.actualizando() || nuevoEstado === this.ticket().estado) {
      return;
    }
    const estado = this.estados.find((estado) => estado === nuevoEstado);
    if (estado) {
      this.cambiarEstado.emit({ ticket: this.ticket(), nuevoEstado: estado });
    }
  }
}
