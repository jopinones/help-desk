import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';

@Component({
  imports: [MatCardModule, DatePipe],
  selector: 'app-tickets',
  styleUrl: './tickets.scss',
  templateUrl: './tickets.html',
})
export class Tickets implements OnInit {
  private ticketService = inject(TicketService);

  tickets = signal<Ticket[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.ticketService.obtenerTickets().subscribe({
      next: (datos) => {
        this.tickets.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los tickets', err);
        this.error.set('No se pudieron cargar los tickets. Verifica que la API esté activa.');
        this.cargando.set(false);
      },
    });
  }

  claseEstado(estado: Ticket['estado']): string {
    return estado.toLowerCase().replace(' ', '-');
  }
}
