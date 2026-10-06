import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario';

@Component({
  imports: [MatTableModule, MatPaginatorModule],
  selector: 'app-usuarios',
  styleUrl: './usuarios.scss',
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);

  columnas: string[] = ['id', 'nombre', 'email', 'rol'];

  dataSource = new MatTableDataSource<Usuario>();

  cargando = signal(true);
  error = signal(false);

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
}
