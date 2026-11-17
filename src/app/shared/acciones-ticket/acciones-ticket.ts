import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Sesion } from '../../services/sesion';
import { MOTIVO_NO_EDITABLE, Ticket, puedeEditar } from '../../models/ticket';

@Component({
  // CORRECCIÓN: `imports` estaba vacío, pero la plantilla usa routerLink, mat-icon-button,
  // mat-icon y matTooltip; sin estos imports el componente no compilaba.
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  selector: 'app-acciones-ticket',
  styleUrl: './acciones-ticket.scss',
  templateUrl: './acciones-ticket.html',
})
export class AccionesTicket {
  // CORRECCIÓN: la clase estaba vacía y la plantilla usaba ticket(), eliminando() y
  // solicitarEliminacion() que no existían. Se agregan:

  // AGREGADO: sesión; Editar y Eliminar solo se muestran a Soporte y Administrador. El perfil
  // Usuario solo ve el botón Detalle.
  protected readonly sesion = inject(Sesion);

  // Ticket sobre el que se actúan las acciones (obligatorio).
  ticket = input.required<Ticket>();

  // Lo informa el padre mientras se procesa la eliminación, para deshabilitar el botón.
  eliminando = input(false);

  // Aviso al padre de que se pidió eliminar. La confirmación y la llamada a la API siguen
  // en el componente padre; este componente solo muestra los botones.
  eliminar = output<Ticket>();

  // AGREGADO: regla de edición (los tickets cerrados no se editan) y su texto para el tooltip.
  editable = computed(() => puedeEditar(this.ticket()));
  motivoNoEditable = MOTIVO_NO_EDITABLE;

  solicitarEliminacion(): void {
    // AGREGADO: defensa por si el evento llegara sin el botón (el botón ya está oculto).
    if (!this.sesion.puedeGestionarTickets()) {
      return;
    }
    this.eliminar.emit(this.ticket());
  }
}
