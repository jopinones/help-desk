import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MOTIVO_NO_EDITABLE, NuevoTicket, Ticket, puedeEditar } from '../../models/ticket';
import { TicketService } from '../../services/ticket';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  selector: 'app-ticket-form',
  styleUrl: './ticket-form.scss',
  templateUrl: './ticket-form.html',
})
export class TicketForm implements OnInit {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Si la ruta trae :id estamos editando; si no, creando.
  ticketId = this.route.snapshot.paramMap.get('id');
  fechaCreacion = '';
  cargando = signal(!!this.ticketId);

  estados: Ticket['estado'][] = ['Abierto', 'En proceso', 'Cerrado'];
  prioridades: Ticket['prioridad'][] = ['Baja', 'Media', 'Alta'];

  motivoNoEditable = MOTIVO_NO_EDITABLE;
  bloqueado = signal(false);
  guardando = signal(false);
  error = signal(false);

  ticketForm = this.fb.nonNullable.group({
    asunto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    estado: ['Abierto' as Ticket['estado'], Validators.required],
    prioridad: ['Media' as Ticket['prioridad'], Validators.required],
  });

  ngOnInit(): void {
    if (!this.ticketId) {
      return;
    }

    this.ticketService.obtenerTicket(this.ticketId).subscribe({
      next: (ticket) => {
        const { id, fechaCreacion, ...datos } = ticket;
        this.fechaCreacion = fechaCreacion;
        this.ticketForm.patchValue(datos);

        // Cubre quien llega por URL directa a /tickets/editar/:id
        if (!puedeEditar(ticket)) {
          this.bloqueado.set(true);
          this.ticketForm.disable();
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el ticket: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.bloqueado()) {
      return;
    }

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const ticket: NuevoTicket = {
      ...this.ticketForm.getRawValue(),
      fechaCreacion: this.fechaCreacion || new Date().toISOString().slice(0, 10),
    };

    this.guardando.set(true);
    this.error.set(false);

    const peticion = this.ticketId
      ? this.ticketService.actualizarTicket(this.ticketId, ticket)
      : this.ticketService.crearTicket(ticket);

    peticion.subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        console.error('Error al guardar el ticket: ', err);
        this.error.set(true);
        this.guardando.set(false);
      },
    });
  }
}
