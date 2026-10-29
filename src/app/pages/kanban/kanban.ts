import { Component, OnInit, inject, signal } from '@angular/core';
import { Ticket, puedeEditar } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
import { KanbanColumna } from './kanban-columna/kanban-columna';

@Component({
  imports: [KanbanColumna],
  selector: 'app-kanban',
  styleUrl: './kanban.scss',
  templateUrl: './kanban.html',
})
export class Kanban implements OnInit {
  private ticketService = inject(TicketService);

  estados = [
    {
      nombre: 'Abierto',
      titulo: 'Abiertos',
    },
    {
      nombre: 'En proceso',
      titulo: 'En proceso',
    },
    {
      nombre: 'Cerrado',
      titulo: 'Cerrados',
    },
  ] as const;

  tickets = signal<Ticket[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);
  actualizandoID = signal<string | null>(null);
  mensajeError = signal('');

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);

    this.ticketService.obtenerTickets().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar tickets: ', error);
        this.cargando.set(false);
        this.errorCarga.set(true);
      },
    });
  }

  ticketsPorEstado(estado: Ticket['estado']): Ticket[] {
    return this.tickets()
      .filter((ticket) => ticket.estado === estado)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }

  actualizarEstado(ticket: Ticket, nuevoEstado: Ticket['estado']): void {
    if (!puedeEditar(ticket) || ticket.estado === nuevoEstado || this.actualizandoID() !== null) {
      return;
    }

    // Serializa los guardados para evitar solicitudes simult?neas y respuestas fuera de orden.
    this.actualizandoID.set(ticket.id);
    this.mensajeError.set('');

    const datosActualizados: Omit<Ticket, 'id'> = {
      asunto: ticket.asunto,
      descripcion: ticket.descripcion,
      estado: nuevoEstado,
      prioridad: ticket.prioridad,
      fechaCreacion: ticket.fechaCreacion,
    };

    this.ticketService.actualizarTicket(ticket.id, datosActualizados).subscribe({
      next: (ticketGuardado) => {
        this.tickets.update((lista) =>
          lista.map((actual) => (actual.id === ticketGuardado.id ? ticketGuardado : actual)),
        );

        this.actualizandoID.set(null);
      },
      error: (error) => {
        console.error('Error al intentar cambiar el estado del ticket', error);

        this.mensajeError.set('No fue posible cambiar el estado. Inténtelo nuevamente.');

        this.actualizandoID.set(null);
      },
    });
  }
}
