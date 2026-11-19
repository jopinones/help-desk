import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// AGREGADO: diálogo de confirmación compartido (y el tipo de sus datos) para la salida con cambios.
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog-data';
import { finalize } from 'rxjs';
// CORRECCIÓN (repuesto): se había perdido la regla "un ticket cerrado no se edita" (puedeEditar y
// su motivo). La ruta ya no basta: quien llega por URL directa a /tickets/editar/:id con un ticket
// Cerrado debe ver el formulario bloqueado.
import { MOTIVO_NO_EDITABLE, Ticket, puedeEditar } from '../../models/ticket';
import { TicketService } from '../../services/ticket';
// CORRECCIÓN (repuesto): componentes compartidos para mostrar estado y prioridad como etiquetas
// de color en los selectores; la reescritura los había quitado.
import { EstadoTicket } from '../../shared/estado-ticket/estado-ticket';
import { PrioridadTicket } from '../../shared/prioridad-ticket/prioridad-ticket';

@Component({
  selector: 'app-ticket-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    EstadoTicket,
    PrioridadTicket
  ],
  templateUrl: './ticket-form.html',
  // CORRECCIÓN: apuntaba a './ticket-form.css' pero el archivo es .scss; el build fallaba (NG2008).
  styleUrl: './ticket-form.scss'
})
export class TicketForm implements OnInit {

  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  readonly modoEdicion = signal(false);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorCarga = signal(false);
  readonly errorGuardado = signal('');
  // AGREGADO (repuesto): true si el ticket cargado es de solo lectura (estado Cerrado).
  readonly bloqueado = signal(false);

  readonly motivoNoEditable = MOTIVO_NO_EDITABLE;
  // Opciones de los selectores (con los componentes compartidos).
  readonly estados: Ticket['estado'][] = ['Abierto', 'En proceso', 'Cerrado'];
  readonly prioridades: Ticket['prioridad'][] = ['Baja', 'Media', 'Alta'];

  ticketId: string | null = null;
  fechaCreacionOriginal = '';

  // CAMBIO: fb.nonNullable.group; con fb.group los controles son `string | null` y había que
  // escribir `?? ''` en cada lectura (y reset() los dejaría en null).
  readonly ticketForm = this.fb.nonNullable.group({
    asunto: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(100)
      ]
    ],

    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]
    ],

    estado: [
      'Abierto' as Ticket['estado'],
      Validators.required
    ],

    prioridad: [
      'Media' as Ticket['prioridad'],
      Validators.required
    ]
  });

  // AGREGADO: valores con los que el formulario "empieza": los predeterminados al crear y los del
  // ticket cargado al editar. Sirven para saber si hay cambios pendientes.
  private valoresIniciales = this.ticketForm.getRawValue();

  // AGREGADO: true si el formulario difiere de sus valores iniciales. Se comparan los valores y no
  // el indicador "dirty" de Angular: dirty queda en true aunque el usuario escriba algo y luego lo
  // borre dejando el valor original, y en ese caso no hay nada que perder.
  get hayCambios(): boolean {
    const actual = this.ticketForm.getRawValue();
    return (Object.keys(actual) as (keyof typeof actual)[])
      .some(campo => actual[campo] !== this.valoresIniciales[campo]);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id !== null) {
      this.ticketId = id;
      this.modoEdicion.set(true);
      this.cargarTicket(this.ticketId);
    }
  }

  cargarTicket(id: string): void {
    this.cargando.set(true);
    this.errorCarga.set(false);

    this.ticketService.obtenerTicket(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      // CAMBIO: finalize ya apaga `cargando` en éxito y error; se quitó el set(false) duplicado
      // de next y error.
      finalize(() => this.cargando.set(false))
    )
    .subscribe({
      next: ticket => {
        this.fechaCreacionOriginal = ticket.fechaCreacion;

        this.ticketForm.patchValue({
          asunto: ticket.asunto,
          descripcion: ticket.descripcion,
          estado: ticket.estado,
          prioridad: ticket.prioridad
        });

        // AGREGADO: al editar, el formulario comienza sin cambios pendientes: lo recién cargado
        // pasa a ser el valor inicial contra el que se comparan las modificaciones del usuario.
        this.valoresIniciales = this.ticketForm.getRawValue();

        // AGREGADO (repuesto): un ticket cerrado se muestra bloqueado, sin poder guardarse.
        if (!puedeEditar(ticket)) {
          this.bloqueado.set(true);
          this.ticketForm.disable();
        }
      },

      error: error => {
        console.error('Error al cargar el ticket:', error);
        this.errorCarga.set(true);
      }
    });
  }

  guardar(): void {
    // CAMBIO: también se ignora si el ticket está bloqueado (Cerrado).
    if (this.guardando() || this.cargando() || this.errorCarga() || this.bloqueado()) {
      return;
    }

    const controles = this.ticketForm.controls;

    controles.asunto.setValue(controles.asunto.value.trim());
    controles.descripcion.setValue(controles.descripcion.value.trim());

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const hoy = new Date();
    const valores = this.ticketForm.getRawValue();

    const fechaHoy = [hoy.getFullYear(), String(hoy.getMonth() + 1).padStart(2, '0'), String(hoy.getDate()).padStart(2, '0')].join('-');

    const ticket: Omit<Ticket, 'id'> = {
      ...valores,
      fechaCreacion: this.modoEdicion()
        ? this.fechaCreacionOriginal
        : fechaHoy
    };

    this.guardando.set(true);
    this.errorGuardado.set('');

    const operacion = this.ticketId !== null ? this.ticketService.actualizarTicket(this.ticketId, ticket) : this.ticketService.crearTicket(ticket);

    operacion.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando.set(false))
    ).subscribe({
      next: () => {
        void this.router.navigate(['/tickets']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al guardar el ticket:', error);
        this.errorGuardado.set(this.mensajeDeError(error));
      }
    });
  }

  private mensajeDeError(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
      case 400:
        return 'Error de validación. Por favor, revisa los datos ingresados.';
      case 401:
        return 'No estás autorizado para realizar esta acción.';
      // AGREGADO: con la API externa y los perfiles, un 403 significa que el rol no tiene permiso.
      case 403:
        return 'Tu perfil no tiene permiso para realizar esta acción.';
      case 404:
        return 'El ticket no fue encontrado.';
      case 500:
        return 'Error interno del servidor. Por favor, intenta nuevamente más tarde.';
      default:
        return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
    }
  }

  // CAMBIO: Cancelar ya no descarta en silencio lo escrito. Sin cambios vuelve directo al listado;
  // con cambios pendientes pide confirmación con el ConfirmDialog compartido. Si el usuario elige
  // seguir editando (o cierra el diálogo), el formulario queda tal cual, con todos sus valores.
  // Mientras se guarda no hace nada (el botón además está deshabilitado en la plantilla).
  cancelar(): void {
    if (this.guardando()) {
      return;
    }

    if (!this.hayCambios) {
      void this.router.navigate(['/tickets']);
      return;
    }

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        width: '430px',
        maxWidth: '95vw',
        // Sin cierre por clic fuera ni Escape: hay que decidir con los botones.
        disableClose: true,
        data: {
          titulo: 'Cambios sin guardar',
          mensaje: 'Tienes cambios sin guardar. ¿Deseas descartarlos?',
          textoConfirmar: 'Descartar',
          textoCancelar: 'Seguir editando'
        }
      })
      .afterClosed()
      .subscribe(descartar => {
        if (descartar === true) {
          void this.router.navigate(['/tickets']);
        }
      });
  }
}
