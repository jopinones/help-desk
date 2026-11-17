import { Component, OnInit, inject, signal } from '@angular/core';
// AGREGADO: takeUntilDestroyed cancela la suscripción del debounce al destruir el componente.
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// CAMBIO: ya no se usa @ViewChild(MatPaginator); el paginador avisa con (page) y la página
// la entrega el servidor.
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Ticket } from '../../models/ticket';
import { FiltrosTickets, TicketService } from '../../services/ticket';
import { RouterLink } from '@angular/router';
import { EstadoTicket } from '../../shared/estado-ticket/estado-ticket';
import { PrioridadTicket } from '../../shared/prioridad-ticket/prioridad-ticket';
import { AccionesTicket } from '../../shared/acciones-ticket/acciones-ticket';
import { Sesion } from '../../services/sesion';
import { IdTicket } from '../../shared/id-ticket/id-ticket';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog-data';
// Diálogo informativo para avisar que el ticket se eliminó.
import { InfoDialog } from '../../shared/info-dialog/info-dialog';
import { InfoDialogData } from '../../shared/info-dialog/info-dialog-data';

// CORRECCIÓN: este archivo había sido sobrescrito con el código del SERVICIO (la clase
// TicketService), así que el componente Tickets desapareció. Se restauró el componente y la
// consulta paginada quedó en services/ticket.ts, que es donde corresponde.
@Component({
  selector: 'app-tickets',
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    DatePipe,
    RouterLink,
    MatIconModule,
    EstadoTicket,
    PrioridadTicket,
    AccionesTicket,
    IdTicket
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss'
})
export class Tickets implements OnInit {

  private ticketService = inject(TicketService);
  private dialog = inject(MatDialog);
  // Sesión, para mostrar Nuevo Ticket solo a los perfiles autorizados.
  protected readonly sesion = inject(Sesion);

  columnas: string[] = [
    'id',
    'asunto',
    'estado',
    'prioridad',
    'fechaCreacion',
    'acciones'
  ];

  // CAMBIO: la tabla ya no filtra ni pagina en el navegador (antes MatTableDataSource con
  // filterPredicate y el paginador conectado). Con la API externa el SERVIDOR entrega solo la
  // página pedida y aplica los filtros; el dataSource solo guarda las filas de esa página.
  dataSource = new MatTableDataSource<Ticket>();

  cargando = signal(true);
  error = signal(false);
  eliminandoId = signal<string | null>(null);

  // AGREGADO: estado de la paginación del servidor. pagina es base 0 (como MatPaginator); al
  // pedir a la API se envía pagina + 1 (la API cuenta desde 1).
  total = signal(0);
  pagina = signal(0);
  tamanoPagina = signal(5);
  // True tras la primera respuesta correcta: así las recargas (cambiar de página, filtrar) no
  // reemplazan la tabla por el mensaje "Cargando" y los filtros/paginador no parpadean.
  tuvoDatos = signal(false);

  filtros: FiltrosTickets = {
    texto: '',
    estado: '',
    prioridad: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  private consulta?: Subscription;
  // AGREGADO: la búsqueda por texto espera 300 ms sin teclear antes de consultar; sin esto se
  // lanzaría una petición a la API por cada letra.
  private busqueda = new Subject<void>();

  constructor() {
    this.busqueda
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.aplicarFiltros());
  }

  ngOnInit(): void {
    this.cargarTickets();
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.error.set(false);

    // CORRECCIÓN: se cancela la consulta anterior; si no, una respuesta lenta y antigua podía
    // llegar después de la nueva y mostrar tickets que ya no corresponden a los filtros.
    this.consulta?.unsubscribe();
    this.consulta = this.ticketService
      .obtenerTicketsPaginados(this.pagina() + 1, this.tamanoPagina(), this.filtros)
      .subscribe({
        next: (respuesta) => {
          // Si tras eliminar se vació la última página, se retrocede a la última que exista.
          if (respuesta.results.length === 0 && respuesta.count > 0 && this.pagina() > 0) {
            this.pagina.set(Math.ceil(respuesta.count / this.tamanoPagina()) - 1);
            this.cargarTickets();
            return;
          }

          this.dataSource.data = respuesta.results;
          this.total.set(respuesta.count);
          this.tuvoDatos.set(true);
          this.cargando.set(false);
        },

        error: (error) => {
          console.error('Error al cargar tickets:', error);
          this.error.set(true);
          this.cargando.set(false);
        }
      });
  }

