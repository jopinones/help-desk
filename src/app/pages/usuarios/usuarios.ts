import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// AGREGADO: reglas del modelo (qué usuario se puede editar / eliminar y por qué no).
import { Usuario, motivoNoEditable, puedeEditar, puedeEliminar } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario';

@Component({
  // AGREGADO: botones, íconos, tooltip y routerLink para las acciones de cada fila.
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
  ],
  selector: 'app-usuarios',
  styleUrl: './usuarios.scss',
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);

  // AGREGADO: columnas 'estado' y 'acciones'.
  columnas: string[] = ['id', 'nombre', 'email', 'rol', 'estado', 'acciones'];

  // AGREGADO: se exponen las reglas del modelo para usarlas en la plantilla.
  puedeEditar = puedeEditar;
  puedeEliminar = puedeEliminar;
  motivoNoEditable = motivoNoEditable;

  dataSource = new MatTableDataSource<Usuario>();

  cargando = signal(true);
  error = signal(false);
  // AGREGADO: id del usuario que se está eliminando, para deshabilitar su botón.
  eliminandoId = signal<string | null>(null);

  // El paginador vive dentro del @else, así que solo existe cuando termina la carga.
  // Un setter lo conecta a la tabla apenas aparece en la vista.
  @ViewChild(MatPaginator)
  set paginator(paginador: MatPaginator | undefined) {
    if (paginador) {
      this.dataSource.paginator = paginador;
    }
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.dataSource.data = usuarios;
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los usuarios: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  claseRol(rol: Usuario['rol']): string {
    return rol.toLowerCase();
  }

  // AGREGADO: clase CSS según el estado (estado-vigente, estado-bloqueado, estado-eliminado).
  claseEstado(estado: Usuario['estado']): string {
    return estado.toLowerCase();
  }

  // AGREGADO: eliminar usuario = borrado lógico (estado 'Eliminado'). Pide confirmación
  // y recarga la tabla al terminar; el usuario sigue en la API pero marcado como eliminado.
  eliminar(usuario: Usuario): void {
    if (!puedeEliminar(usuario)) {
      return;
    }

    const confirmado = confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre.trim()}"?`);

    if (!confirmado) {
      return;
    }

    this.eliminandoId.set(usuario.id);

    this.usuarioService.eliminarUsuario(usuario.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al eliminar el usuario: ', err);
        this.eliminandoId.set(null);
      },
    });
  }
}
