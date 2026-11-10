import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Ticket } from '../../models/ticket';
import { Usuario } from '../../models/usuario';
import { TicketService } from '../../services/ticket';
import { UsuarioService } from '../../services/usuario';
// AGREGADO: componente compartido que dibuja cada indicador del dashboard.
import { TarjetaIndicador, VarianteIndicador } from '../../shared/tarjeta-indicador/tarjeta-indicador';

// AGREGADO: forma de un indicador; coincide con los inputs de <app-tarjeta-indicador>.
interface Indicador {
  titulo: string;
  valor: number;
  unidad?: string;
  descripcion: string;
  apoyo?: string;
  icono: string;
  variante: VarianteIndicador;
}

@Component({
  imports: [RouterLink, MatIconModule, MatButtonModule, TarjetaIndicador],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private ticketService = inject(TicketService);
  private usuarioService = inject(UsuarioService);

  accesos = [
    { ruta: '/tickets', icono: 'confirmation_number', titulo: 'Tickets', descripcion: 'Consulta y gestiona las solicitudes de soporte.' },
    { ruta: '/tickets/nuevo', icono: 'add_circle', titulo: 'Crear ticket', descripcion: 'Registra una nueva solicitud.' },
    { ruta: '/kanban', icono: 'view_kanban', titulo: 'Kanban', descripcion: 'Visualiza el avance en un tablero.' },
    { ruta: '/reportes', icono: 'bar_chart', titulo: 'Reportes', descripcion: 'Revisa indicadores y resultados.' },
  ];

  // AGREGADO: datos de origen y estado de carga, con el mismo patrón que el resto de páginas.
  tickets = signal<Ticket[]>([]);
  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal(false);

  // AGREGADO: los indicadores se calculan a partir de los datos; al ser un computed se
  // recalculan solos cuando cambian tickets o usuarios. Reemplaza la tarjeta de prueba
  // ("Esto es una prueba", valor fijo 60) que había en la plantilla.
  indicadores = computed<Indicador[]>(() => {
    const tickets = this.tickets();
    const total = tickets.length;
    const contar = (estado: Ticket['estado']) => tickets.filter((t) => t.estado === estado).length;

    const abiertos = contar('Abierto');
    const enProceso = contar('En proceso');
    const cerrados = contar('Cerrado');
    const sinCerrar = total - cerrados;
    const altaSinCerrar = tickets.filter((t) => t.prioridad === 'Alta' && t.estado !== 'Cerrado').length;
    // Con 0 tickets se evita dividir por cero.
    const tasaCierre = total === 0 ? 0 : Math.round((cerrados / total) * 100);

    // Los usuarios eliminados (borrado lógico) no cuentan como registrados.
    const registrados = this.usuarios().filter((u) => u.estado !== 'Eliminado');
    const vigentes = registrados.filter((u) => u.estado === 'Vigente').length;

    return [
      { titulo: 'Total de tickets', valor: total, descripcion: 'Solicitudes registradas en el sistema.', apoyo: `${sinCerrar} sin cerrar`, icono: 'confirmation_number', variante: 'principal' },
      { titulo: 'Abiertos', valor: abiertos, descripcion: 'Esperando ser atendidos.', icono: 'inbox', variante: 'azul' },
      { titulo: 'En proceso', valor: enProceso, descripcion: 'Con un responsable trabajando en ellos.', icono: 'autorenew', variante: 'ambar' },
      { titulo: 'Cerrados', valor: cerrados, descripcion: 'Solicitudes resueltas.', icono: 'task_alt', variante: 'verde' },
      { titulo: 'Prioridad alta', valor: altaSinCerrar, descripcion: 'Tickets urgentes que siguen sin cerrar.', icono: 'priority_high', variante: 'roja' },
      { titulo: 'Tasa de cierre', valor: tasaCierre, unidad: '%', descripcion: 'Porcentaje de tickets cerrados.', icono: 'percent', variante: 'verde' },
      { titulo: 'Usuarios vigentes', valor: vigentes, descripcion: 'Pueden operar en el sistema.', apoyo: `de ${registrados.length} registrados`, icono: 'group', variante: 'neutra' },
    ];
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // AGREGADO: forkJoin espera ambas respuestas y las entrega juntas; si una falla, se muestra
  // el error para no presentar indicadores a medias.
  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(false);

    forkJoin({
      tickets: this.ticketService.obtenerTickets(),
      usuarios: this.usuarioService.obtenerUsuarios(),
    }).subscribe({
      next: ({ tickets, usuarios }) => {
        this.tickets.set(tickets);
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los indicadores: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }
}
