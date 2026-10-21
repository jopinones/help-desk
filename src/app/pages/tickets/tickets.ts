import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MOTIVO_NO_EDITABLE, Ticket, puedeEditar } from '../../models/ticket';
import { TicketService } from '../../services/ticket';

@Component({
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, DatePipe],
  selector: 'app-tickets',
  styleUrl: './tickets.scss',
  templateUrl: './tickets.html',
})
export class Tickets implements OnInit {
  
  private ticketService = inject(TicketService);

  puedeEditar = puedeEditar;
  motivoNoEditable = MOTIVO_NO_EDITABLE;

  columnas: string[] = [
    'id', 
    'asunto', 
    'estado', 
    'prioridad', 
    'fechaCreacion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Ticket>();

  cargando = signal(true);
  error = signal(false);
  eliminandoId = signal<string | null>(null);

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

  eliminar(ticket: Ticket): void {
    const confirmado = confirm(`¿Estás seguro de eliminar el ticket "${ticket.asunto}"?`);

    if(!confirmado) {
      return;
    }

    this.eliminandoId.set(ticket.id);

    this.ticketService.eliminarTicket(ticket.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargarTickets();
      },
      error: (error) => {
        console.error('Error al intentar eliminar ticker:', error);
        this.eliminandoId.set(null)
          }
    });
  }

}
