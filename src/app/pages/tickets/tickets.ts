import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
// AGREGADO: componente compartido con los botones Detalle, Editar y Eliminar de cada fila.
import { AccionesTicket } from '../../shared/acciones-ticket/acciones-ticket';
// AGREGADO: componente compartido que muestra el "#id" del ticket como enlace al detalle.
import { IdTicket } from '../../shared/id-ticket/id-ticket';
// AGREGADO: diálogo de confirmación compartido (y el tipo de sus datos) para eliminar.
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog-data';
// AGREGADO: diálogo informativo compartido (y el tipo de sus datos) para avisar la eliminación.
import { InfoDialog } from '../../shared/info-dialog/info-dialog';
import { InfoDialogData } from '../../shared/info-dialog/info-dialog-data';

@Component({
  // CAMBIO: se quitaron MatIconModule y MatTooltipModule (los usa ahora AccionesTicket) y se agregó AccionesTicket.
  imports: [
    MatTableModule, 
    MatPaginatorModule, 
    MatButtonModule, 
    RouterLink, 
    DatePipe,
    AccionesTicket,
    IdTicket
  ],
  selector: 'app-tickets',
  styleUrl: './tickets.scss',
  templateUrl: './tickets.html',
})
export class Tickets implements OnInit {
  
  private ticketService = inject(TicketService);
  // AGREGADO: servicio de Material para abrir el diálogo de confirmación.
  private dialog = inject(MatDialog);

  // CAMBIO: puedeEditar y motivoNoEditable se movieron al componente AccionesTicket.

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

  // CAMBIO: la confirmación ya no usa confirm() del navegador, sino el diálogo de Material
  // ConfirmDialog. Se abre y, solo si el usuario confirma (true), se elimina el ticket.
  eliminar(ticket: Ticket): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          titulo: 'Eliminar ticket',
          mensaje: `¿Estás seguro de eliminar el ticket "${ticket.asunto}"? Esta acción no se puede deshacer.`,
          textoConfirmar: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.eliminarTicket(ticket);
        }
      });
  }

  // CAMBIO: la llamada a la API se separó de eliminar() para ejecutarse solo tras confirmar.
  private eliminarTicket(ticket: Ticket): void {
    this.eliminandoId.set(ticket.id);

    this.ticketService.eliminarTicket(ticket.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargarTickets();

        // AGREGADO: aviso informativo (InfoDialog) de que el ticket se eliminó. Se muestra
        // solo cuando la API confirma la eliminación, no antes.
        this.dialog.open<InfoDialog, InfoDialogData>(InfoDialog, {
          data: {
            titulo: 'Ticket eliminado',
            mensaje: `El ticket "${ticket.asunto}" se eliminó correctamente.`,
          },
        });
      },
      error: (error) => {
        console.error('Error al intentar eliminar ticker:', error);
        this.eliminandoId.set(null)
          }
    });
  }

}
