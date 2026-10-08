import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NuevoTicket, Ticket } from '../../models/ticket';
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
export class TicketForm {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private router = inject(Router);

  estados: Ticket['estado'][] = ['Abierto', 'En proceso', 'Cerrado'];
  prioridades: Ticket['prioridad'][] = ['Baja', 'Media', 'Alta'];

  guardando = signal(false);
  error = signal(false);

  ticketForm = this.fb.nonNullable.group({
    asunto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    estado: ['Abierto' as Ticket['estado'], Validators.required],
    prioridad: ['Media' as Ticket['prioridad'], Validators.required],
  });

  guardar(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const ticket: NuevoTicket = {
      ...this.ticketForm.getRawValue(),
      fechaCreacion: new Date().toISOString().slice(0, 10),
    };

    this.guardando.set(true);
    this.error.set(false);

    this.ticketService.crearTicket(ticket).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        console.error('Error al crear el ticket: ', err);
        this.error.set(true);
        this.guardando.set(false);
      },
    });
  }
}
