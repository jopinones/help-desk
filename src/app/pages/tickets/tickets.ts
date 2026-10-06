import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';

@Component({
  imports: [MatTableModule, MatPaginatorModule, DatePipe],
  selector: 'app-tickets',
  styleUrl: './tickets.scss',
  templateUrl: './tickets.html',
})
export class Tickets implements OnInit {
  private ticketService = inject(TicketService);

  columnas: string[] = ['id', 'asunto', 'estado', 'prioridad', 'fechaCreacion'];

  dataSource = new MatTableDataSource<Ticket>();

  cargando = signal(true);
  error = signal(false);

  // El paginador vive dentro del @else, así que solo existe cuando termina la carga.
  // Un setter lo conecta a la tabla apenas aparece en la vista.
  @ViewChild(MatPaginator)
  set paginator(paginador: MatPaginator | undefined) {
    if (paginador) {
      this.dataSource.paginator = paginador;
    }
  }

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.ticketService.obtenerTickets().subscribe({
      next: (tickets) => {
        this.dataSource.data = tickets;
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los tickets: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replaceAll(' ', '-');
  }
}