  // AGREGADO: evento del paginador (cambio de página o de tamaño).
  cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanoPagina.set(evento.pageSize);
    this.cargarTickets();
  }

  // CAMBIO: el texto se envía con retraso (debounce); el resto de filtros, al instante.
  aplicarBusqueda(valor: string): void {
    this.filtros.texto = valor;
    this.busqueda.next();
  }

  aplicarFiltroEstado(valor: string): void {
    this.filtros.estado = valor;
    this.aplicarFiltros();
  }

  aplicarFiltroPrioridad(valor: string): void {
    this.filtros.prioridad = valor;
    this.aplicarFiltros();
  }

  aplicarFechaDesde(valor: string): void {
    this.filtros.fechaDesde = valor;

    // Solo se ajusta "Hasta" si ya tenía valor; con "Hasta" vacío la comparación con ''
    // siempre daría true y "Hasta" se rellenaría solo.
    if (this.filtros.fechaDesde !== '' && this.filtros.fechaHasta !== '' && this.filtros.fechaDesde > this.filtros.fechaHasta) {
      this.filtros.fechaHasta = this.filtros.fechaDesde;
    }

    this.aplicarFiltros();
  }

  aplicarFechaHasta(valor: string): void {
    this.filtros.fechaHasta = valor;

    // Misma protección para "Desde" vacío.
    if (this.filtros.fechaHasta !== '' && this.filtros.fechaDesde !== '' && this.filtros.fechaHasta < this.filtros.fechaDesde) {
      this.filtros.fechaDesde = this.filtros.fechaHasta;
    }

    this.aplicarFiltros();
  }

  // CAMBIO: antes asignaba dataSource.filter; ahora vuelve a la primera página y pide al
  // servidor los resultados con los filtros nuevos.
  aplicarFiltros(): void {
    this.pagina.set(0);
    this.cargarTickets();
  }

  limpiarFiltros(): void {
    this.filtros = {
      texto: '',
      estado: '',
      prioridad: '',
      fechaDesde: '',
      fechaHasta: ''
    };

    this.aplicarFiltros();
  }

  // AGREGADO: vista rápida de tickets críticos (abiertos y de prioridad alta).
  // Se calcula a partir de los filtros actuales, no de un indicador aparte; así el botón
  // refleja también la selección manual (Abierto + Alta) y vuelve a "Ver tickets críticos"
  // apenas cambia cualquiera de los dos valores.
  get filtrosCriticosActivos(): boolean {
    return this.filtros.estado === 'Abierto' && this.filtros.prioridad === 'Alta';
  }

  // AGREGADO: activa o desactiva la vista crítica. Solo toca Estado y Prioridad: el texto de
  // búsqueda, el rango de fechas y el tamaño de página se conservan. Llama una sola vez a
  // aplicarFiltros(), que vuelve a la primera página y lanza UNA consulta (no una por filtro).
  alternarFiltrosCriticos(): void {
    if (this.filtrosCriticosActivos) {
      this.filtros.estado = '';
      this.filtros.prioridad = '';
    } else {
      this.filtros.estado = 'Abierto';
      this.filtros.prioridad = 'Alta';
    }

    this.aplicarFiltros();
  }

  // AGREGADO: true si hay algún filtro activo (para distinguir "no hay tickets" de "ninguno
  // coincide con los filtros"). Reemplaza al getter sinResultados, que leía filteredData.
  get hayFiltros(): boolean {
    return Object.values(this.filtros).some(valor => valor.trim() !== '');
  }

  eliminar(ticket: Ticket): void {
    // El perfil Usuario no puede eliminar (el botón está oculto; esto lo refuerza).
    if (!this.sesion.puedeGestionarTickets()) {
      return;
    }
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      width: '430px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        titulo: 'Eliminar ticket',
        mensaje: '¿Está seguro que desea eliminar el ticket?',
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(
      resultado => {
        if (resultado !== true) {
          return;
        }

        this.eliminarTicket(ticket);
    });
  }

  private eliminarTicket(ticket: Ticket): void {
    this.eliminandoId.set(ticket.id);

    this.ticketService.eliminarTicket(ticket.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargarTickets();
        // Aviso informativo, solo cuando la API confirma la eliminación.
        this.dialog.open<InfoDialog, InfoDialogData>(InfoDialog, {
          data: {
            titulo: 'Ticket eliminado',
            mensaje: `El ticket "${ticket.asunto}" se eliminó correctamente.`,
          },
        });
      },
      error: (error) => {
        console.error('Error al intentar eliminar el ticket:', error);
        this.eliminandoId.set(null);
      }
    });
  }
}
