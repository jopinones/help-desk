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
// AGREGADO: componente compartido para mostrar el rol del usuario.
import { RolUsuario } from '../../shared/rol-usuario/rol-usuario';
// AGREGADO: diálogo de confirmación compartido (y el tipo de sus datos) para eliminar.
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog-data';
// AGREGADO: diálogo informativo compartido (y el tipo de sus datos) para avisar la eliminación.
import { InfoDialog } from '../../shared/info-dialog/info-dialog';
import { InfoDialogData } from '../../shared/info-dialog/info-dialog-data';

@Component({
  // AGREGADO: botones, íconos, tooltip y routerLink para las acciones de cada fila.
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    // AGREGADO: componente compartido que muestra el rol como etiqueta de color.
    RolUsuario,
  ],
  selector: 'app-usuarios',
  styleUrl: './usuarios.scss',
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  // AGREGADO: servicio de Material para abrir el diálogo de confirmación.
  private dialog = inject(MatDialog);

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

  // CAMBIO: se eliminó claseRol(); calculaba la clase CSS del rol y ahora lo resuelve
  // el componente RolUsuario.

  // AGREGADO: clase CSS según el estado (estado-vigente, estado-bloqueado, estado-eliminado).
  claseEstado(estado: Usuario['estado']): string {
    return estado.toLowerCase();
  }

  // AGREGADO: eliminar usuario = borrado lógico (estado 'Eliminado'). Pide confirmación
  // y recarga la tabla al terminar; el usuario sigue en la API pero marcado como eliminado.
  // CAMBIO: la confirmación ya no usa confirm() del navegador, sino el diálogo de Material
  // ConfirmDialog; solo si el usuario confirma (true) se ejecuta la eliminación.
  eliminar(usuario: Usuario): void {
    if (!puedeEliminar(usuario)) {
      return;
    }

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          titulo: 'Eliminar usuario',
          mensaje: `¿Estás seguro de eliminar al usuario "${usuario.nombre.trim()}"? Quedará marcado como Eliminado.`,
          textoConfirmar: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.eliminarUsuario(usuario);
        }
      });
  }

  // CAMBIO: la llamada a la API se separó de eliminar() para ejecutarse solo tras confirmar.
  private eliminarUsuario(usuario: Usuario): void {
    this.eliminandoId.set(usuario.id);

    this.usuarioService.eliminarUsuario(usuario.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargarUsuarios();

        // AGREGADO: aviso informativo (InfoDialog) de que el usuario se eliminó. Se muestra
        // solo cuando la API confirma el cambio, no antes.
        this.dialog.open<InfoDialog, InfoDialogData>(InfoDialog, {
          data: {
            titulo: 'Usuario eliminado',
            mensaje: `El usuario "${usuario.nombre.trim()}" quedó marcado como Eliminado.`,
          },
        });
      },
      error: (err) => {
        console.error('Error al eliminar el usuario: ', err);
        this.eliminandoId.set(null);
      },
    });
  }
}
