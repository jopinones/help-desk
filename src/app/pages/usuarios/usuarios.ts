import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario';

@Component({
  imports: [MatCardModule],
  selector: 'app-usuarios',
  styleUrl: './usuarios.scss',
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los usuarios', err);
        this.error.set('No se pudieron cargar los usuarios. Verifica que la API esté activa.');
        this.cargando.set(false);
      },
    });
  }

  claseRol(rol: Usuario['rol']): string {
    return rol.toLowerCase();
  }
}
