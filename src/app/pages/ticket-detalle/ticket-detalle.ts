import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../services/ticket';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MOTIVO_NO_EDITABLE, Ticket, puedeEditar } from '../../models/ticket';

@Component({
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  selector: 'app-ticket-detalle',
  styleUrl: './ticket-detalle.scss',
  templateUrl: './ticket-detalle.html',
})
export class TicketDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);

  puedeEditar = puedeEditar;
  motivoNoEditable = MOTIVO_NO_EDITABLE;

  ticket = signal<Ticket | null>(null);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === null) {
      this.error.set(true);
      this.cargando.set(false);

      return;
    }

    this.cargarTicket(id);
  }

  cargarTicket(id: string): void {
    this.cargando.set(true);
    this.error.set(false);

    this.ticketService.obtenerTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener el ticket: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replaceAll(' ', '-');
  }
}
