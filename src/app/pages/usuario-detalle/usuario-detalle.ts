import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuarioService } from '../../services/usuario';
// AGREGADO: reglas del modelo para deshabilitar "Editar" y explicar el motivo.
import { Usuario, motivoNoEditable, puedeEditar } from '../../models/usuario';

@Component({
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  selector: 'app-usuario-detalle',
  styleUrl: './usuario-detalle.scss',
  templateUrl: './usuario-detalle.html',
})
export class UsuarioDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  // CORRECCIÓN: `usurioService` -> `usuarioService` (typo en el nombre).
  private usuarioService = inject(UsuarioService);

  // AGREGADO: las reglas del modelo quedan disponibles para la plantilla.
  puedeEditar = puedeEditar;
  motivoNoEditable = motivoNoEditable;

  usuario = signal<Usuario | null>(null);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === null) {
      this.error.set(true);
      this.cargando.set(false);

      return;
    }

    this.cargarUsuario(id);
  }

  cargarUsuario(id: string): void {
    this.cargando.set(true);
    // CORRECCIÓN: estaba en `true`; al empezar a cargar no hay error, y así la
    // pantalla mostraba el error aunque la petición saliera bien.
    this.error.set(false);

    this.usuarioService.obtenerUsuario(id).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener el usuario', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replaceAll(' ', '-');
  }
}
