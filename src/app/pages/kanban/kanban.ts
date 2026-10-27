import { Component, OnInit, computed, inject, signal } from '@angular/core';
// AGREGADO: botón Reintentar de la plantilla.
import { MatButtonModule } from '@angular/material/button';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
import { KanbanColumna } from './kanban-columna/kanban-columna';

@Component({
  imports: [KanbanColumna, MatButtonModule],
  selector: 'app-kanban',
  // CORRECCIÓN: apuntaba a './kanban.css' pero el archivo es .scss; el build fallaba.
  styleUrl: './kanban.scss',
  templateUrl: './kanban.html',
})
export class Kanban implements OnInit {
  private ticketService = inject(TicketService);

  estados = [
    {
      nombre: 'Abierto',
      titulo: 'Abiertos'
    },
    {
      nombre: 'En proceso',
      titulo: 'En proceso'
    },
    {
      nombre: 'Cerrado',
      titulo: 'Cerrados'
    }
  ] as const;

  tickets = signal<Ticket[]>([]);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.ticketService.obtenerTickets().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error("Error al cargar tickets: ", error);
        this.cargando.set(false);
        this.error.set(true);
      }
    });
  }

  // AGREGADO: tickets ordenados por fecha de creación, del más reciente al más antiguo.
  // Es un computed: se recalcula solo cuando cambia `tickets`, no en cada detección de
  // cambios. Se copia el arreglo ([...]) porque sort() modifica el original.
  // Las fechas vienen como texto ISO (yyyy-MM-dd), se comparan como fechas con Date.parse.
  private ticketsOrdenados = computed(() =>
    [...this.tickets()].sort(
      (a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion)
    )
  );

  // El tablero llama a este método por cada columna; filtra los tickets del estado dado.
  // CAMBIO: filtra sobre la lista ya ordenada, así cada columna queda ordenada por fecha.
  ticketsPorEstado(estado: Ticket['estado']): Ticket[] {
    return this.ticketsOrdenados().filter(ticket => ticket.estado === estado);
  }
}
