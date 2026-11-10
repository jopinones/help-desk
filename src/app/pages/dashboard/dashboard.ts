import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
 
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
import { TarjetaIndicador } from '../../shared/tarjeta-indicador/tarjeta-indicador';
 
import { GraficoTickets, type SerieTickets } from '../../shared/grafico-tickets/grafico-tickets';
 
type FiltroPrioridad = Ticket['prioridad'] | 'Todas';
 
interface ResumenTickets {
  total: number;
  abiertos: number;
  enProceso: number;
  cerrados: number;
  altaPendientes: number;
}
 
@Component({
  selector: 'app-dashboard',
 
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    TarjetaIndicador,
    GraficoTickets
  ],
 
  templateUrl: './dashboard.html',
  // CORRECCIÓN: apuntaba a './dashboard.css' pero el archivo es .scss; el build fallaba.
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);
 
  readonly tickets = signal<Ticket[]>([]);
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
 
  readonly prioridadSeleccionada = signal<FiltroPrioridad>('Todas');
 
  readonly opcionesPrioridad: FiltroPrioridad[] = [
    'Todas',
    'Baja',
    'Media',
    'Alta'
  ];
 
  readonly ticketsFiltrados = computed(() => {
    const prioridad = this.prioridadSeleccionada();
    const tickets = this.tickets();
 
    return prioridad === 'Todas'
      ? tickets
      : tickets.filter(ticket => ticket.prioridad === prioridad);
  });
 
  readonly alcance = computed(() => {
    const prioridad = this.prioridadSeleccionada();
 
    return prioridad === 'Todas'
      ? 'Todas las prioridades'
      : `Prioridad ${prioridad.toLowerCase()}`;
  });
 
  readonly resumen = computed<ResumenTickets>(() => {
    const inicial: ResumenTickets = {
      total: 0,
      abiertos: 0,
      enProceso: 0,
      cerrados: 0,
      altaPendientes: 0
    };
 
    return this.ticketsFiltrados().reduce((acumulado, ticket) => {
      acumulado.total += 1;
 
      switch (ticket.estado) {
        case 'Abierto':
          acumulado.abiertos += 1;
          break;
 
        case 'En proceso':
          acumulado.enProceso += 1;
          break;
 
        case 'Cerrado':
          acumulado.cerrados += 1;
          break;
      }
 
      if (
        ticket.prioridad === 'Alta' &&
        ticket.estado !== 'Cerrado'
      ) {
        acumulado.altaPendientes += 1;
      }
 
      return acumulado;
    }, inicial);
  });
 
  readonly pendientes = computed(() => {
    const resumen = this.resumen();
 
    return resumen.abiertos + resumen.enProceso;
  });
 
  readonly serieEstados = computed<SerieTickets[]>(() => {
    const resumen = this.resumen();
 
    return [
      { etiqueta: 'Abiertos',
        cantidad: resumen.abiertos, color: '#2563eb'
      },
      { etiqueta: 'En proceso',
        cantidad: resumen.enProceso, color: '#b45309'
      },
      { etiqueta: 'Cerrados',
        cantidad: resumen.cerrados, color: '#15803d'
      }
    ];
  });
 
  // AGREGADO: tickets pendientes (Abierto + En proceso) por prioridad. Parte de
  // ticketsFiltrados(), igual que el resto de indicadores, así que responde al filtro de
  // prioridad: al elegir una, las otras dos barras quedan en 0. Siempre devuelve las tres
  // prioridades (Baja, Media, Alta) para que el gráfico mantenga sus tres barras.
  // Los colores coinciden con los de la etiqueta de prioridad (verde, ámbar, rojo).
  readonly seriePendientesPrioridad = computed<SerieTickets[]>(() => {
    const pendientes = this.ticketsFiltrados().filter(ticket => ticket.estado !== 'Cerrado');
    const contar = (prioridad: Ticket['prioridad']) =>
      pendientes.filter(ticket => ticket.prioridad === prioridad).length;

    return [
      { etiqueta: 'Baja', cantidad: contar('Baja'), color: '#15803d' },
      { etiqueta: 'Media', cantidad: contar('Media'), color: '#a16207' },
      { etiqueta: 'Alta', cantidad: contar('Alta'), color: '#b91c1c' }
    ];
  });

  // AGREGADO: tickets creados por día, para el gráfico de líneas. Sale de ticketsFiltrados(),
  // así que responde al filtro de prioridad y la suma de los puntos es siempre
  // resumen().total. Se agrupa por la parte de fecha de fechaCreacion (yyyy-MM-dd).
  // Los días sin tickets entre el primero y el último se rellenan con 0 para que el eje X
  // sea un calendario real y la línea no una los días como si fueran consecutivos. Si el
  // rango superara 120 días se muestran solo los días con tickets, para no dibujar cientos
  // de puntos (la suma sigue siendo la misma).
  readonly serieCreadosPorDia = computed<SerieTickets[]>(() => {
    const porDia = new Map<string, number>();
    for (const ticket of this.ticketsFiltrados()) {
      const dia = ticket.fechaCreacion.slice(0, 10);
      porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
    }

    const dias = [...porDia.keys()].sort();
    if (dias.length === 0) {
      return [];
    }

    // Se opera en UTC para que el cambio de horario no salte ni repita días.
    const aMs = (dia: string) => Date.parse(`${dia}T00:00:00Z`);
    const aDia = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const unDia = 86_400_000;
    const primero = aMs(dias[0]);
    const ultimo = aMs(dias[dias.length - 1]);
    const lista = (ultimo - primero) / unDia <= 120
      ? Array.from({ length: (ultimo - primero) / unDia + 1 }, (_, i) => aDia(primero + i * unDia))
      : dias;

    return lista.map(dia => {
      const [anio, mes, diaMes] = dia.split('-');
      return {
        etiqueta: `${diaMes}-${mes}-${anio}`,
        etiquetaCorta: `${diaMes}-${mes}`,
        cantidad: porDia.get(dia) ?? 0,
        color: '#2563eb'
      };
    });
  });

  readonly serieCierre = computed<SerieTickets[]>(() => [
      { etiqueta: 'Pendientes',
        cantidad: this.pendientes(), color: '#2563eb'
      },
      { etiqueta: 'Cerrados',
        // CORRECCIÓN: "Cerrados" usaba el ámbar (color de "En proceso"); ahora el verde, igual
        // que en el gráfico por estado y en su tarjeta.
        cantidad: this.resumen().cerrados, color: '#15803d'
      }
    ]
  );
 
  readonly porcentajeCerrados = computed(() => {
    const resumen = this.resumen();
 
    return resumen.total === 0
      ? 0
      : (resumen.cerrados / resumen.total) * 100;
  });
 
  readonly estadoPrioridadAlta = computed(() => {
    const prioridad = this.prioridadSeleccionada();
 
    if (prioridad === 'Baja' || prioridad === 'Media') {
      return 'La selección excluye la prioridad alta.';
    }
 
    return this.resumen().altaPendientes > 0
      ? 'Hay pendientes de prioridad alta.'
      : 'Sin pendientes de prioridad alta.';
  });
 
  readonly tituloOperacional = computed(() => {
    if (this.resumen().total === 0) {
      return 'Sin tickets en la selección';
    }
 
    return this.pendientes() === 0
      ? 'Todos los tickets de la selección están cerrados'
      : 'Hay tickets pendientes de cierre';
  });
 
  readonly textoOperacional = computed(() => {
    const resumen = this.resumen();
 
    if (resumen.total === 0) {
      return 'Selecciona otra prioridad o registra nuevos tickets.';
    }
 
    if (this.pendientes() === 0) {
      return `Tickets cerrados: ${resumen.cerrados}.`;
    }
 
    return [
      `Abiertos: ${resumen.abiertos}.`,
      `En proceso: ${resumen.enProceso}.`,
      `Pendientes de prioridad alta: ${resumen.altaPendientes}.`
    ].join(' ');
  });
 
  ngOnInit(): void {
    this.cargarTickets();
  }
 
  cambiarPrioridad(prioridad: FiltroPrioridad): void {
    this.prioridadSeleccionada.set(prioridad);
  }
 
  limpiarFiltro(): void {
    this.prioridadSeleccionada.set('Todas');
  }
 
  cargarTickets(): void {
    if (this.cargando()) {
      return;
    }
 
    this.cargando.set(true);
    this.errorCarga.set('');
 
    this.ticketService.obtenerTickets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tickets) => {
          this.tickets.set(tickets);
          this.cargando.set(false);
        },
 
        error: (error: unknown) => {
          console.error('Error al cargar el dashboard:', error);
 
          this.errorCarga.set(
            'No fue posible cargar los indicadores. Verifica la API y vuelve a intentarlo.'
          );
 
          this.cargando.set(false);
        }
      });
  }
}