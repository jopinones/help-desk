import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
// AGREGADO: interval emite cada segundo para el contador de espera; Subscription permite detenerlo.
import { Subscription, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
import { KanbanColumna } from './kanban-columna/kanban-columna';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
 
@Component({
  imports: [
    KanbanColumna,
    CdkDropListGroup,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    // AGREGADO: selector de fechas (Date Picker) para el filtro Desde - Hasta.
    MatDatepickerModule
  ],
  // AGREGADO: el datepicker necesita un adaptador de fechas; el nativo trabaja con Date.
  providers: [provideNativeDateAdapter()],
  selector: 'app-kanban',
  // CORRECCIÓN: apuntaba a './kanban.css' pero el archivo es .scss; el build fallaba.
  styleUrl: './kanban.scss',
  templateUrl: './kanban.html',
})
export class Kanban implements OnInit{
  private ticketService = inject(TicketService);
  private destroyRef = inject(DestroyRef);
 
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
  errorCarga = signal(false);
  actualizandoID = signal(<string | null>(null));
  mensajeError = signal('');
 
  textoBusqueda = signal('');
  estadoSeleccionado = signal('');
  prioridadSeleccionada = signal('');
  // AGREGADO: rango de fechas del filtro (null = sin límite). El picker entrega objetos Date.
  fechaDesde = signal<Date | null>(null);
  fechaHasta = signal<Date | null>(null);

  // AGREGADO: convierte un Date a "yyyy-MM-dd" usando la fecha LOCAL (toISOString usaría UTC y
  // podría correr el día). Así se compara como texto con ticket.fechaCreacion.slice(0, 10).
  private aTexto(fecha: Date | null): string {
    if (!fecha) {
      return '';
    }
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  ticketsFiltrados = computed(() => {
    const texto = this.textoBusqueda().trim().toLocaleLowerCase();
    const estado = this.estadoSeleccionado();
    const prioridad = this.prioridadSeleccionada();
    const desde = this.aTexto(this.fechaDesde());
    const hasta = this.aTexto(this.fechaHasta());
 
    return this.tickets().filter(ticket => {
      const coincidenciaTexto = texto === '' || [ticket.id, ticket.asunto, ticket.descripcion].some(valor => String(valor).toLocaleLowerCase().includes(texto));
 
      const coincidenciaEstado = estado === '' || ticket.estado === estado;
 
      const coincidenciaPrioridad = prioridad === '' || ticket.prioridad === prioridad;
 
      // AGREGADO: ambos extremos son inclusivos (Hasta incluye el día completo).
      const fecha = ticket.fechaCreacion.slice(0, 10);
      const coincidenciaFecha = (desde === '' || fecha >= desde) && (hasta === '' || fecha <= hasta);

      return coincidenciaTexto && coincidenciaEstado && coincidenciaPrioridad && coincidenciaFecha;
    });
  });
 
  ngOnInit(): void {
    this.cargarTickets();
  }
 
  // AGREGADO: segundos transcurridos esperando la respuesta de la API (contador en vivo del
  // mensaje "Cargando datos"). Se reinicia en cada carga y se detiene al terminar o fallar.
  segundosEspera = signal(0);
  private cronometro?: Subscription;

  // AGREGADO: arranca el contador. Se calcula con la hora real (Date.now) y no sumando 1 en
  // cada tick: así no se atrasa si el navegador demora un tick (pestaña en segundo plano).
  private iniciarCronometro(): void {
    this.detenerCronometro();
    const inicio = Date.now();
    this.segundosEspera.set(0);
    this.cronometro = interval(1000).subscribe(() =>
      this.segundosEspera.set(Math.floor((Date.now() - inicio) / 1000))
    );
  }

  // Si el componente se destruye con la carga en curso, se libera el temporizador. Se registra
  // una sola vez aquí (no en cada carga, que acumularía avisos de destrucción).
  private liberarAlDestruir = this.destroyRef.onDestroy(() => this.detenerCronometro());

  private detenerCronometro(): void {
    this.cronometro?.unsubscribe();
    this.cronometro = undefined;
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.iniciarCronometro();
 
    this.ticketService.obtenerTickets().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.cargando.set(false);
        this.detenerCronometro();
      },
      error: (error) => {
        console.error("Error al cargar tickets: ", error)
        this.cargando.set(false);
        this.errorCarga.set(true);
        this.detenerCronometro();
      }
    });
  }
 
  // Tickets filtrados de una columna, del más reciente al más antiguo (filter() ya devuelve
  // una copia, así que sort() no altera el signal).
  ticketsPorEstado(estado: Ticket['estado']): Ticket[] {
    return this.ticketsFiltrados().filter(ticket => ticket.estado === estado).sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }
 
  actualizarBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
  }
 
  actualizarEstadoSeleccionado(valor: string): void {
    this.estadoSeleccionado.set(valor);
  }
 
  actualizarPrioridadSeleccionada(valor: string): void {
    this.prioridadSeleccionada.set(valor);
  }
 
  // AGREGADO: el rango del picker emite cada extremo por separado (dateChange).
  actualizarFechaDesde(evento: MatDatepickerInputEvent<Date>): void {
    this.fechaDesde.set(evento.value);
  }

  actualizarFechaHasta(evento: MatDatepickerInputEvent<Date>): void {
    this.fechaHasta.set(evento.value);
  }

  limpiarFiltros(): void {
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    // CORRECCIÓN: antes se reasignaban los signals (= signal('')), pero ticketsFiltrados
    // (computed) seguía leyendo los signals originales y los filtros no se limpiaban.
    // Hay que conservar los mismos signals y cambiar su valor con set().
    this.textoBusqueda.set('');
    this.estadoSeleccionado.set('');
    this.prioridadSeleccionada.set('');
  }
 
  get sinResultados():boolean {
    return this.ticketsFiltrados().length === 0;
  }
 
  actualizarEstado(ticket: Ticket, nuevoEstado: Ticket['estado']): void {
    // CORRECCIÓN: antes solo se bloqueaba el mismo ticket; se podían lanzar guardados de
    // otros tickets en paralelo, aunque la interfaz queda bloqueada ([actualizando]) mientras
    // hay uno en curso. Ahora se ignora cualquier cambio si ya hay un guardado activo.
    if (ticket.estado === nuevoEstado || this.actualizandoID() !== null) {
      return;
    }
 
    this.actualizandoID.set(ticket.id);
    this.mensajeError.set('');
 
    const datosActualizados: Omit<Ticket, 'id'> = {
      asunto: ticket.asunto,
      descripcion: ticket.descripcion,
      estado: nuevoEstado,
      prioridad: ticket.prioridad,
      fechaCreacion: ticket.fechaCreacion
    };
 
    this.ticketService.actualizarTicket(ticket.id, datosActualizados).subscribe({
      next: (ticketGuardado) => {
        this.tickets.update(lista => lista.map(actual => actual.id === ticketGuardado.id ? ticketGuardado: actual));
 
        this.actualizandoID.set(null);
      },
      error: (error) => {
        console.error('Error al intentar cambiar el estado del ticket', error);
 
        this.mensajeError.set('No fue posible cambiar el estado. Inténtelo nuevamente.');
 
        this.actualizandoID.set(null);
      }
    });    
  }
}